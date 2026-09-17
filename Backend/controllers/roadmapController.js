const mongoose = require("mongoose");
const SkillGap = require("../models/SkillGap");
const Resume = require("../models/Resume");
const JobDescription = require("../models/JobDescription");
const Roadmap = require("../models/Roadmap");
const { generateRoadmap, calculateProgress } = require("../services/roadmapService");

const makeStatusError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const findOwnedSkillGapOrThrow = async (id, userId) => {
  if (!mongoose.isValidObjectId(id)) {
    throw makeStatusError("Invalid skill gap id", 400);
  }
  const skillGap = await SkillGap.findById(id);
  if (!skillGap || String(skillGap.userId) !== String(userId)) {
    throw makeStatusError("Skill gap not found", 404);
  }
  return skillGap;
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

const projectProgress = (phases) =>
  Math.round(calculateProgress(phases));

const toSafeSummary = (doc) => {
  const resume = doc.resumeId || {};
  const jd = doc.jobDescriptionId || {};
  const phases = Array.isArray(doc.phases) ? doc.phases : [];
  return {
    id: doc._id,
    skillGapId: doc.skillGapId || null,
    resumeId: doc.resumeId ? doc.resumeId._id || doc.resumeId : null,
    jobDescriptionId: doc.jobDescriptionId
      ? doc.jobDescriptionId._id || doc.jobDescriptionId
      : null,
    resumeName: resume.fileName || "",
    jobTitle: jd.title || "",
    company: jd.company || "",
    title: doc.title || "",
    summary: doc.summary || "",
    totalDuration: doc.totalDuration || "",
    progress: doc.progress || 0,
    totalPhases: phases.length,
    completedPhases: phases.filter((p) => p.completed).length,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
};

const toFullRoadmap = (doc) => {
  const summary = toSafeSummary(doc);
  return {
    ...summary,
    phases: (doc.phases || []).map((phase) => ({
      phaseNumber: phase.phaseNumber,
      title: phase.title,
      duration: phase.duration,
      goals: phase.goals || [],
      skills: phase.skills || [],
      topics: phase.topics || [],
      resources: phase.resources || [],
      projects: phase.projects || [],
      completed: Boolean(phase.completed),
    })),
  };
};

// @desc    Create or regenerate a roadmap for a skill gap
// @route   POST /api/roadmaps
// @access  Private
const createRoadmap = async (req, res) => {
  try {
    const { skillGapId } = req.body || {};

    if (!skillGapId) {
      return res.status(400).json({
        success: false,
        message: "Please provide a skill gap id.",
      });
    }

    const skillGap = await findOwnedSkillGapOrThrow(skillGapId, req.user._id);
    const resume = await findOwnedResumeOrThrow(skillGap.resumeId, req.user._id);
    const jd = await findOwnedJobDescriptionOrThrow(
      skillGap.jobDescriptionId,
      req.user._id
    );

    const roadmap = generateRoadmap(skillGap, jd, resume);

    const saved = await Roadmap.findOneAndUpdate(
      {
        userId: req.user._id,
        skillGapId: skillGap._id,
      },
      {
        $set: {
          resumeId: resume._id,
          jobDescriptionId: jd._id,
          title: roadmap.title,
          summary: roadmap.summary,
          totalDuration: roadmap.totalDuration,
          phases: roadmap.phases,
          progress: roadmap.progress,
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
      message: "Roadmap generated successfully.",
      roadmap: toFullRoadmap(saved),
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }
    console.error("Create roadmap error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to generate the roadmap right now. Please try again.",
    });
  }
};

// @desc    Get all of the current user's roadmaps
// @route   GET /api/roadmaps
// @access  Private
const getMyRoadmaps = async (req, res) => {
  try {
    const roadmaps = await Roadmap.find({ userId: req.user._id })
      .populate("resumeId", "fileName")
      .populate("jobDescriptionId", "title company")
      .sort({ updatedAt: -1 });

    return res.status(200).json({
      success: true,
      roadmaps: roadmaps.map(toSafeSummary),
    });
  } catch (error) {
    console.error("List roadmaps error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error, please try again",
    });
  }
};

// @desc    Get a single roadmap (owner only)
// @route   GET /api/roadmaps/:id
// @access  Private
const getRoadmapById = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid roadmap id",
      });
    }

    const roadmap = await Roadmap.findById(req.params.id)
      .populate("resumeId", "fileName")
      .populate("jobDescriptionId", "title company");

    if (!roadmap || String(roadmap.userId) !== String(req.user._id)) {
      return res.status(404).json({
        success: false,
        message: "Roadmap not found",
      });
    }

    return res.status(200).json({
      success: true,
      roadmap: toFullRoadmap(roadmap),
    });
  } catch (error) {
    console.error("Get roadmap error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error, please try again",
    });
  }
};

// @desc    Update phase completion and recalculate progress
// @route   PATCH /api/roadmaps/:id/progress
// @access  Private
const updateRoadmapProgress = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid roadmap id",
      });
    }

    const roadmap = await Roadmap.findById(req.params.id);

    if (!roadmap || String(roadmap.userId) !== String(req.user._id)) {
      return res.status(404).json({
        success: false,
        message: "Roadmap not found",
      });
    }

    const { phaseNumber, completed } = req.body || {};
    const phaseIdx = Number(phaseNumber) - 1;

    if (
      !Number.isInteger(phaseIdx) ||
      phaseIdx < 0 ||
      phaseIdx >= roadmap.phases.length
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid phase number.",
      });
    }

    roadmap.phases[phaseIdx].completed = Boolean(completed);
    roadmap.progress = projectProgress(roadmap.phases);

    await roadmap.save();

    return res.status(200).json({
      success: true,
      message: "Roadmap progress updated.",
      roadmap: toFullRoadmap(roadmap),
    });
  } catch (error) {
    console.error("Update roadmap progress error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error, please try again",
    });
  }
};

// @desc    Delete a roadmap (owner only)
// @route   DELETE /api/roadmaps/:id
// @access  Private
const deleteRoadmap = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid roadmap id",
      });
    }

    const roadmap = await Roadmap.findById(req.params.id);

    if (!roadmap || String(roadmap.userId) !== String(req.user._id)) {
      return res.status(404).json({
        success: false,
        message: "Roadmap not found",
      });
    }

    await roadmap.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Roadmap deleted successfully",
    });
  } catch (error) {
    console.error("Delete roadmap error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error, please try again",
    });
  }
};

module.exports = {
  createRoadmap,
  getMyRoadmaps,
  getRoadmapById,
  updateRoadmapProgress,
  deleteRoadmap,
};