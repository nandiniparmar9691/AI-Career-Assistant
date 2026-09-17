const mongoose = require("mongoose");
const JobApplication = require("../models/JobApplication");
const Resume = require("../models/Resume");
const MockInterview = require("../models/MockInterview");
const SkillGap = require("../models/SkillGap");
const JobDescription = require("../models/JobDescription");

// Status buckets map the tracker statuses into analytics-friendly categories.
const STATUS_BUCKETS = {
  APPLIED: ["APPLIED"],
  IN_REVIEW: ["SCREENING"],
  INTERVIEW: ["INTERVIEW", "TECHNICAL_ROUND", "FINAL_ROUND"],
  OFFER: ["OFFER"],
  REJECTED: ["REJECTED"],
};

const asArray = (value) =>
  Array.isArray(value) ? value.filter((item) => typeof item === "string" && item.trim()) : [];

const asStringArray = (value) => asArray(value).map((item) => item.trim());

const toCountMap = (names) => {
  const map = new Map();
  for (const name of names) {
    const key = name.toLowerCase();
    const existing = map.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      map.set(key, { name, count: 1 });
    }
  }
  const list = [...map.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  return list.map((item) => item.name);
};

const percent = (part, total) => (total > 0 ? Math.round((part / total) * 1000) / 10 : 0);

const buildApplications = async (userId) => {
  const rows = await JobApplication.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);

  const counts = { SAVED: 0, APPLIED: 0, SCREENING: 0, INTERVIEW: 0, TECHNICAL_ROUND: 0, FINAL_ROUND: 0, OFFER: 0, REJECTED: 0, WITHDRAWN: 0 };
  rows.forEach((row) => {
    counts[row._id] = row.count;
  });

  const total = Object.values(counts).reduce((sum, value) => sum + value, 0);
  const bucketCount = (bucket) =>
    bucket.reduce((sum, status) => sum + counts[status], 0);

  const applied = counts.APPLIED;
  const inReview = counts.SCREENING;
  const interview = bucketCount(STATUS_BUCKETS.INTERVIEW);
  const offer = counts.OFFER;
  const rejected = counts.REJECTED;

  const statusCounts = Object.keys(counts).map((status) => ({
    status,
    count: counts[status],
  })).filter((item) => item.count > 0);

  return {
    total,
    applied,
    inReview,
    interview,
    offer,
    rejected,
    saved: counts.SAVED,
    withheld: counts.WITHDRAWN,
    statusCounts,
    responseRate: percent(interview + offer + rejected, total),
    interviewRate: percent(interview, total),
    conversionRate: percent(offer, total),
  };
};

const buildTimeline = async (userId) => {
  const rows = await JobApplication.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
        total: { $sum: 1 },
        applied: { $sum: { $cond: [{ $eq: ["$status", "APPLIED"] }, 1, 0] } },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  return rows.map((row) => ({
    month: row._id,
    total: row.total,
    applied: row.applied,
  }));
};

const buildInterviews = async (userId) => {
  const interviews = await MockInterview.find({ userId })
    .select("status evaluation targetRole completedAt answers")
    .sort({ createdAt: -1 });

  const total = interviews.length;
  const completedDocs = interviews.filter((item) => item.status === "COMPLETED");
  const inProgress = interviews.filter((item) => item.status === "IN_PROGRESS").length;
  const completed = completedDocs.length;

  const scored = completedDocs.filter(
    (item) => item.evaluation && item.evaluation.overallScore != null
  );
  const averageScore =
    scored.length > 0
      ? Math.round(
          (scored.reduce((sum, item) => sum + item.evaluation.overallScore, 0) /
            scored.length) *
            10
        ) / 10
      : 0;

  const categoryScores = new Map();
  completedDocs.forEach((interview) => {
    (interview.answers || []).forEach((answer) => {
      if (!answer.category || answer.score == null) return;
      const entry = categoryScores.get(answer.category) || { sum: 0, count: 0 };
      entry.sum += answer.score;
      entry.count += 1;
      categoryScores.set(answer.category, entry);
    });
  });

  const categories = [...categoryScores.entries()]
    .map(([name, entry]) => ({
      name,
      averageScore: Math.round((entry.sum / entry.count) * 10) / 10,
    }))
    .sort((a, b) => b.averageScore - a.averageScore);

  const recent = scored.slice(0, 5).map((item) => ({
    id: item._id,
    targetRole: item.targetRole || "",
    score: item.evaluation.overallScore,
    completedAt: item.completedAt || null,
  }));

  return {
    total,
    completed,
    inProgress,
    averageScore,
    strongestCategory: categories[0] || null,
    weakestCategory: categories[categories.length - 1] || null,
    recent,
  };
};

const hasAnalysisData = (resume) => {
  const analysis = resume.analysis;
  if (!analysis) return false;
  if (analysis.summary && analysis.summary.trim()) return true;
  const skills = analysis.skills || {};
  if ((skills.technical || []).length > 0) return true;
  if ((skills.soft || []).length > 0) return true;
  if ((analysis.strengths || []).length > 0) return true;
  return false;
};

const buildResume = async (userId) => {
  const resumes = await Resume.find({ userId }).select(
    "analysis atsScore fileName createdAt"
  );

  const analyzed = resumes.filter(hasAnalysisData).length;

  const scored = resumes
    .filter(
      (resume) =>
        resume.atsScore &&
        resume.atsScore.overallScore != null
    )
    .map((resume) => ({
      resume,
      score: resume.atsScore.overallScore,
      at: resume.atsScore.analyzedAt || resume.createdAt,
    }))
    .sort((a, b) => new Date(a.at) - new Date(b.at));

  const scores = scored.map((item) => item.score);
  const averageAtsScore =
    scores.length > 0
      ? Math.round(
          (scores.reduce((sum, value) => sum + value, 0) / scores.length) * 10
        ) / 10
      : 0;
  const highestAtsScore = scores.length > 0 ? Math.max(...scores) : 0;
  const latestScored = scored[scored.length - 1];

  const atsTrend = scored.map((item) => ({
    date: item.at,
    score: item.score,
    fileName: item.resume.fileName || "",
  }));

  return {
    analyzed,
    averageAtsScore,
    highestAtsScore,
    latestAtsScore: latestScored ? latestScored.score : 0,
    atsTrend,
  };
};

const buildSkills = async (userId) => {
  const resumes = await Resume.find({
    userId,
    analysis: { $ne: null },
  }).select("analysis");

  const userSkillMap = new Map();
  resumes.forEach((resume) => {
    if (!hasAnalysisData(resume)) return;
    const analysis = resume.analysis || {};
    const skills = analysis.skills || {};
    asStringArray(skills.technical).concat(asStringArray(skills.soft)).forEach((name) => {
      const key = name.toLowerCase();
      const current = userSkillMap.get(key) || { name, count: 0 };
      current.count += 1;
      current.name = name;
      userSkillMap.set(key, current);
    });
  });
  const userSkills = [...userSkillMap.values()]
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, 20)
    .map((item) => item.name);

  const jds = await JobDescription.find({ userId }).select("analysis");

  const requiredNames = [];
  jds.forEach((jd) => {
    const analysis = jd.analysis || {};
    requiredNames.push(
      ...asStringArray(analysis.requiredSkills),
      ...asStringArray(analysis.programmingLanguages),
      ...asStringArray(analysis.frameworks),
      ...asStringArray(analysis.databases),
      ...asStringArray(analysis.tools),
      ...asStringArray(analysis.technologies)
    );
  });
  const requiredSkills = toCountMap(requiredNames).slice(0, 20);

  const gaps = await SkillGap.find({ userId }).select(
    "missingSkills missingTechnologies missingKeywords"
  );

  const missingNames = [];
  gaps.forEach((gap) => {
    (gap.missingSkills || []).concat(gap.missingTechnologies || []).concat(gap.missingKeywords || [])
      .forEach((item) => {
        if (item && item.name) missingNames.push(item.name);
      });
  });
  const missingSkills = toCountMap(missingNames).slice(0, 20);

  return { userSkills, requiredSkills, missingSkills };
};

// @desc    Get the current user's career analytics
// @route   GET /api/analytics
// @access  Private
const getCareerAnalytics = async (req, res) => {
  try {
    const data = {
      applications: await buildApplications(req.user._id),
      interviews: await buildInterviews(req.user._id),
      resume: await buildResume(req.user._id),
      skills: await buildSkills(req.user._id),
      timeline: await buildTimeline(req.user._id),
    };

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Get analytics error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error, please try again",
    });
  }
};

module.exports = {
  getCareerAnalytics,
};