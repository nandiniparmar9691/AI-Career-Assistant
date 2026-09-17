const mongoose = require("mongoose");
const MockInterview = require("../models/MockInterview");
const Resume = require("../models/Resume");
const JobDescription = require("../models/JobDescription");
const InterviewQuestionSet = require("../models/InterviewQuestionSet");
const { evaluateMockInterview } = require("../services/interviewEvaluationService");

const MAX_ANSWER_CHARS = 10000;

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

const asString = (value) => (typeof value === "string" ? value.trim() : "");

const asStringArray = (value) =>
  Array.isArray(value)
    ? value
        .filter((item) => typeof item === "string" || typeof item === "number")
        .map((item) => String(item).trim())
        .filter(Boolean)
    : [];

const clampScore = (value) => {
  const num = Math.round(Number(value));
  if (!Number.isFinite(num)) return null;
  return Math.max(0, Math.min(100, num));
};

const toSafeSummary = (doc) => {
  const resume = doc.resumeId || {};
  const jd = doc.jobDescriptionId || {};
  const evaluation = doc.evaluation || {};
  return {
    id: doc._id,
    resumeId: doc.resumeId ? doc.resumeId._id || doc.resumeId : null,
    jobDescriptionId: doc.jobDescriptionId
      ? doc.jobDescriptionId._id || doc.jobDescriptionId
      : null,
    questionSetId: doc.questionSetId || null,
    resumeName: resume.fileName || "",
    jobTitle: jd.title || "",
    company: jd.company || "",
    targetRole: doc.targetRole || "",
    difficulty: doc.difficulty || "MEDIUM",
    status: doc.status || "NOT_STARTED",
    currentQuestionIndex: doc.currentQuestionIndex || 0,
    totalQuestions: Array.isArray(doc.answers) ? doc.answers.length : 0,
    answeredCount: Array.isArray(doc.answers)
      ? doc.answers.filter((a) => asString(a.answer)).length
      : 0,
    overallScore:
      evaluation.overallScore != null ? clampScore(evaluation.overallScore) : null,
    startedAt: doc.startedAt,
    completedAt: doc.completedAt,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
};

const toFullMockInterview = (doc) => {
  const summary = toSafeSummary(doc);
  const evaluation = doc.evaluation || {};
  const answers = (doc.answers || []).map((a) => ({
    questionId: a.questionId || "",
    question: a.question || "",
    category: a.category || "",
    difficulty: a.difficulty || "",
    expectedTopics: a.expectedTopics || [],
    whyAsked: a.whyAsked || "",
    answer: a.answer || "",
    answeredAt: a.answeredAt || null,
    score: a.score != null ? clampScore(a.score) : null,
    evaluation: {
      strengths: asStringArray(a.evaluation && a.evaluation.strengths),
      weaknesses: asStringArray(a.evaluation && a.evaluation.weaknesses),
      feedback: asString(a.evaluation && a.evaluation.feedback),
      suggestedAnswerPoints: asStringArray(
        a.evaluation && a.evaluation.suggestedAnswerPoints
      ),
    },
  }));
  const questionEvaluations = answers.map((a, index) => ({
    questionIndex: index,
    score: a.score,
    strengths: a.evaluation.strengths,
    weaknesses: a.evaluation.weaknesses,
    feedback: a.evaluation.feedback,
    suggestedAnswerPoints: a.evaluation.suggestedAnswerPoints,
  }));
  return {
    ...summary,
    answers,
    evaluation: {
      overallScore:
        evaluation.overallScore != null ? clampScore(evaluation.overallScore) : null,
      technicalScore:
        evaluation.technicalScore != null
          ? clampScore(evaluation.technicalScore)
          : null,
      communicationScore:
        evaluation.communicationScore != null
          ? clampScore(evaluation.communicationScore)
          : null,
      relevanceScore:
        evaluation.relevanceScore != null
          ? clampScore(evaluation.relevanceScore)
          : null,
      strengths: asStringArray(evaluation.strengths),
      weaknesses: asStringArray(evaluation.weaknesses),
      recommendations: asStringArray(evaluation.recommendations),
      recommendedTopics: asStringArray(evaluation.recommendedTopics),
      summary: asString(evaluation.summary),
      questionEvaluations,
    },
  };
};

// @desc    Start a new mock interview and return the first question
// @route   POST /api/mock-interviews
// @access  Private
const startMockInterview = async (req, res) => {
  try {
    const { resumeId, jobDescriptionId, questionSetId } = req.body || {};
    if (!resumeId || !jobDescriptionId || !questionSetId) {
      return res.status(400).json({
        success: false,
        message: "Please select a resume, a job description and a question set.",
      });
    }

    const resume = await findOwnedResumeOrThrow(resumeId, req.user._id);
    const jd = await findOwnedJobDescriptionOrThrow(jobDescriptionId, req.user._id);

    if (!mongoose.isValidObjectId(questionSetId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid question set id",
      });
    }
    const questionSet = await InterviewQuestionSet.findById(questionSetId);
    if (
      !questionSet ||
      String(questionSet.userId) !== String(req.user._id)
    ) {
      return res.status(404).json({
        success: false,
        message: "Question set not found",
      });
    }
    if (
      String(questionSet.resumeId) !== String(resume._id) ||
      String(questionSet.jobDescriptionId) !== String(jd._id)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "The selected question set was not created for this resume and job description.",
      });
    }

    const questions = Array.isArray(questionSet.questions)
      ? questionSet.questions
      : [];
    if (questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: "The selected question set is empty.",
      });
    }

    let interview = await MockInterview.findOne({
      userId: req.user._id,
      questionSetId: questionSet._id,
      status: "IN_PROGRESS",
    });

    if (interview) {
      interview = await interview.populate("resumeId", "fileName");
      interview = await interview.populate("jobDescriptionId", "title company");
      return res.status(200).json({
        success: true,
        message: "You already have an in-progress interview for this question set.",
        interview: toFullMockInterview(interview),
      });
    }

    const answers = questions.map((q) => ({
      questionId: "",
      question: q.question || "",
      category: q.category || "",
      difficulty: q.difficulty || "",
      expectedTopics: asStringArray(q.expectedTopics),
      whyAsked: q.whyAsked || "",
      answer: "",
    }));

    interview = await MockInterview.create({
      userId: req.user._id,
      resumeId: resume._id,
      jobDescriptionId: jd._id,
      questionSetId: questionSet._id,
      targetRole: asString(questionSet.targetRole),
      difficulty: asString(questionSet.difficulty) || "MEDIUM",
      status: "IN_PROGRESS",
      currentQuestionIndex: 0,
      startedAt: new Date(),
      answers,
    });

    interview = await interview.populate("resumeId", "fileName");
    interview = await interview.populate("jobDescriptionId", "title company");

    return res.status(201).json({
      success: true,
      message: "Mock interview started.",
      interview: toFullMockInterview(interview),
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }
    console.error("Start mock interview error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to start the mock interview right now. Please try again.",
    });
  }
};

// @desc    Get all of the current user's mock interviews
// @route   GET /api/mock-interviews
// @access  Private
const getMyMockInterviews = async (req, res) => {
  try {
    const interviews = await MockInterview.find({ userId: req.user._id })
      .populate("resumeId", "fileName")
      .populate("jobDescriptionId", "title company")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      mockInterviews: interviews.map(toSafeSummary),
    });
  } catch (error) {
    console.error("List mock interviews error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error, please try again",
    });
  }
};

// @desc    Get a single mock interview (owner only)
// @route   GET /api/mock-interviews/:id
// @access  Private
const getMockInterviewById = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid mock interview id",
      });
    }

    const interview = await MockInterview.findById(req.params.id)
      .populate("resumeId", "fileName")
      .populate("jobDescriptionId", "title company");

    if (!interview || String(interview.userId) !== String(req.user._id)) {
      return res.status(404).json({
        success: false,
        message: "Mock interview not found",
      });
    }

    return res.status(200).json({
      success: true,
      interview: toFullMockInterview(interview),
    });
  } catch (error) {
    console.error("Get mock interview error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error, please try again",
    });
  }
};

// @desc    Submit an answer for the current question and move to the next
// @route   PATCH /api/mock-interviews/:id/answer
// @access  Private
const submitAnswer = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid mock interview id",
      });
    }

    const interview = await MockInterview.findById(req.params.id);
    if (!interview || String(interview.userId) !== String(req.user._id)) {
      return res.status(404).json({
        success: false,
        message: "Mock interview not found",
      });
    }

    if (interview.status === "COMPLETED") {
      return res.status(400).json({
        success: false,
        message: "This interview is already completed.",
      });
    }

    const answer = asString(req.body && req.body.answer);
    if (!answer) {
      return res.status(400).json({
        success: false,
        message: "Please provide an answer.",
      });
    }
    if (answer.length > MAX_ANSWER_CHARS) {
      return res.status(400).json({
        success: false,
        message: `Answer is too long. Please keep it under ${MAX_ANSWER_CHARS} characters.`,
      });
    }

    const answers = Array.isArray(interview.answers) ? interview.answers : [];
    if (answers.length === 0) {
      return res.status(400).json({
        success: false,
        message: "This interview has no questions.",
      });
    }

    const index = Number(interview.currentQuestionIndex) || 0;

    if (index >= answers.length) {
      return res.status(400).json({
        success: false,
        message: "All questions have already been answered. Complete the interview to see your evaluation.",
      });
    }

    if (asString(answers[index].answer)) {
      return res.status(400).json({
        success: false,
        message: "This question has already been answered.",
      });
    }

    answers[index].answer = answer;
    answers[index].answeredAt = new Date();

    const nextIndex = index + 1;
    interview.currentQuestionIndex = nextIndex;

    await interview.save();

    const populated = await MockInterview.findById(interview._id)
      .populate("resumeId", "fileName")
      .populate("jobDescriptionId", "title company");

    const full = toFullMockInterview(populated);
    const allAnswered = nextIndex >= answers.length;
    const nextQuestion = allAnswered
      ? null
      : (full.answers[nextIndex] && {
          index: nextIndex,
          question: full.answers[nextIndex].question,
          category: full.answers[nextIndex].category,
          difficulty: full.answers[nextIndex].difficulty,
          expectedTopics: full.answers[nextIndex].expectedTopics,
          whyAsked: full.answers[nextIndex].whyAsked,
        }) ||
        null;

    return res.status(200).json({
      success: true,
      message: allAnswered
        ? "All questions answered. You can now complete the interview for evaluation."
        : "Answer saved.",
      interview: full,
      nextQuestion,
      allAnswered,
    });
  } catch (error) {
    console.error("Submit answer error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error, please try again",
    });
  }
};

// @desc    Complete the interview and run AI evaluation
// @route   POST /api/mock-interviews/:id/complete
// @access  Private
const completeMockInterview = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid mock interview id",
      });
    }

    let interview = await MockInterview.findById(req.params.id);
    if (!interview || String(interview.userId) !== String(req.user._id)) {
      return res.status(404).json({
        success: false,
        message: "Mock interview not found",
      });
    }

    if (interview.status === "COMPLETED") {
      const already = await MockInterview.findById(req.params.id)
        .populate("resumeId", "fileName")
        .populate("jobDescriptionId", "title company");
      return res.status(200).json({
        success: true,
        message: "This interview was already evaluated.",
        interview: toFullMockInterview(already),
      });
    }

    const answers = Array.isArray(interview.answers) ? interview.answers : [];
    if (answers.length === 0) {
      return res.status(400).json({
        success: false,
        message: "This interview has no questions to evaluate.",
      });
    }
    const unanswered = answers.filter((a) => !asString(a.answer));
    if (unanswered.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Please answer all ${answers.length} questions before completing the interview.`,
      });
    }

    const jd = await JobDescription.findById(interview.jobDescriptionId);
    const jdAnalysis = (jd && jd.analysis) || {};
    const jdContext = {
      jobTitle:
        asString((jd && jd.analysis && jd.analysis.jobTitle) || (jd && jd.title)) ||
        "",
      company: asString(jd && jd.company),
      technologies: asStringArray(
        (jdAnalysis.technologies ||
          jdAnalysis.programmingLanguages ||
          jdAnalysis.frameworks ||
          jdAnalysis.databases ||
          jdAnalysis.tools) || []
      ),
      responsibilities: asStringArray(jdAnalysis.responsibilities),
      keywords: asStringArray(jdAnalysis.keywords),
    };

    const items = answerItemsForEvaluation(answers);

    const evaluation = await evaluateMockInterview({
      ...jdContext,
      targetRole: asString(interview.targetRole),
      items,
    });

    const questionEvaluationsByIndex = {};
    const questionEvalList = Array.isArray(evaluation.questionEvaluations)
      ? evaluation.questionEvaluations
      : [];
    questionEvalList.forEach((qe) => {
      if (qe && qe.questionIndex != null) {
        questionEvaluationsByIndex[Number(qe.questionIndex)] = qe;
      }
    });

    answers.forEach((answerDoc, index) => {
      const qe = questionEvaluationsByIndex[index];
      if (qe) {
        answerDoc.score = clampScore(qe.score);
        answerDoc.evaluation = {
          strengths: asStringArray(qe.strengths),
          weaknesses: asStringArray(qe.weaknesses),
          feedback: asString(qe.feedback),
          suggestedAnswerPoints: asStringArray(qe.suggestedAnswerPoints),
        };
      } else {
        answerDoc.score = clampScore(determinQuestionScore(answerDoc));
      }
    });

    interview.status = "COMPLETED";
    interview.completedAt = new Date();
    interview.evaluation = {
      overallScore: clampScore(evaluation.overallScore),
      technicalScore: clampScore(evaluation.technicalScore),
      communicationScore: clampScore(evaluation.communicationScore),
      relevanceScore: clampScore(evaluation.relevanceScore),
      strengths: asStringArray(evaluation.strengths),
      weaknesses: asStringArray(evaluation.weaknesses),
      recommendations: asStringArray(evaluation.recommendations),
      recommendedTopics: asStringArray(evaluation.recommendedTopics),
      summary: asString(evaluation.summary),
    };

    await interview.save();

    const populated = await MockInterview.findById(interview._id)
      .populate("resumeId", "fileName")
      .populate("jobDescriptionId", "title company");

    return res.status(200).json({
      success: true,
      message: "Interview evaluated successfully.",
      interview: toFullMockInterview(populated),
    });
  } catch (error) {
    console.error("Complete mock interview error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to evaluate the interview right now. Please try again.",
    });
  }
};

const answerItemsForEvaluation = (answers) =>
  answers.map((a) => ({
    question: asString(a.question),
    category: asString(a.category),
    difficulty: asString(a.difficulty),
    expectedTopics: asStringArray(a.expectedTopics),
    whyAsked: asString(a.whyAsked),
    answer: asString(a.answer),
  }));

const determinQuestionScore = (item) => {
  const answer = asString(item.answer);
  if (!answer) return 0;
  let score = 40;
  if (answer.length < 40) score = 30;
  else if (answer.length < 120) score = 50;
  else if (answer.length < 400) score = 70;
  else score = 80;
  return clampScore(score);
};

// @desc    Delete a mock interview (owner only)
// @route   DELETE /api/mock-interviews/:id
// @access  Private
const deleteMockInterview = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid mock interview id",
      });
    }

    const interview = await MockInterview.findById(req.params.id);

    if (!interview || String(interview.userId) !== String(req.user._id)) {
      return res.status(404).json({
        success: false,
        message: "Mock interview not found",
      });
    }

    await interview.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Mock interview deleted successfully",
    });
  } catch (error) {
    console.error("Delete mock interview error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error, please try again",
    });
  }
};

module.exports = {
  startMockInterview,
  getMyMockInterviews,
  getMockInterviewById,
  submitAnswer,
  completeMockInterview,
  deleteMockInterview,
};