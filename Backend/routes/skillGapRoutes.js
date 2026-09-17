const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  createSkillGap,
  getMySkillGaps,
  getSkillGapById,
  deleteSkillGap,
} = require("../controllers/skillGapController");

router.post("/", protect, createSkillGap);
router.get("/", protect, getMySkillGaps);
router.get("/:id", protect, getSkillGapById);
router.delete("/:id", protect, deleteSkillGap);

module.exports = router;