const mongoose = require("mongoose");

const personalSchema = new mongoose.Schema(
  {
    fullName: { type: String, default: "", trim: true, maxlength: 200 },
    email: { type: String, default: "", trim: true, maxlength: 200 },
    phone: { type: String, default: "", trim: true, maxlength: 60 },
    location: { type: String, default: "", trim: true, maxlength: 200 },
    linkedin: { type: String, default: "", trim: true, maxlength: 500 },
    github: { type: String, default: "", trim: true, maxlength: 500 },
    portfolio: { type: String, default: "", trim: true, maxlength: 500 },
  },
  { _id: false }
);

const skillGroupSchema = new mongoose.Schema(
  {
    category: { type: String, default: "", trim: true, maxlength: 100 },
    items: { type: [String], default: [] },
  },
  { _id: false }
);

const educationSchema = new mongoose.Schema(
  {
    degree: { type: String, default: "", trim: true, maxlength: 200 },
    institution: { type: String, default: "", trim: true, maxlength: 200 },
    location: { type: String, default: "", trim: true, maxlength: 200 },
    startDate: { type: String, default: "", trim: true, maxlength: 100 },
    endDate: { type: String, default: "", trim: true, maxlength: 100 },
    score: { type: String, default: "", trim: true, maxlength: 100 },
  },
  { _id: false }
);

const experienceSchema = new mongoose.Schema(
  {
    jobTitle: { type: String, default: "", trim: true, maxlength: 200 },
    company: { type: String, default: "", trim: true, maxlength: 200 },
    location: { type: String, default: "", trim: true, maxlength: 200 },
    startDate: { type: String, default: "", trim: true, maxlength: 100 },
    endDate: { type: String, default: "", trim: true, maxlength: 100 },
    description: { type: String, default: "", trim: true, maxlength: 5000 },
  },
  { _id: false }
);

const projectSchema = new mongoose.Schema(
  {
    name: { type: String, default: "", trim: true, maxlength: 200 },
    description: { type: String, default: "", trim: true, maxlength: 5000 },
    technologies: { type: [String], default: [] },
    githubUrl: { type: String, default: "", trim: true, maxlength: 500 },
    liveUrl: { type: String, default: "", trim: true, maxlength: 500 },
  },
  { _id: false }
);

const certificationSchema = new mongoose.Schema(
  {
    name: { type: String, default: "", trim: true, maxlength: 200 },
    issuer: { type: String, default: "", trim: true, maxlength: 200 },
    date: { type: String, default: "", trim: true, maxlength: 100 },
    url: { type: String, default: "", trim: true, maxlength: 500 },
  },
  { _id: false }
);

const additionalSchema = new mongoose.Schema(
  {
    languages: { type: [String], default: [] },
    interests: { type: [String], default: [] },
  },
  { _id: false }
);

const resumeDraftSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    template: {
      type: String,
      enum: ["CLASSIC", "MINIMAL", "MODERN"],
      default: "CLASSIC",
    },
    personal: { type: personalSchema, default: () => ({}) },
    summary: { type: String, default: "", trim: true, maxlength: 5000 },
    skills: { type: [skillGroupSchema], default: [] },
    education: { type: [educationSchema], default: [] },
    experience: { type: [experienceSchema], default: [] },
    projects: { type: [projectSchema], default: [] },
    certifications: { type: [certificationSchema], default: [] },
    achievements: { type: [String], default: [] },
    additional: { type: additionalSchema, default: () => ({}) },
  },
  {
    timestamps: true,
    collection: "resumeDrafts",
  }
);

resumeDraftSchema.index({ userId: 1 }, { unique: true });

module.exports = mongoose.model("ResumeDraft", resumeDraftSchema);