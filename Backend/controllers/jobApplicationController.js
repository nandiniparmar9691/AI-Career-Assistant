const mongoose = require("mongoose");
const Resume = require("../models/Resume");
const JobDescription = require("../models/JobDescription");
const JobApplication = require("../models/JobApplication");
const { JOB_APPLICATION_STATUSES } = require("../models/JobApplication");

const VALID_STATUSES = new Set(JOB_APPLICATION_STATUSES);
const SORT_OPTIONS = {
  latest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  company: { company: 1, createdAt: -1 },
  status: { status: 1, createdAt: -1 },
  interviewDate: { interviewDate: 1, createdAt: -1 },
};

const makeStatusError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const asString = (value) => (typeof value === "string" ? value.trim() : "");

const asStringArray = (value) =>
  Array.isArray(value)
    ? value
        .filter((item) => typeof item === "string" || typeof item === "number")
        .map((item) => String(item).trim())
        .filter(Boolean)
    : [];

const sliceText = (value, max) => (value ? value.slice(0, max) : "");

const parseRequiredText = (value, fieldName, max) => {
  const text = asString(value);
  if (!text) {
    throw makeStatusError(`Please enter the ${fieldName}.`, 400);
  }
  return sliceText(text, max);
};

const parseOptionalText = (value, max) => sliceText(asString(value), max);

const parseDate = (value, fieldName) => {
  if (value === undefined) return null;
  if (value === null || asString(value) === "") return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw makeStatusError(`Please provide a valid ${fieldName}.`, 400);
  }
  return date;
};

const URL_PATTERN = /^https?:\/\/.+/i;

const parseUrl = (value) => {
  if (value === undefined) return "";
  const url = asString(value);
  if (!url) return "";
  if (!URL_PATTERN.test(url)) {
    throw makeStatusError("Please provide a valid job URL.", 400);
  }
  return sliceText(url, 500);
};

const parseStatus = (value) => {
  const status = asString(value);
  if (!status) return "SAVED";
  if (!VALID_STATUSES.has(status)) {
    throw makeStatusError("The application status is invalid.", 400);
  }
  return status;
};

const parseTags = (value) => {
  const tags = asStringArray(value)
    .map((tag) => sliceText(tag, 50))
    .filter(Boolean);
  const unique = [];
  const seen = new Set();
  for (const tag of tags) {
    const key = tag.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(tag);
  }
  return unique.slice(0, 20);
};

const findOwnedApplication = async (id, userId) => {
  if (!mongoose.isValidObjectId(id)) {
    throw makeStatusError("Invalid application id", 400);
  }
  const application = await JobApplication.findById(id);
  if (!application || String(application.userId) !== String(userId)) {
    return null;
  }
  return application;
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

const resolveLinkedResourceId = async (value, userId, kind) => {
  const raw = value === undefined || value === null ? "" : asString(value);
  if (!raw) return null;
  if (kind === "resume") {
    await findOwnedResumeOrThrow(raw, userId);
  } else {
    await findOwnedJobDescriptionOrThrow(raw, userId);
  }
  return mongoose.Types.ObjectId.isValid(raw)
    ? new mongoose.Types.ObjectId(raw)
    : null;
};

const toSafeSummary = (application) => {
  const resume = application.resumeId || {};
  const jd = application.jobDescriptionId || {};
  return {
    id: application._id,
    company: application.company,
    jobTitle: application.jobTitle,
    jobUrl: application.jobUrl || "",
    location: application.location || "",
    employmentType: application.employmentType || "",
    source: application.source || "",
    salary: application.salary || "",
    status: application.status,
    appliedDate: application.appliedDate || null,
    interviewDate: application.interviewDate || null,
    followUpDate: application.followUpDate || null,
    offerDate: application.offerDate || null,
    resumeId: application.resumeId
      ? application.resumeId._id || application.resumeId
      : null,
    resumeName: resume.fileName || "",
    jobDescriptionId: application.jobDescriptionId
      ? application.jobDescriptionId._id || application.jobDescriptionId
      : null,
    jobDescriptionTitle: jd.title || "",
    jobDescriptionCompany: jd.company || "",
    tags: application.tags || [],
    notes: application.notes || "",
    createdAt: application.createdAt,
    updatedAt: application.updatedAt,
  };
};

const buildOverview = async (userId) => {
  const rows = await JobApplication.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId) } },
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);
  const counts = { SAVED: 0, APPLIED: 0, SCREENING: 0, INTERVIEW: 0, TECHNICAL_ROUND: 0, FINAL_ROUND: 0, OFFER: 0, REJECTED: 0, WITHDRAWN: 0 };
  rows.forEach((row) => {
    counts[row._id] = row.count;
  });
  return {
    total: Object.values(counts).reduce((sum, value) => sum + value, 0),
    saved: counts.SAVED,
    applied: counts.APPLIED,
    screening: counts.SCREENING,
    interviews:
      counts.INTERVIEW + counts.TECHNICAL_ROUND + counts.FINAL_ROUND,
    offers: counts.OFFER,
    rejected: counts.REJECTED,
    withdrawn: counts.WITHDRAWN,
  };
};

const escapeRegex = (value) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// @desc    Create a job application
// @route   POST /api/applications
// @access  Private
const createApplication = async (req, res) => {
  try {
    const body = req.body || {};
    if (!asString(body.company)) {
      return res.status(400).json({
        success: false,
        message: "Please enter the company.",
      });
    }
    if (!asString(body.jobTitle)) {
      return res.status(400).json({
        success: false,
        message: "Please enter the job title.",
      });
    }

    const resumeId = await resolveLinkedResourceId(
      body.resumeId,
      req.user._id,
      "resume"
    );
    const jobDescriptionId = await resolveLinkedResourceId(
      body.jobDescriptionId,
      req.user._id,
      "jobDescription"
    );

    const application = await JobApplication.create({
      userId: req.user._id,
      company: parseRequiredText(body.company, "company", 200),
      jobTitle: parseRequiredText(body.jobTitle, "job title", 200),
      jobUrl: parseUrl(body.jobUrl),
      location: parseOptionalText(body.location, 200),
      employmentType: parseOptionalText(body.employmentType, 100),
      source: parseOptionalText(body.source, 100),
      salary: parseOptionalText(body.salary, 200),
      resumeId,
      jobDescriptionId,
      status: parseStatus(body.status),
      appliedDate: parseDate(body.appliedDate, "applied date"),
      interviewDate: parseDate(body.interviewDate, "interview date"),
      followUpDate: parseDate(body.followUpDate, "follow-up date"),
      offerDate: parseDate(body.offerDate, "offer date"),
      notes: sliceText(asString(body.notes), 5000),
      tags: parseTags(body.tags),
    });

    const populated = await JobApplication.findById(application._id)
      .populate("resumeId", "fileName")
      .populate("jobDescriptionId", "title company");

    return res.status(201).json({
      success: true,
      message: "Application added successfully.",
      application: toSafeSummary(populated),
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }
    console.error("Create application error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error, please try again",
    });
  }
};

// @desc    Get the current user's applications with filter/search/sort/pagination
// @route   GET /api/applications
// @access  Private
const getMyApplications = async (req, res) => {
  try {
    const filter = { userId: req.user._id };

    const status = asString(req.query.status);
    if (status && !VALID_STATUSES.has(status)) {
      return res.status(400).json({
        success: false,
        message: "The application status is invalid.",
      });
    }
    if (status) filter.status = status;

    const search = asString(req.query.search);
    if (search) {
      const pattern = new RegExp(escapeRegex(search), "i");
      filter.$or = [
        { company: pattern },
        { jobTitle: pattern },
        { location: pattern },
      ];
    }

    const sortKey = asString(req.query.sort);
    const sort = SORT_OPTIONS[sortKey] || SORT_OPTIONS.latest;

    const parsePositiveInt = (value, fallback, max) => {
      const parsed = Number.parseInt(value, 10);
      if (!Number.isFinite(parsed) || parsed < 1) return fallback;
      return Math.min(parsed, max);
    };

    const page = parsePositiveInt(req.query.page, 1, Number.MAX_SAFE_INTEGER);
    const limit = parsePositiveInt(req.query.limit, 20, 50);

    const total = await JobApplication.countDocuments(filter);
    const applications = await JobApplication.find(filter)
      .populate("resumeId", "fileName")
      .populate("jobDescriptionId", "title company")
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit);

    const overview = await buildOverview(req.user._id);

    return res.status(200).json({
      success: true,
      applications: applications.map(toSafeSummary),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      overview,
    });
  } catch (error) {
    console.error("Get applications error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error, please try again",
    });
  }
};

// @desc    Get a single application (owner only)
// @route   GET /api/applications/:id
// @access  Private
const getApplicationById = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid application id",
      });
    }

    const application = await JobApplication.findById(req.params.id)
      .populate("resumeId", "fileName")
      .populate("jobDescriptionId", "title company");

    if (!application || String(application.userId) !== String(req.user._id)) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    return res.status(200).json({
      success: true,
      application: toSafeSummary(application),
    });
  } catch (error) {
    console.error("Get application error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error, please try again",
    });
  }
};

// @desc    Update a job application (owner only)
// @route   PUT /api/applications/:id
// @access  Private
const updateApplication = async (req, res) => {
  try {
    const application = await findOwnedApplication(
      req.params.id,
      req.user._id
    );
    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    const body = req.body || {};

    if (body.company !== undefined && !asString(body.company)) {
      return res.status(400).json({
        success: false,
        message: "Please enter the company.",
      });
    }
    if (body.jobTitle !== undefined && !asString(body.jobTitle)) {
      return res.status(400).json({
        success: false,
        message: "Please enter the job title.",
      });
    }

    if (body.company !== undefined) {
      application.company = parseRequiredText(body.company, "company", 200);
    }
    if (body.jobTitle !== undefined) {
      application.jobTitle = parseRequiredText(body.jobTitle, "job title", 200);
    }
    if (body.jobUrl !== undefined) application.jobUrl = parseUrl(body.jobUrl);
    if (body.location !== undefined) {
      application.location = parseOptionalText(body.location, 200);
    }
    if (body.employmentType !== undefined) {
      application.employmentType = parseOptionalText(body.employmentType, 100);
    }
    if (body.source !== undefined) {
      application.source = parseOptionalText(body.source, 100);
    }
    if (body.salary !== undefined) {
      application.salary = parseOptionalText(body.salary, 200);
    }
    if (body.resumeId !== undefined) {
      application.resumeId = await resolveLinkedResourceId(
        body.resumeId,
        req.user._id,
        "resume"
      );
    }
    if (body.jobDescriptionId !== undefined) {
      application.jobDescriptionId = await resolveLinkedResourceId(
        body.jobDescriptionId,
        req.user._id,
        "jobDescription"
      );
    }
    if (body.status !== undefined) {
      application.status = parseStatus(body.status);
    }
    if (body.appliedDate !== undefined) {
      application.appliedDate = parseDate(body.appliedDate, "applied date");
    }
    if (body.interviewDate !== undefined) {
      application.interviewDate = parseDate(body.interviewDate, "interview date");
    }
    if (body.followUpDate !== undefined) {
      application.followUpDate = parseDate(body.followUpDate, "follow-up date");
    }
    if (body.offerDate !== undefined) {
      application.offerDate = parseDate(body.offerDate, "offer date");
    }
    if (body.notes !== undefined) {
      application.notes = sliceText(asString(body.notes), 5000);
    }
    if (body.tags !== undefined) application.tags = parseTags(body.tags);

    await application.save();

    const populated = await JobApplication.findById(application._id)
      .populate("resumeId", "fileName")
      .populate("jobDescriptionId", "title company");

    return res.status(200).json({
      success: true,
      message: "Application updated successfully.",
      application: toSafeSummary(populated),
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }
    console.error("Update application error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error, please try again",
    });
  }
};

// @desc    Update only the status of a job application (owner only)
// @route   PATCH /api/applications/:id/status
// @access  Private
const updateApplicationStatus = async (req, res) => {
  try {
    const application = await findOwnedApplication(
      req.params.id,
      req.user._id
    );
    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    const status = parseStatus(req.body && req.body.status);
    if (!VALID_STATUSES.has(status)) {
      return res.status(400).json({
        success: false,
        message: "The application status is invalid.",
      });
    }

    application.status = status;

    if (status === "APPLIED" && !application.appliedDate) {
      application.appliedDate = new Date();
    }
    if (status === "OFFER" && !application.offerDate) {
      application.offerDate = new Date();
    }

    await application.save();

    const populated = await JobApplication.findById(application._id)
      .populate("resumeId", "fileName")
      .populate("jobDescriptionId", "title company");

    return res.status(200).json({
      success: true,
      message: "Status updated successfully.",
      application: toSafeSummary(populated),
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }
    console.error("Update application status error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error, please try again",
    });
  }
};

// @desc    Delete a job application (owner only)
// @route   DELETE /api/applications/:id
// @access  Private
const deleteApplication = async (req, res) => {
  try {
    const application = await findOwnedApplication(
      req.params.id,
      req.user._id
    );
    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    await application.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Application deleted successfully",
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }
    console.error("Delete application error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error, please try again",
    });
  }
};

module.exports = {
  createApplication,
  getMyApplications,
  getApplicationById,
  updateApplication,
  updateApplicationStatus,
  deleteApplication,
};