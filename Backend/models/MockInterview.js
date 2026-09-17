const mongoose = require("mongoose");

const answerSchema = new mongoose.Schema(
  {
    questionId: {
      type: String,
      default: "",
    },
    question: {
      type: String,
      default: "",
    },
    category: {
      type: String,
      default: "",
    },
    difficulty: {
      type: String,
      default: "",
    },
    expectedTopics: {
      type: [String],
      default: [],
    },
    whyAsked: {
      type: String,
      default: "",
    },
    answer: {
      type: String,
      default: "",
    },
    answeredAt: {
      type: Date,
    },
    score: {
      type: Number,
      default: null,
    },
    evaluation: {
      strengths: {
        type: [String],
        default: [],
      },
      weaknesses: {
        type: [String],
        default: [],
      },
      feedback: {
        type: String,
        default: "",
      },
      suggestedAnswerPoints: {
        type: [String],
        default: [],
      },
    },
  },
  { _id: false }
);

const evaluationSchema = new mongoose.Schema(
  {
    overallScore: {
      type: Number,
      default: null,
    },
    technicalScore: {
      type: Number,
      default: null,
    },
    communicationScore: {
      type: Number,
      default: null,
    },
    relevanceScore: {
      type: Number,
      default: null,
    },
    strengths: {
      type: [String],
      default: [],
    },
    weaknesses: {
      type: [String],
      default: [],
    },
    recommendations: {
      type: [String],
      default: [],
    },
    recommendedTopics: {
      type: [String],
      default: [],
    },
    summary: {
      type: String,
      default: "",
    },
  },
  { _id: false }
);

const mockInterviewSchema = new mongoose.Schema(
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
    questionSetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InterviewQuestionSet",
      required: true,
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
    status: {
      type: String,
      enum: ["NOT_STARTED", "IN_PROGRESS", "COMPLETED"],
      default: "NOT_STARTED",
    },
    currentQuestionIndex: {
      type: Number,
      default: 0,
    },
    startedAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    answers: {
      type: [answerSchema],
      default: [],
    },
    evaluation: {
      type: evaluationSchema,
      default: () => ({}),
    },
  },
  {
    timestamps: true,
    collection: "mockInterviews",
  }
);

module.exports = mongoose.model("MockInterview", mockInterviewSchema);