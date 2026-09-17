const mongoose = require("mongoose");

const contactSchema = new mongoose.Schema(
  {
    name: { type: String, default: "" },
    email: { type: String, default: "" },
    phone: { type: String, default: "" },
    location: { type: String, default: "" },
    linkedin: { type: String, default: "" },
    github: { type: String, default: "" },
    portfolio: { type: String, default: "" },
  },
  { _id: false }
);

const skillGroupSchema = new mongoose.Schema(
  {
    category: { type: String, default: "" },
    items: { type: [String], default: [] },
  },
  { _id: false }
);

const experienceEntrySchema = new mongoose.Schema(
  {
    company: { type: String, default: "" },
    role: { type: String, default: "" },
    location: { type: String, default: "" },
    startDate: { type: String, default: "" },
    endDate: { type: String, default: "" },
    bullets: { type: [String], default: [] },
  },
  { _id: false }
);

const projectEntrySchema = new mongoose.Schema(
  {
    name: { type: String, default: "" },
    technologies: { type: [String], default: [] },
    description: { type: String, default: "" },
    bullets: { type: [String], default: [] },
    link: { type: String, default: "" },
  },
  { _id: false }
);

const educationEntrySchema = new mongoose.Schema(
  {
    institution: { type: String, default: "" },
    degree: { type: String, default: "" },
    field: { type: String, default: "" },
    location: { type: String, default: "" },
    startDate: { type: String, default: "" },
    endDate: { type: String, default: "" },
    details: { type: [String], default: [] },
  },
  { _id: false }
);

const certificationEntrySchema = new mongoose.Schema(
  {
    name: { type: String, default: "" },
    issuer: { type: String, default: "" },
    date: { type: String, default: "" },
    link: { type: String, default: "" },
  },
  { _id: false }
);

const additionalSchema = new mongoose.Schema(
  {
    languages: { type: [String], default: [] },
    achievements: { type: [String], default: [] },
    interests: { type: [String], default: [] },
  },
  { _id: false }
);

const resumeContentSchema = new mongoose.Schema(
  {
    contact: { type: contactSchema, default: () => ({}) },
    summary: { type: String, default: "" },
    skills: { type: [skillGroupSchema], default: [] },
    experience: { type: [experienceEntrySchema], default: [] },
    projects: { type: [projectEntrySchema], default: [] },
    education: { type: [educationEntrySchema], default: [] },
    certifications: { type: [certificationEntrySchema], default: [] },
    additional: { type: additionalSchema, default: () => ({}) },
  },
  { _id: false }
);

const atsMetadataSchema = new mongoose.Schema(
  {
    keywordsUsed: { type: [String], default: [] },
    keywordsNotUsed: { type: [String], default: [] },
    optimizationNotes: { type: [String], default: [] },
  },
  { _id: false }
);

const resumeBuilderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    sourceResumeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resume",
      required: true,
    },
    jobDescriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "JobDescription",
      default: null,
    },
    resumeMatchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ResumeMatch",
      default: null,
    },
    skillGapId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SkillGap",
      default: null,
    },
    title: {
      type: String,
      default: "ATS Resume",
      trim: true,
      maxlength: 200,
    },
    targetRole: {
      type: String,
      default: "",
      trim: true,
      maxlength: 200,
    },
    template: {
      type: String,
      enum: ["ATS_CLASSIC"],
      default: "ATS_CLASSIC",
    },
    content: { type: resumeContentSchema, default: () => ({}) },
    atsMetadata: { type: atsMetadataSchema, default: () => ({}) },
  },
  {
    timestamps: true,
    collection: "resumeBuilders",
  }
);

module.exports = mongoose.model("ResumeBuilder", resumeBuilderSchema);