const mongoose = require("mongoose");

const gapItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    priority: {
      type: String,
      enum: ["HIGH", "MEDIUM", "LOW"],
      default: "MEDIUM",
    },
    reason: {
      type: String,
      default: "",
    },
  },
  { _id: false }
);

const recommendationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        "SKILL",
        "TECHNOLOGY",
        "KEYWORD",
        "EXPERIENCE",
        "EDUCATION",
        "GENERAL",
      ],
      default: "GENERAL",
    },
    title: {
      type: String,
      default: "",
    },
    description: {
      type: String,
      default: "",
    },
  },
  { _id: false }
);

const skillGapSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
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
    resumeMatchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ResumeMatch",
      required: true,
    },
    matchPercentage: {
      type: Number,
      min: 0,
      max: 100,
    },
    strengths: {
      type: [String],
      default: [],
    },
    missingSkills: {
      type: [gapItemSchema],
      default: [],
    },
    missingTechnologies: {
      type: [gapItemSchema],
      default: [],
    },
    missingKeywords: {
      type: [gapItemSchema],
      default: [],
    },
    recommendations: {
      type: [recommendationSchema],
      default: [],
    },
    overallSummary: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
    collection: "skillGaps",
  }
);

skillGapSchema.index(
  { userId: 1, resumeId: 1, jobDescriptionId: 1 },
  { unique: true }
);

module.exports = mongoose.model("SkillGap", skillGapSchema);