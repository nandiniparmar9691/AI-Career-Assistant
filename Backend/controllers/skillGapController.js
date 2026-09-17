const mongoose = require("mongoose");
const Resume = require("../models/Resume");
const JobDescription = require("../models/JobDescription");
const ResumeMatch = require("../models/ResumeMatch");
const SkillGap = require("../models/SkillGap");
const { analyzeSkillGap } = require("../services/skillGapService");

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

const findOwnedMatchOrThrow = async (id, userId) => {
  if (!mongoose.isValidObjectId(id)) {
    throw makeStatusError("Invalid match id", 400);
  }
  const match = await ResumeMatch.findById(id);
  if (!match || String(match.userId) !== String(userId)) {
    throw makeStatusError("Match not found", 404);
  }
  return match;
};

const toSafeSummary = (doc) => {
  const resume = doc.resumeId || {};
  const jd = doc.jobDescriptionId || {};
  const match = doc.resumeMatchId || {};
  return {
    id: doc._id,
    resumeId: doc.resumeId ? doc.resumeId._id || doc.resumeId : null,
    jobDescriptionId: doc.jobDescriptionId
      ? doc.jobDescriptionId._id || doc.jobDescriptionId
      : null,
    resumeMatchId: doc.resumeMatchId
      ? doc.resumeMatchId._id || doc.resumeMatchId
      : null,
    resumeName: resume.fileName || "",
    jobTitle: jd.title || "",
    company: jd.company || "",
    matchPercentage:
      doc.matchPercentage != null
        ? doc.matchPercentage
        : match.matchPercentage || null,
    strengthsCount: Array.isArray(doc.strengths) ? doc.strengths.length : 0,
    missingCount:
      (Array.isArray(doc.missingSkills) ? doc.missingSkills.length : 0) +
      (Array.isArray(doc.missingTechnologies)
        ? doc.missingTechnologies.length
        : 0) +
      (Array.isArray(doc.missingKeywords) ? doc.missingKeywords.length : 0),
    overallSummary: doc.overallSummary || "",
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
};

const toFullSkillGap = (doc) => {
  const summary = toSafeSummary(doc);
  return {
    ...summary,
    strengths: doc.strengths || [],
    missingSkills: doc.missingSkills || [],
    missingTechnologies: doc.missingTechnologies || [],
    missingKeywords: doc.missingKeywords || [],
    recommendations: doc.recommendations || [],
    overallSummary: doc.overallSummary || "",
  };
};

// @desc    Create or update a skill gap analysis from a saved resume-JD match
// @route   POST /api/skill-gaps
// @access  Private
const createSkillGap = async (req, res) => {
  try {
    const { resumeId, jobDescriptionId, resumeMatchId } = req.body || {};

    if (!resumeId || !jobDescriptionId || !resumeMatchId) {
      return res.status(400).json({
        success: false,
        message:
          "Please provide the resume, job description and the match you want to analyze.",
      });
    }

    const resume = await findOwnedResumeOrThrow(resumeId, req.user._id);
    const jd = await findOwnedJobDescriptionOrThrow(
      jobDescriptionId,
      req.user._id
    );
    const match = await findOwnedMatchOrThrow(resumeMatchId, req.user._id);

    if (
      String(match.resumeId) !== String(resume._id) ||
      String(match.jobDescriptionId) !== String(jd._id)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "The selected match does not correspond to the selected resume and job description.",
      });
    }

    const analysis = await analyzeSkillGap(match.analysis, resume, jd);

    const skillGap = await SkillGap.findOneAndUpdate(
      {
        userId: req.user._id,
        resumeId: resume._id,
        jobDescriptionId: jd._id,
      },
      {
        $set: {
          resumeMatchId: match._id,
          matchPercentage: match.matchPercentage,
          strengths: analysis.strengths,
          missingSkills: analysis.missingSkills,
          missingTechnologies: analysis.missingTechnologies,
          missingKeywords: analysis.missingKeywords,
          recommendations: analysis.recommendations,
          overallSummary: analysis.overallSummary,
        },
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    );

    return res.status(200).json({
      success: true,
      message: "Skill gap analysis completed successfully.",
      skillGap: toFullSkillGap(skillGap),
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }
    console.error("Create skill gap error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to analyze the skill gap right now. Please try again.",
    });
  }
};

// @desc    Get all of the current user's skill gaps
// @route   GET /api/skill-gaps
// @access  Private
const getMySkillGaps = async (req, res) => {
  try {
    const skillGaps = await SkillGap.find({ userId: req.user._id })
      .populate("resumeId", "fileName")
      .populate("jobDescriptionId", "title company")
      .populate("resumeMatchId", "matchPercentage")
      .sort({ updatedAt: -1 });

    return res.status(200).json({
      success: true,
      skillGaps: skillGaps.map(toSafeSummary),
    });
  } catch (error) {
    console.error("List skill gaps error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error, please try again",
    });
  }
};

// @desc    Get a single skill gap (owner only)
// @route   GET /api/skill-gaps/:id
// @access  Private
const getSkillGapById = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid skill gap id",
      });
    }

    const skillGap = await SkillGap.findById(req.params.id)
      .populate("resumeId", "fileName")
      .populate("jobDescriptionId", "title company")
      .populate("resumeMatchId", "matchPercentage");

    if (!skillGap || String(skillGap.userId) !== String(req.user._id)) {
      return res.status(404).json({
        success: false,
        message: "Skill gap not found",
      });
    }

    return res.status(200).json({
      success: true,
      skillGap: toFullSkillGap(skillGap),
    });
  } catch (error) {
    console.error("Get skill gap error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error, please try again",
    });
  }
};

// @desc    Delete a skill gap (owner only)
// @route   DELETE /api/skill-gaps/:id
// @access  Private
const deleteSkillGap = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid skill gap id",
      });
    }

    const skillGap = await SkillGap.findById(req.params.id);

    if (!skillGap || String(skillGap.userId) !== String(req.user._id)) {
      return res.status(404).json({
        success: false,
        message: "Skill gap not found",
      });
    }

    await skillGap.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Skill gap deleted successfully",
    });
  } catch (error) {
    console.error("Delete skill gap error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error, please try again",
    });
  }
};

module.exports = {
  createSkillGap,
  getMySkillGaps,
  getSkillGapById,
  deleteSkillGap,
};