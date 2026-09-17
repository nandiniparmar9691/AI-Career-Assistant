const mongoose = require("mongoose");

const JOB_APPLICATION_STATUSES = [
  "SAVED",
  "APPLIED",
  "SCREENING",
  "INTERVIEW",
  "TECHNICAL_ROUND",
  "FINAL_ROUND",
  "OFFER",
  "REJECTED",
  "WITHDRAWN",
];

const jobApplicationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    company: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    jobTitle: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    jobUrl: {
      type: String,
      default: "",
      trim: true,
      maxlength: 500,
    },

    location: {
      type: String,
      default: "",
      trim: true,
      maxlength: 200,
    },

    employmentType: {
      type: String,
      default: "",
      maxlength: 100,
    },

    source: {
      type: String,
      default: "",
      maxlength: 100,
    },

    salary: {
      type: String,
      default: "",
      maxlength: 200,
    },

    resumeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resume",
      default: null,
    },

    jobDescriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "JobDescription",
      default: null,
    },

    status: {
      type: String,
      enum: JOB_APPLICATION_STATUSES,
      default: "SAVED",
      index: true,
    },

    appliedDate: {
      type: Date,
      default: null,
    },

    interviewDate: {
      type: Date,
      default: null,
    },

    followUpDate: {
      type: Date,
      default: null,
    },

    offerDate: {
      type: Date,
      default: null,
    },

    notes: {
      type: String,
      default: "",
      maxlength: 5000,
    },

    tags: [
      {
        type: String,
        trim: true,
        maxlength: 50,
      },
    ],
  },
  {
    timestamps: true,
  }
);

jobApplicationSchema.index({ userId: 1, status: 1 });
jobApplicationSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("JobApplication", jobApplicationSchema);
module.exports.JOB_APPLICATION_STATUSES = JOB_APPLICATION_STATUSES;