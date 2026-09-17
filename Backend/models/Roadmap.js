const mongoose = require("mongoose");

const resourceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      default: "",
    },
    type: {
      type: String,
      default: "",
    },
    url: {
      type: String,
      default: "",
    },
  },
  { _id: false }
);

const phaseSchema = new mongoose.Schema(
  {
    phaseNumber: {
      type: Number,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    duration: {
      type: String,
      default: "",
    },
    goals: {
      type: [String],
      default: [],
    },
    skills: {
      type: [String],
      default: [],
    },
    topics: {
      type: [String],
      default: [],
    },
    resources: {
      type: [resourceSchema],
      default: [],
    },
    projects: {
      type: [String],
      default: [],
    },
    completed: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

const roadmapSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    skillGapId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SkillGap",
      required: true,
    },
    resumeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resume",
      required: true,
    },
    jobDescriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "JobDescription",
      required: true,
    },
    title: {
      type: String,
      default: "",
    },
    summary: {
      type: String,
      default: "",
    },
    totalDuration: {
      type: String,
      default: "",
    },
    phases: {
      type: [phaseSchema],
      default: [],
    },
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
  },
  {
    timestamps: true,
    collection: "roadmaps",
  }
);

roadmapSchema.index({ userId: 1, skillGapId: 1 }, { unique: true });

module.exports = mongoose.model("Roadmap", roadmapSchema);