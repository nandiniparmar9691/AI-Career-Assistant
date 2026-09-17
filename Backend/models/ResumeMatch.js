const mongoose = require("mongoose");

const resumeMatchSchema = new mongoose.Schema(
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
    matchPercentage: {
      type: Number,
      min: 0,
      max: 100,
      required: true,
    },
    analysis: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
  },
  {
    timestamps: true,
    collection: "resumeMatches",
  }
);

resumeMatchSchema.index(
  { userId: 1, resumeId: 1, jobDescriptionId: 1 },
  { unique: true }
);

module.exports = mongoose.model("ResumeMatch", resumeMatchSchema);