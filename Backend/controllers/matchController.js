const mongoose = require("mongoose");
const Resume = require("../models/Resume");
const JobDescription = require("../models/JobDescription");
const ResumeMatch = require("../models/ResumeMatch");
const { calculateMatch } = require("../services/matchService");

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

const toSafeSummary = (match) => {
  const resume = match.resumeId || {};
  const jd = match.jobDescriptionId || {};
  const analysis = match.analysis || {};
  return {
    id: match._id,
    resumeId: match.resumeId ? match.resumeId._id || match.resumeId : null,
    jobDescriptionId: match.jobDescriptionId
      ? match.jobDescriptionId._id || match.jobDescriptionId
      : null,
    resumeName: resume.fileName || analysis.resumeFileName || "",
    jobTitle: jd.title || analysis.jobTitle || "",
    company: jd.company || analysis.company || "",
    matchPercentage: match.matchPercentage,
    createdAt: match.createdAt,
    updatedAt: match.updatedAt,
  };
};

const toFullMatch = (match) => {
  const summary = toSafeSummary(match);
  return {
    ...summary,
    analysis: match.analysis || {},
  };
};

// @desc    Create or update a resume-JD match
// @route   POST /api/matches
// @access  Private
const createResumeMatch = async (req, res) => {
  try {
    const { resumeId, jobDescriptionId } = req.body || {};

    if (!resumeId || !jobDescriptionId) {
      return res.status(400).json({
        success: false,
        message: "Please select both a resume and a job description.",
      });
    }

    const resume = await findOwnedResumeOrThrow(resumeId, req.user._id);
    const jd = await findOwnedJobDescriptionOrThrow(
      jobDescriptionId,
      req.user._id
    );

    if (!resume.extractedText || !resume.extractedText.trim()) {
      return res.status(400).json({
        success: false,
        message:
          "No text could be extracted from this resume. Matching requires extractable text.",
      });
    }

    if (!jd.description || !jd.description.trim()) {
      return res.status(400).json({
        success: false,
        message: "The job description is empty and cannot be matched.",
      });
    }

    const analysis = await calculateMatch(resume, jd);

    const match = await ResumeMatch.findOneAndUpdate(
      {
        userId: req.user._id,
        resumeId: resume._id,
        jobDescriptionId: jd._id,
      },
      {
        $set: {
          matchPercentage: analysis.matchPercentage,
          analysis,
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
      message: "Resume matched with the job description successfully.",
      match: toFullMatch(match),
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }
    console.error("Create match error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to match the resume right now. Please try again.",
    });
  }
};

// @desc    Get all of the current user's matches
// @route   GET /api/matches
// @access  Private
const getMyMatches = async (req, res) => {
  try {
    const matches = await ResumeMatch.find({ userId: req.user._id })
      .populate("resumeId", "fileName")
      .populate("jobDescriptionId", "title company")
      .sort({ updatedAt: -1 });

    return res.status(200).json({
      success: true,
      matches: matches.map(toSafeSummary),
    });
  } catch (error) {
    console.error("List matches error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error, please try again",
    });
  }
};

// @desc    Get a single match (owner only)
// @route   GET /api/matches/:id
// @access  Private
const getMatchById = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid match id",
      });
    }

    const match = await ResumeMatch.findById(req.params.id)
      .populate("resumeId", "fileName")
      .populate("jobDescriptionId", "title company");

    if (!match || String(match.userId) !== String(req.user._id)) {
      return res.status(404).json({
        success: false,
        message: "Match not found",
      });
    }

    return res.status(200).json({
      success: true,
      match: toFullMatch(match),
    });
  } catch (error) {
    console.error("Get match error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error, please try again",
    });
  }
};

// @desc    Delete a match (owner only)
// @route   DELETE /api/matches/:id
// @access  Private
const deleteMatch = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid match id",
      });
    }

    const match = await ResumeMatch.findById(req.params.id);

    if (!match || String(match.userId) !== String(req.user._id)) {
      return res.status(404).json({
        success: false,
        message: "Match not found",
      });
    }

    await match.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Match deleted successfully",
    });
  } catch (error) {
    console.error("Delete match error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error, please try again",
    });
  }
};

module.exports = {
  createResumeMatch,
  getMyMatches,
  getMatchById,
  deleteMatch,
};