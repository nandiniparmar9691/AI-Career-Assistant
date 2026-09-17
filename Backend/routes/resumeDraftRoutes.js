const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  getMyResumeDraft,
  createResumeDraft,
  updateResumeDraft,
  deleteResumeDraft,
  downloadResumeDraftPdf,
} = require("../controllers/resumeDraftController");

router.get("/", protect, getMyResumeDraft);
router.post("/", protect, createResumeDraft);
router.get("/:id/pdf", protect, downloadResumeDraftPdf);
router.put("/:id", protect, updateResumeDraft);
router.delete("/:id", protect, deleteResumeDraft);

module.exports = router;