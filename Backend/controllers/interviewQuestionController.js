const mongoose = require("mongoose");
const Resume = require("../models/Resume");
const JobDescription = require("../models/JobDescription");
const ResumeMatch = require("../models/ResumeMatch");
const SkillGap = require("../models/SkillGap");
const InterviewQuestionSet = require("../models/InterviewQuestionSet");
const { generateInterviewQuestions } = require("../services/interviewQuestionService");

const makeStatusError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const findOwnedResumeOrThrow = async (id, userId) => {
  if (!mongoose.isValidObjectId(id)) {
    throw makeStatusError("Invalid resume id", 400);
  }
  const resume = await Resume.findById(id);
  if (!resume || String(resume.userId) !== String(userId)) {
    throw makeStatusError("Resume not found", 404);
  }
  return resume;
};

const findOwnedJobDescriptionOrThrow = async (id, userId) => {
  if (!mongoose.isValidObjectId(id)) {
    throw makeStatusError("Invalid job description id", 400);
  }
  const jd = await JobDescription.findById(id);
  if (!jd || String(jd.userId) !== String(userId)) {
    throw makeStatusError("Job description not found", 404);
  }
  return jd;
};

const asSafeSummary = (doc) => {
  const resume = doc.resumeId || {};
  const jd = doc.jobDescriptionId || {};
  return {
    id: doc._id,
    resumeId: doc.resumeId ? doc.resumeId._id || doc.resumeId : null,
    jobDescriptionId: doc.jobDescriptionId
      ? doc.jobDescriptionId._id || doc.jobDescriptionId
      : null,
    resumeMatchId: doc.resumeMatchId ? doc.resumeMatchId._id || doc.resumeMatchId : null,
    skillGapId: doc.skillGapId ? doc.skillGapId._id || doc.skillGapId : null,
    resumeName: resume.fileName || "",
    jobTitle: jd.title || "",
    company: jd.company || "",
    targetRole: doc.targetRole || "",
    difficulty: doc.difficulty || "MEDIUM",
    totalQuestions: doc.totalQuestions || 0,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
};

const toFullQuestionSet = (doc) => {
  const summary = asSafeSummary(doc);
  return {
    ...summary,
    questions: doc.questions || [],
  };
};

const setsMatch = (existing, candidate) => {
  const a = existing && Array.isArray(existing.questions) ? existing.questions : [];
  const b = candidate && Array.isArray(candidate.questions) ? candidate.questions : [];
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i].question !== b[i].question) return false;
    if (a[i].category !== b[i].category) return false;
    if (a[i].difficulty !== b[i].difficulty) return false;
  }
  return true;
};

// @desc    Generate a personalized interview question set
// @route   POST /api/interview-questions/generate
// @access  Private
const generateQuestions = async (req, res) => {
  try {
    const { resumeId, jobDescriptionId } = req.body || {};
    if (!resumeId || !jobDescriptionId) {
      return res.status(400).json({
        success: false,
        message: "Please select a resume and a job description.",
      });
    }

    const resume = await findOwnedResumeOrThrow(resumeId, req.user._id);
    const jd = await findOwnedJobDescriptionOrThrow(jobDescriptionId, req.user._id);

    const reqDifficulty = (req.body && req.body.difficulty) || "MEDIUM";
    const reqCount = req.body.questionCount != null ? req.body.questionCount : 15;

    const resumeMatch = await ResumeMatch.findOne({
      userId: req.user._id,
      resumeId: resume._id,
      jobDescriptionId: jd._id,
    }).sort({ createdAt: -1 });

    const skillGap = await SkillGap.findOne({
      userId: req.user._id,
      resumeId: resume._id,
      jobDescriptionId: jd._id,
    }).sort({ createdAt: -1 });

    const generated = await generateInterviewQuestions({
      resume,
      jobDescription: jd,
      resumeMatch: resumeMatch || null,
      skillGap: skillGap || null,
      difficulty: reqDifficulty,
      questionCount: reqCount,
    });

    if (!generated.questions || generated.questions.length === 0) {
      return res.status(502).json({
        success: false,
        message:
          "Unable to generate interview questions right now. Please try again.",
      });
    }

    const targetRole = generated.targetRole || "";
    const difficulty = generated.difficulty;
    const setBody = {
      userId: req.user._id,
      resumeId: resume._id,
      jobDescriptionId: jd._id,
      resumeMatchId: resumeMatch ? resumeMatch._id : undefined,
      skillGapId: skillGap ? skillGap._id : undefined,
      targetRole,
      difficulty,
      questions: generated.questions,
      totalQuestions: generated.questions.length,
    };

    const latest = await InterviewQuestionSet.find({
      userId: req.user._id,
      resumeId: resume._id,
      jobDescriptionId: jd._id,
      difficulty,
    })
      .sort({ createdAt: -1 })
      .limit(1);

    if (latest[0] && setsMatch(latest[0], generated.questions)) {
      return res.status(200).json({
        success: true,
        message: "An identical question set already exists for this selection.",
        questionSet: toFullQuestionSet(latest[0]),
      });
    }

    const questionSet = await InterviewQuestionSet.create(setBody);

    return res.status(200).json({
      success: true,
      message: "Interview questions generated successfully.",
      questionSet: toFullQuestionSet(questionSet),
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }
    console.error("Generate interview questions error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to generate interview questions right now. Please try again.",
    });
  }
};

// @desc    Get all of the current user's question sets
// @route   GET /api/interview-questions
// @access  Private
const getMyQuestionSets = async (req, res) => {
  try {
    const sets = await InterviewQuestionSet.find({ userId: req.user._id })
      .populate("resumeId", "fileName")
      .populate("jobDescriptionId", "title company")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      questionSets: sets.map(asSafeSummary),
    });
  } catch (error) {
    console.error("List interview question sets error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error, please try again",
    });
  }
};

// @desc    Get a single question set (owner only)
// @route   GET /api/interview-questions/:id
// @access  Private
const getQuestionSetById = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid question set id",
      });
    }

    const questionSet = await InterviewQuestionSet.findById(req.params.id)
      .populate("resumeId", "fileName")
      .populate("jobDescriptionId", "title company");

    if (!questionSet || String(questionSet.userId) !== String(req.user._id)) {
      return res.status(404).json({
        success: false,
        message: "Question set not found",
      });
    }

    return res.status(200).json({
      success: true,
      questionSet: toFullQuestionSet(questionSet),
    });
  } catch (error) {
    console.error("Get interview question set error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error, please try again",
    });
  }
};

// @desc    Delete a question set (owner only)
// @route   DELETE /api/interview-questions/:id
// @access  Private
const deleteQuestionSet = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid question set id",
      });
    }

    const questionSet = await InterviewQuestionSet.findById(req.params.id);

    if (!questionSet || String(questionSet.userId) !== String(req.user._id)) {
      return res.status(404).json({
        success: false,
        message: "Question set not found",
      });
    }

    await questionSet.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Question set deleted successfully",
    });
  } catch (error) {
    console.error("Delete interview question set error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error, please try again",
    });
  }
};

module.exports = {
  generateQuestions,
  getMyQuestionSets,
  getQuestionSetById,
  deleteQuestionSet,
};