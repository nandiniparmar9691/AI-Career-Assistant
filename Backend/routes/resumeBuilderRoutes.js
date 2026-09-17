const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  generateResume,
  getMyResumes,
  getResumeById,
  updateResume,
  deleteResume,
  downloadPdf,
} = require("../controllers/resumeBuilderController");

router.post("/generate", protect, generateResume);
router.get("/", protect, getMyResumes);
router.get("/:id", protect, getResumeById);
router.put("/:id", protect, updateResume);
router.delete("/:id", protect, deleteResume);
router.get("/:id/pdf", protect, downloadPdf);

module.exports = router;