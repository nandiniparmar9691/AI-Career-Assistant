const mongoose = require("mongoose");

const interviewQuestionSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: [
        "TECHNICAL",
        "CODING",
        "PROJECT",
        "RESUME",
        "BEHAVIORAL",
        "JOB_SPECIFIC",
        "SKILL_GAP",
      ],
      required: true,
    },
    difficulty: {
      type: String,
      enum: ["EASY", "MEDIUM", "HARD"],
      default: "MEDIUM",
    },
    expectedTopics: {
      type: [String],
      default: [],
    },
    whyAsked: {
      type: String,
      default: "",
    },
  },
  { _id: false }
);

const interviewQuestionSetSchema = new mongoose.Schema(
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
    },
    skillGapId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SkillGap",
    },
    targetRole: {
      type: String,
      default: "",
    },
    difficulty: {
      type: String,
      enum: ["EASY", "MEDIUM", "HARD"],
      default: "MEDIUM",
    },
    questions: {
      type: [interviewQuestionSchema],
      default: [],
    },
    totalQuestions: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    collection: "interviewQuestionSets",
  }
);

module.exports = mongoose.model("InterviewQuestionSet", interviewQuestionSetSchema);