const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  startMockInterview,
  getMyMockInterviews,
  getMockInterviewById,
  submitAnswer,
  completeMockInterview,
  deleteMockInterview,
} = require("../controllers/mockInterviewController");

router.post("/", protect, startMockInterview);
router.get("/", protect, getMyMockInterviews);
router.get("/:id", protect, getMockInterviewById);
router.patch("/:id/answer", protect, submitAnswer);
router.post("/:id/complete", protect, completeMockInterview);
router.delete("/:id", protect, deleteMockInterview);

module.exports = router;