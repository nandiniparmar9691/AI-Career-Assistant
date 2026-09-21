const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
require("dotenv").config();

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const resumeRoutes = require("./routes/resumeRoutes");
const jobDescriptionRoutes = require("./routes/jobDescriptionRoutes");
const matchRoutes = require("./routes/matchRoutes");
const skillGapRoutes = require("./routes/skillGapRoutes");
const roadmapRoutes = require("./routes/roadmapRoutes");
const interviewQuestionRoutes = require("./routes/interviewQuestionRoutes");
const mockInterviewRoutes = require("./routes/mockInterviewRoutes");
const resumeBuilderRoutes = require("./routes/resumeBuilderRoutes");
const jobApplicationRoutes = require("./routes/jobApplicationRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const resumeDraftRoutes = require("./routes/resumeDraftRoutes");

if (!process.env.JWT_SECRET) {
  console.error(
    "Server cannot start: JWT_SECRET is missing. Set it in Backend/.env before starting."
  );
  process.exit(1);
}

const app = express();

const normalizeOrigin = (url) =>
  url.trim().replace(/^CLIENT_URL=/i, "").replace(/\/+$/, "");

const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  ...(process.env.CLIENT_URL || "").split(",").map(normalizeOrigin).filter(Boolean),
];

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, origin);
      } else {
        callback(null, false);
      }
    },
    credentials: true,
    exposedHeaders: ["Content-Disposition"],
  })
);

app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/resumes", resumeRoutes);
app.use("/api/job-descriptions", jobDescriptionRoutes);
app.use("/api/matches", matchRoutes);
app.use("/api/skill-gaps", skillGapRoutes);
app.use("/api/roadmaps", roadmapRoutes);
app.use("/api/interview-questions", interviewQuestionRoutes);
app.use("/api/mock-interviews", mockInterviewRoutes);
app.use("/api/resume-builder", resumeBuilderRoutes);
app.use("/api/applications", jobApplicationRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/resume-drafts", resumeDraftRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

app.use((err, req, res, next) => {
  console.error("Server error:", err.message);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Server error",
  });
});

connectDB();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});