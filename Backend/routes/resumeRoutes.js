const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");
const {
  uploadResume: uploadResumeMiddleware,
} = require("../middleware/uploadMiddleware");
const {
  uploadResume,
  getMyResumes,
  getResumeById,
  deleteResume,
  analyzeResume,
  calculateATSScore,
} = require("../controllers/resumeController");

router.post("/upload", protect, uploadResumeMiddleware, uploadResume);
router.post("/:id/analyze", protect, analyzeResume);
router.post("/:id/ats-score", protect, calculateATSScore);
router.get("/", protect, getMyResumes);
router.get("/:id", protect, getResumeById);
router.delete("/:id", protect, deleteResume);

module.exports = router;