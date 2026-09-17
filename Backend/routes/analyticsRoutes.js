const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { getCareerAnalytics } = require("../controllers/analyticsController");

router.get("/", protect, getCareerAnalytics);

module.exports = router;