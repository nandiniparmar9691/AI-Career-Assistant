const mongoose = require("mongoose");
const JobDescription = require("../models/JobDescription");
const {
  analyzeJobDescription,
} = require("../services/geminiService");

const MIN_DESCRIPTION_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 20000;
const MAX_META_LENGTH = 200;

const makeStatusError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const toSafeSummary = (jd) => ({
  id: jd._id,
  title: jd.title,
  company: jd.company,
  descriptionPreview: jd.description
    ? jd.description.slice(0, 200)
    : "",
  createdAt: jd.createdAt,
  updatedAt: jd.updatedAt,
});

const findOwnedJobDescription = async (id, userId) => {
  if (!mongoose.isValidObjectId(id)) {
    throw makeStatusError("Invalid job description id", 400);
  }

  const jd = await JobDescription.findById(id);

  if (!jd || String(jd.userId) !== String(userId)) {
    return null;
  }

  return jd;
};

const parseDescription = (value) => {
  const description = typeof value === "string" ? value.trim() : "";

  if (!description) {
    throw makeStatusError("Please enter a job description.", 400);
  }

  if (description.length < MIN_DESCRIPTION_LENGTH) {
    throw makeStatusError(
      "Please enter a complete job description.",
      400
    );
  }

  if (description.length > MAX_DESCRIPTION_LENGTH) {
    throw makeStatusError("Job description is too long.", 400);
  }

  return description;
};

const parseOptional = (value) =>
  typeof value === "string" ? value.trim().slice(0, MAX_META_LENGTH) : "";

// @desc    Create and analyze a job description
// @route   POST /api/job-descriptions
// @access  Private
const createJobDescription = async (req, res) => {
  try {
    const description = parseDescription(
      req.body && req.body.description
    );
    const title = parseOptional(req.body && req.body.title);
    const company = parseOptional(req.body && req.body.company);

    const analysis = await analyzeJobDescription(
      description,
      title,
      company
    );

    const jd = await JobDescription.create({
      userId: req.user._id,
      title,
      company,
      description,
      analysis,
    });

    return res.status(201).json({
      success: true,
      message: "Job description analyzed successfully",
      jobDescription: {
        ...toSafeSummary(jd),
        description: jd.description,
        analysis: jd.analysis || null,
      },
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }
    console.error("Create job description error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error, please try again",
    });
  }
};

// @desc    Get all job descriptions for the current user
// @route   GET /api/job-descriptions
// @access  Private
const getMyJobDescriptions = async (req, res) => {
  try {
    const jobDescriptions = await JobDescription.find({
      userId: req.user._id,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      jobDescriptions: jobDescriptions.map(toSafeSummary),
    });
  } catch (error) {
    console.error("Get job descriptions error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error, please try again",
    });
  }
};

// @desc    Get a single job description by id
// @route   GET /api/job-descriptions/:id
// @access  Private
const getJobDescriptionById = async (req, res) => {
  try {
    const jd = await findOwnedJobDescription(
      req.params.id,
      req.user._id
    );

    if (!jd) {
      return res.status(404).json({
        success: false,
        message: "Job description not found",
      });
    }

    return res.status(200).json({
      success: true,
      jobDescription: {
        ...toSafeSummary(jd),
        description: jd.description,
        analysis: jd.analysis || null,
      },
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }
    console.error("Get job description error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error, please try again",
    });
  }
};

// @desc    Delete a job description
// @route   DELETE /api/job-descriptions/:id
// @access  Private
const deleteJobDescription = async (req, res) => {
  try {
    const jd = await findOwnedJobDescription(
      req.params.id,
      req.user._id
    );

    if (!jd) {
      return res.status(404).json({
        success: false,
        message: "Job description not found",
      });
    }

    await jd.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Job description deleted successfully",
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }
    console.error("Delete job description error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error, please try again",
    });
  }
};

module.exports = {
  createJobDescription,
  getMyJobDescriptions,
  getJobDescriptionById,
  deleteJobDescription,
};