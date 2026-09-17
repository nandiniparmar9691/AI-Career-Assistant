const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  createResumeMatch,
  getMyMatches,
  getMatchById,
  deleteMatch,
} = require("../controllers/matchController");

router.post("/", protect, createResumeMatch);
router.get("/", protect, getMyMatches);
router.get("/:id", protect, getMatchById);
router.delete("/:id", protect, deleteMatch);

module.exports = router;