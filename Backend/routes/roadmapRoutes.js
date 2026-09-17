const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  createRoadmap,
  getMyRoadmaps,
  getRoadmapById,
  updateRoadmapProgress,
  deleteRoadmap,
} = require("../controllers/roadmapController");

router.post("/", protect, createRoadmap);
router.get("/", protect, getMyRoadmaps);
router.get("/:id", protect, getRoadmapById);
router.patch("/:id/progress", protect, updateRoadmapProgress);
router.delete("/:id", protect, deleteRoadmap);

module.exports = router;