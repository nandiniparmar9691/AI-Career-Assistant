const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  generateQuestions,
  getMyQuestionSets,
  getQuestionSetById,
  deleteQuestionSet,
} = require("../controllers/interviewQuestionController");

router.post("/generate", protect, generateQuestions);
router.get("/", protect, getMyQuestionSets);
router.get("/:id", protect, getQuestionSetById);
router.delete("/:id", protect, deleteQuestionSet);

module.exports = router;