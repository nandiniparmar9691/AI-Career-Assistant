const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  createJobDescription,
  getMyJobDescriptions,
  getJobDescriptionById,
  deleteJobDescription,
} = require("../controllers/jobDescriptionController");

router.post("/", protect, createJobDescription);
router.get("/", protect, getMyJobDescriptions);
router.get("/:id", protect, getJobDescriptionById);
router.delete("/:id", protect, deleteJobDescription);

module.exports = router;