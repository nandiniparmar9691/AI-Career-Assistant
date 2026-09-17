const mongoose = require("mongoose");

const resumeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    fileName: {
      type: String,
      required: true,
      trim: true,
    },
    fileUrl: {
      type: String,
      required: true,
    },
    publicId: {
      type: String,
      required: true,
    },
    extractedText: {
      type: String,
      required: true,
    },
    fileType: {
      type: String,
      default: "application/pdf",
    },
    fileSize: {
      type: Number,
    },
    analysis: {
      summary: String,
      strengths: [String],
      weaknesses: [String],
      skills: {
        technical: [String],
        soft: [String],
      },
      experience: {
        summary: String,
        observations: [String],
      },
      education: {
        summary: String,
        observations: [String],
      },
      projects: {
        summary: String,
        observations: [String],
      },
      certifications: [String],
      improvementSuggestions: [String],
      recommendedRoles: [String],
    },
    atsScore: {
      overallScore: { type: Number, min: 0, max: 100 },
      categories: {
        structure: { score: Number, maxScore: Number, feedback: [String] },
        skills: { score: Number, maxScore: Number, feedback: [String] },
        experience: { score: Number, maxScore: Number, feedback: [String] },
        projects: { score: Number, maxScore: Number, feedback: [String] },
        education: { score: Number, maxScore: Number, feedback: [String] },
        content: { score: Number, maxScore: Number, feedback: [String] },
      },
      detectedSections: [String],
      missingSections: [String],
      detectedKeywords: [String],
      suggestedKeywords: [String],
      formattingIssues: [String],
      contentIssues: [String],
      recommendations: [String],
      analyzedAt: Date,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Resume", resumeSchema);