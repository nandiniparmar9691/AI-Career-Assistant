const mongoose = require("mongoose");
const ResumeDraft = require("../models/ResumeDraft");
const { generateResumeDraftPdf } = require("../services/resumeDraftPdfService");

const VALID_TEMPLATES = new Set(["CLASSIC", "MINIMAL", "MODERN"]);

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

const URL_PATTERN = /^https?:\/\/.+/i;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const cleanString = (value, max) => sliceText(asString(value), max);

const cleanStringList = (value, maxItems, itemMax) =>
  asStringArray(value)
    .map((item) => sliceText(item, itemMax))
    .filter(Boolean)
    .slice(0, maxItems);

const parseUrl = (value, label) => {
  const url = cleanString(value, 500);
  if (!url) return "";
  if (!URL_PATTERN.test(url)) {
    throw makeStatusError(`Please provide a valid URL for ${label}.`, 400);
  }
  return url;
};

const parsePersonal = (value, defaults) => {
  const personal = value && typeof value === "object" ? value : {};
  const base = defaults && typeof defaults === "object" ? defaults : {};
  if (personal.linkedin !== undefined && asString(personal.linkedin)) {
    if (!URL_PATTERN.test(asString(personal.linkedin))) {
      throw makeStatusError("Please provide a valid URL for LinkedIn.", 400);
    }
  }
  if (personal.github !== undefined && asString(personal.github)) {
    if (!URL_PATTERN.test(asString(personal.github))) {
      throw makeStatusError("Please provide a valid URL for GitHub.", 400);
    }
  }
  if (personal.portfolio !== undefined && asString(personal.portfolio)) {
    if (!URL_PATTERN.test(asString(personal.portfolio))) {
      throw makeStatusError("Please provide a valid URL for your portfolio.", 400);
    }
  }
  if (personal.email !== undefined && asString(personal.email)) {
    if (!EMAIL_PATTERN.test(asString(personal.email))) {
      throw makeStatusError("Please provide a valid email address.", 400);
    }
  }
  return {
    fullName:
      personal.fullName !== undefined
        ? cleanString(personal.fullName, 200)
        : cleanString(base.fullName, 200),
    email:
      personal.email !== undefined
        ? cleanString(personal.email, 200)
        : cleanString(base.email, 200),
    phone:
      personal.phone !== undefined
        ? cleanString(personal.phone, 60)
        : cleanString(base.phone, 60),
    location:
      personal.location !== undefined
        ? cleanString(personal.location, 200)
        : cleanString(base.location, 200),
    linkedin:
      personal.linkedin !== undefined
        ? cleanString(personal.linkedin, 500)
        : cleanString(base.linkedin, 500),
    github:
      personal.github !== undefined
        ? cleanString(personal.github, 500)
        : cleanString(base.github, 500),
    portfolio:
      personal.portfolio !== undefined
        ? cleanString(personal.portfolio, 500)
        : cleanString(base.portfolio, 500),
  };
};

const parseSkills = (value) => {
  const groups = Array.isArray(value) ? value : [];
  const cleaned = [];
  for (const group of groups.slice(0, 30)) {
    if (!group || typeof group !== "object") continue;
    const category = cleanString(group.category, 100);
    const items = cleanStringList(group.items, 60, 100);
    if (!category && !items.length) continue;
    cleaned.push({ category, items });
  }
  return cleaned;
};

const parseEducation = (value) => {
  const entries = Array.isArray(value) ? value : [];
  return entries
    .slice(0, 20)
    .filter((entry) => entry && typeof entry === "object")
    .map((entry) => ({
      degree: cleanString(entry.degree, 200),
      institution: cleanString(entry.institution, 200),
      location: cleanString(entry.location, 200),
      startDate: cleanString(entry.startDate, 100),
      endDate: cleanString(entry.endDate, 100),
      score: cleanString(entry.score, 100),
    }));
};

const parseExperience = (value) => {
  const entries = Array.isArray(value) ? value : [];
  return entries
    .slice(0, 20)
    .filter((entry) => entry && typeof entry === "object")
    .map((entry) => ({
      jobTitle: cleanString(entry.jobTitle, 200),
      company: cleanString(entry.company, 200),
      location: cleanString(entry.location, 200),
      startDate: cleanString(entry.startDate, 100),
      endDate: cleanString(entry.endDate, 100),
      description: cleanString(entry.description, 5000),
    }));
};

const parseProjects = (value) => {
  const entries = Array.isArray(value) ? value : [];
  const cleaned = [];
  for (const entry of entries.slice(0, 20)) {
    if (!entry || typeof entry !== "object") continue;
    if (asString(entry.githubUrl)) {
      if (!URL_PATTERN.test(asString(entry.githubUrl))) {
        throw makeStatusError("Please provide a valid GitHub URL for your project.", 400);
      }
    }
    if (asString(entry.liveUrl)) {
      if (!URL_PATTERN.test(asString(entry.liveUrl))) {
        throw makeStatusError("Please provide a valid live URL for your project.", 400);
      }
    }
    cleaned.push({
      name: cleanString(entry.name, 200),
      description: cleanString(entry.description, 5000),
      technologies: cleanStringList(entry.technologies, 30, 100),
      githubUrl: cleanString(entry.githubUrl, 500),
      liveUrl: cleanString(entry.liveUrl, 500),
    });
  }
  return cleaned;
};

const parseCertifications = (value) => {
  const entries = Array.isArray(value) ? value : [];
  const cleaned = [];
  for (const entry of entries.slice(0, 20)) {
    if (!entry || typeof entry !== "object") continue;
    if (asString(entry.url)) {
      if (!URL_PATTERN.test(asString(entry.url))) {
        throw makeStatusError("Please provide a valid URL for your certification.", 400);
      }
    }
    cleaned.push({
      name: cleanString(entry.name, 200),
      issuer: cleanString(entry.issuer, 200),
      date: cleanString(entry.date, 100),
      url: cleanString(entry.url, 500),
    });
  }
  return cleaned;
};

const parseAdditional = (value, defaults) => {
  const additional = value && typeof value === "object" ? value : {};
  const base = defaults && typeof defaults === "object" ? defaults : {};
  return {
    languages:
      additional.languages !== undefined
        ? cleanStringList(additional.languages, 20, 100)
        : cleanStringList(base.languages, 20, 100),
    interests:
      additional.interests !== undefined
        ? cleanStringList(additional.interests, 20, 100)
        : cleanStringList(base.interests, 20, 100),
  };
};

const applyDraftFields = (draft, body, partial) => {
  if (!body) return;
  if (body.personal !== undefined) {
    draft.personal = parsePersonal(body.personal, partial ? draft.personal : undefined);
  }
  if (body.summary !== undefined) draft.summary = cleanString(body.summary, 5000);
  if (body.skills !== undefined) draft.skills = parseSkills(body.skills);
  if (body.education !== undefined) draft.education = parseEducation(body.education);
  if (body.experience !== undefined) draft.experience = parseExperience(body.experience);
  if (body.projects !== undefined) draft.projects = parseProjects(body.projects);
  if (body.certifications !== undefined) {
    draft.certifications = parseCertifications(body.certifications);
  }
  if (body.achievements !== undefined) {
    draft.achievements = cleanStringList(body.achievements, 50, 200);
  }
  if (body.additional !== undefined) {
    draft.additional = parseAdditional(body.additional, partial ? draft.additional : undefined);
  }
};

const safeDraftFilename = (value) => {
  const cleaned = asString(value)
    .replace(/[^\w.\- ]/g, "")
    .replace(/\s+/g, "_")
    .trim()
    .slice(0, 80);
  return cleaned || "Resume";
};

const toSafeSummary = (draft) => ({
  id: draft._id,
  template: draft.template,
  personal: draft.personal || {},
  summary: draft.summary || "",
  skills: draft.skills || [],
  education: draft.education || [],
  experience: draft.experience || [],
  projects: draft.projects || [],
  certifications: draft.certifications || [],
  achievements: draft.achievements || [],
  additional: draft.additional || {},
  createdAt: draft.createdAt,
  updatedAt: draft.updatedAt,
});

const findOwnedDraft = async (id, userId) => {
  if (!mongoose.isValidObjectId(id)) {
    throw makeStatusError("Invalid resume id", 400);
  }
  const draft = await ResumeDraft.findById(id);
  if (!draft || String(draft.userId) !== String(userId)) {
    return null;
  }
  return draft;
};

// @desc    Get the current user's resume draft (or null)
// @route   GET /api/resume-drafts
// @access  Private
const getMyResumeDraft = async (req, res) => {
  try {
    const draft = await ResumeDraft.findOne({ userId: req.user._id });
    return res.status(200).json({
      success: true,
      resume: draft ? toSafeSummary(draft) : null,
    });
  } catch (error) {
    console.error("Get resume draft error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error, please try again",
    });
  }
};

// @desc    Create the current user's resume draft (one per user)
// @route   POST /api/resume-drafts
// @access  Private
const createResumeDraft = async (req, res) => {
  try {
    const body = req.body || {};
    const existing = await ResumeDraft.findOne({ userId: req.user._id });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "You already have a resume. Load it and update it instead.",
      });
    }

    const parsed = {
      userId: req.user._id,
      template: VALID_TEMPLATES.has(asString(body.template))
        ? asString(body.template)
        : "CLASSIC",
    };
    applyDraftFields(parsed, body);

    const draft = await ResumeDraft.create(parsed);
    return res.status(201).json({
      success: true,
      message: "Resume created successfully.",
      resume: toSafeSummary(draft),
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }
    console.error("Create resume draft error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error, please try again",
    });
  }
};

// @desc    Update the current user's resume draft (owner only)
// @route   PUT /api/resume-drafts/:id
// @access  Private
const updateResumeDraft = async (req, res) => {
  try {
    const draft = await findOwnedDraft(req.params.id, req.user._id);
    if (!draft) {
      return res.status(404).json({
        success: false,
        message: "Resume not found",
      });
    }
    const body = req.body || {};
    if (body.template !== undefined) {
      if (!VALID_TEMPLATES.has(asString(body.template))) {
        return res.status(400).json({
          success: false,
          message: "Please choose a valid resume template.",
        });
      }
      draft.template = asString(body.template);
    }
    applyDraftFields(draft, body, true);

    await draft.save();
    return res.status(200).json({
      success: true,
      message: "Resume updated successfully.",
      resume: toSafeSummary(draft),
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }
    console.error("Update resume draft error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error, please try again",
    });
  }
};

// @desc    Delete the current user's resume draft (owner only)
// @route   DELETE /api/resume-drafts/:id
// @access  Private
const deleteResumeDraft = async (req, res) => {
  try {
    const draft = await findOwnedDraft(req.params.id, req.user._id);
    if (!draft) {
      return res.status(404).json({
        success: false,
        message: "Resume not found",
      });
    }
    await draft.deleteOne();
    return res.status(200).json({
      success: true,
      message: "Resume deleted successfully",
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }
    console.error("Delete resume draft error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error, please try again",
    });
  }
};

// @desc    Download the current user's resume draft as a text-based PDF
// @route   GET /api/resume-drafts/:id/pdf
// @access  Private
const downloadResumeDraftPdf = async (req, res) => {
  try {
    const draft = await findOwnedDraft(req.params.id, req.user._id);
    if (!draft) {
      return res.status(404).json({
        success: false,
        message: "Resume not found",
      });
    }
    const { buffer, filename } = await generateResumeDraftPdf(draft);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${safeDraftFilename(filename)}.pdf"`
    );
    return res.send(buffer);
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }
    console.error("Download resume draft PDF error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error, please try again",
    });
  }
};

module.exports = {
  getMyResumeDraft,
  createResumeDraft,
  updateResumeDraft,
  deleteResumeDraft,
  downloadResumeDraftPdf,
};