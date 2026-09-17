const mongoose = require("mongoose");
const Resume = require("../models/Resume");
const JobDescription = require("../models/JobDescription");
const ResumeMatch = require("../models/ResumeMatch");
const SkillGap = require("../models/SkillGap");
const ResumeBuilder = require("../models/ResumeBuilder");
const { generateOptimizedResume } = require("../services/resumeBuilderService");
const { generateResumePdf } = require("../services/resumePdfService");

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

const findOwnedResumeOrThrow = async (id, userId) => {
  if (!mongoose.isValidObjectId(id)) {
    throw makeStatusError("Invalid source resume id", 400);
  }
  const resume = await Resume.findById(id);
  if (!resume || String(resume.userId) !== String(userId)) {
    throw makeStatusError("Source resume not found", 404);
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

const sanitizeContact = (contact) =>
  contact && typeof contact === "object"
    ? {
        name: asString(contact.name).slice(0, 200),
        email: asString(contact.email).slice(0, 200),
        phone: asString(contact.phone).slice(0, 100),
        location: asString(contact.location).slice(0, 200),
        linkedin: asString(contact.linkedin).slice(0, 300),
        github: asString(contact.github).slice(0, 300),
        portfolio: asString(contact.portfolio).slice(0, 300),
      }
    : {};

const sanitizeContent = (content) => {
  const source = content && typeof content === "object" ? content : {};
  const skills = Array.isArray(source.skills) ? source.skills : [];
  const experience = Array.isArray(source.experience) ? source.experience : [];
  const projects = Array.isArray(source.projects) ? source.projects : [];
  const education = Array.isArray(source.education) ? source.education : [];
  const certifications = Array.isArray(source.certifications)
    ? source.certifications
    : [];
  const additional = source.additional || {};

  return {
    contact: sanitizeContact(source.contact),
    summary: asString(source.summary).slice(0, 3000),
    skills: skills
      .filter((s) => s && typeof s === "object")
      .map((s) => ({
        category: asString(s.category).slice(0, 200),
        items: asStringArray(s.items).map((i) => i.slice(0, 200)),
      }))
      .filter((s) => s.category || s.items.length),
    experience: experience
      .filter((e) => e && typeof e === "object")
      .map((e) => ({
        company: asString(e.company).slice(0, 300),
        role: asString(e.role).slice(0, 300),
        location: asString(e.location).slice(0, 200),
        startDate: asString(e.startDate).slice(0, 100),
        endDate: asString(e.endDate).slice(0, 100),
        bullets: asStringArray(e.bullets).map((b) => b.slice(0, 1000)),
      }))
      .filter((e) => e.company || e.role || e.bullets.length),
    projects: projects
      .filter((p) => p && typeof p === "object")
      .map((p) => ({
        name: asString(p.name).slice(0, 300),
        technologies: asStringArray(p.technologies).map((t) => t.slice(0, 200)),
        description: asString(p.description).slice(0, 1500),
        bullets: asStringArray(p.bullets).map((b) => b.slice(0, 1000)),
        link: asString(p.link).slice(0, 400),
      }))
      .filter((p) => p.name || p.description || p.bullets.length),
    education: education
      .filter((e) => e && typeof e === "object")
      .map((e) => ({
        institution: asString(e.institution).slice(0, 300),
        degree: asString(e.degree).slice(0, 300),
        field: asString(e.field).slice(0, 300),
        location: asString(e.location).slice(0, 200),
        startDate: asString(e.startDate).slice(0, 100),
        endDate: asString(e.endDate).slice(0, 100),
        details: asStringArray(e.details).map((d) => d.slice(0, 1000)),
      }))
      .filter(
        (e) => e.institution || e.degree || e.details.length
      ),
    certifications: certifications
      .filter((c) => c && typeof c === "object")
      .map((c) => ({
        name: asString(c.name).slice(0, 300),
        issuer: asString(c.issuer).slice(0, 300),
        date: asString(c.date).slice(0, 100),
        link: asString(c.link).slice(0, 400),
      }))
      .filter((c) => c.name),
    additional: {
      languages: asStringArray(additional.languages).map((l) => l.slice(0, 200)),
      achievements: asStringArray(additional.achievements).map((a) =>
        a.slice(0, 1000)
      ),
      interests: asStringArray(additional.interests).map((i) => i.slice(0, 200)),
    },
  };
};

const sanitizeAtsMetadata = (ats) => {
  const source = ats && typeof ats === "object" ? ats : {};
  return {
    keywordsUsed: asStringArray(source.keywordsUsed).map((k) => k.slice(0, 200)),
    keywordsNotUsed: asStringArray(source.keywordsNotUsed).map((k) =>
      k.slice(0, 200)
    ),
    optimizationNotes: asStringArray(source.optimizationNotes).map((n) =>
      n.slice(0, 600)
    ),
  };
};

const toSafeSummary = (doc) => {
  const resume = doc.sourceResumeId || {};
  const jd = doc.jobDescriptionId || {};
  const match = doc.resumeMatchId || {};
  return {
    id: doc._id,
    sourceResumeId: doc.sourceResumeId
      ? doc.sourceResumeId._id || doc.sourceResumeId
      : null,
    jobDescriptionId: doc.jobDescriptionId
      ? doc.jobDescriptionId._id || doc.jobDescriptionId
      : null,
    resumeMatchId: doc.resumeMatchId
      ? doc.resumeMatchId._id || doc.resumeMatchId
      : null,
    skillGapId: doc.skillGapId || null,
    sourceResumeName: resume.fileName || "",
    jobTitle: jd.title || "",
    company: jd.company || "",
    title: doc.title || "ATS Resume",
    targetRole: doc.targetRole || "",
    template: doc.template || "ATS_CLASSIC",
    matchPercentage:
      match.matchPercentage != null ? match.matchPercentage : null,
    contactName:
      (doc.content && doc.content.contact && doc.content.contact.name) || "",
    keywordsUsedCount:
      (doc.atsMetadata && doc.atsMetadata.keywordsUsed
        ? doc.atsMetadata.keywordsUsed.length
        : 0) || 0,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
};

const toFullResume = (doc) => {
  const summary = toSafeSummary(doc);
  return {
    ...summary,
    content: doc.content || {},
    atsMetadata: doc.atsMetadata || {
      keywordsUsed: [],
      keywordsNotUsed: [],
      optimizationNotes: [],
    },
  };
};

// @desc    Generate an optimized ATS resume from a source resume (+ optional JD)
// @route   POST /api/resume-builder/generate
// @access  Private
const generateResume = async (req, res) => {
  try {
    const { sourceResumeId, jobDescriptionId, targetRole } = req.body || {};

    if (!sourceResumeId) {
      return res.status(400).json({
        success: false,
        message: "Please select a source resume.",
      });
    }

    const resume = await findOwnedResumeOrThrow(sourceResumeId, req.user._id);

    let jd = null;
    let match = null;
    let skillGap = null;

    if (jobDescriptionId) {
      jd = await findOwnedJobDescriptionOrThrow(jobDescriptionId, req.user._id);
      match = await ResumeMatch.findOne({
        userId: req.user._id,
        resumeId: resume._id,
        jobDescriptionId: jd._id,
      });
      skillGap = await SkillGap.findOne({
        userId: req.user._id,
        resumeId: resume._id,
        jobDescriptionId: jd._id,
      });
    }

    const generated = await generateOptimizedResume({
      resume,
      jd,
      match,
      skillGap,
      targetRole: asString(targetRole),
    });

    const resumeDoc = await ResumeBuilder.create({
      userId: req.user._id,
      sourceResumeId: resume._id,
      jobDescriptionId: jd ? jd._id : null,
      resumeMatchId: match ? match._id : null,
      skillGapId: skillGap ? skillGap._id : null,
      title: "ATS Resume",
      targetRole: asString(generated.targetRole) || asString(targetRole),
      template: "ATS_CLASSIC",
      content: sanitizeContent(generated.content),
      atsMetadata: sanitizeAtsMetadata(generated.atsMetadata),
    });

    const populated = await ResumeBuilder.findById(resumeDoc._id)
      .populate("sourceResumeId", "fileName")
      .populate("jobDescriptionId", "title company")
      .populate("resumeMatchId", "matchPercentage");

    return res.status(201).json({
      success: true,
      message: jd
        ? `ATS resume generated for ${jd.title || "the selected role"}.`
        : "ATS resume generated.",
      resume: toFullResume(populated),
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }
    console.error("Generate resume error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to generate the resume right now. Please try again.",
    });
  }
};

// @desc    Get all of the current user's generated resumes
// @route   GET /api/resume-builder
// @access  Private
const getMyResumes = async (req, res) => {
  try {
    const resumes = await ResumeBuilder.find({ userId: req.user._id })
      .populate("sourceResumeId", "fileName")
      .populate("jobDescriptionId", "title company")
      .populate("resumeMatchId", "matchPercentage")
      .sort({ updatedAt: -1 });

    return res.status(200).json({
      success: true,
      resumes: resumes.map(toSafeSummary),
    });
  } catch (error) {
    console.error("List resume builder resumes error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error, please try again",
    });
  }
};

// @desc    Get a single generated resume (owner only)
// @route   GET /api/resume-builder/:id
// @access  Private
const getResumeById = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid resume id",
      });
    }

    const resume = await ResumeBuilder.findById(req.params.id)
      .populate("sourceResumeId", "fileName")
      .populate("jobDescriptionId", "title company")
      .populate("resumeMatchId", "matchPercentage");

    if (!resume || String(resume.userId) !== String(req.user._id)) {
      return res.status(404).json({
        success: false,
        message: "Resume not found",
      });
    }

    return res.status(200).json({
      success: true,
      resume: toFullResume(resume),
    });
  } catch (error) {
    console.error("Get resume error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error, please try again",
    });
  }
};

// @desc    Update a generated resume (owner only)
// @route   PUT /api/resume-builder/:id
// @access  Private
const updateResume = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid resume id",
      });
    }

    const resume = await ResumeBuilder.findById(req.params.id);
    if (!resume || String(resume.userId) !== String(req.user._id)) {
      return res.status(404).json({
        success: false,
        message: "Resume not found",
      });
    }

    const { title, targetRole, template, content, atsMetadata } = req.body || {};

    const freshContent = sanitizeContent(content);
    const email = freshContent.contact.email;
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address in the contact information.",
      });
    }

    if (title !== undefined) resume.title = asString(title).slice(0, 200) || "ATS Resume";
    if (targetRole !== undefined) {
      resume.targetRole = asString(targetRole).slice(0, 200);
    }
    if (template !== undefined) {
      resume.template = asString(template) === "ATS_CLASSIC" ? "ATS_CLASSIC" : "ATS_CLASSIC";
    }
    if (content !== undefined) resume.content = freshContent;
    if (atsMetadata !== undefined) resume.atsMetadata = sanitizeAtsMetadata(atsMetadata);

    await resume.save();

    const populated = await ResumeBuilder.findById(resume._id)
      .populate("sourceResumeId", "fileName")
      .populate("jobDescriptionId", "title company")
      .populate("resumeMatchId", "matchPercentage");

    return res.status(200).json({
      success: true,
      message: "Resume updated successfully.",
      resume: toFullResume(populated),
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }
    console.error("Update resume error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error, please try again",
    });
  }
};

// @desc    Delete a generated resume (owner only)
// @route   DELETE /api/resume-builder/:id
// @access  Private
const deleteResume = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid resume id",
      });
    }

    const resume = await ResumeBuilder.findById(req.params.id);

    if (!resume || String(resume.userId) !== String(req.user._id)) {
      return res.status(404).json({
        success: false,
        message: "Resume not found",
      });
    }

    await resume.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Resume deleted successfully",
    });
  } catch (error) {
    console.error("Delete resume error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error, please try again",
    });
  }
};

// @desc    Download a generated resume as an ATS-friendly PDF
// @route   GET /api/resume-builder/:id/pdf
// @access  Private
const downloadPdf = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid resume id",
      });
    }

    const resume = await ResumeBuilder.findById(req.params.id);
    if (!resume || String(resume.userId) !== String(req.user._id)) {
      return res.status(404).json({
        success: false,
        message: "Resume not found",
      });
    }

    const pdf = await generateResumePdf({
      title: resume.title,
      targetRole: resume.targetRole,
      content: resume.content,
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${pdf.filename}"`
    );
    res.setHeader("Content-Length", pdf.buffer.length);
    return res.send(pdf.buffer);
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }
    console.error("Download resume PDF error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to generate the PDF right now. Please try again.",
    });
  }
};

module.exports = {
  generateResume,
  getMyResumes,
  getResumeById,
  updateResume,
  deleteResume,
  downloadPdf,
};