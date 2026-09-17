const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  createApplication,
  getMyApplications,
  getApplicationById,
  updateApplication,
  updateApplicationStatus,
  deleteApplication,
} = require("../controllers/jobApplicationController");

router.post("/", protect, createApplication);
router.get("/", protect, getMyApplications);
router.get("/:id", protect, getApplicationById);
router.put("/:id", protect, updateApplication);
router.patch("/:id/status", protect, updateApplicationStatus);
router.delete("/:id", protect, deleteApplication);

module.exports = router;