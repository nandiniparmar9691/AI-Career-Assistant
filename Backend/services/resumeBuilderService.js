const {
  generateOptimizedResume: geminiGenerateOptimizedResume,
} = require("./geminiService");

const asString = (value) => (typeof value === "string" ? value.trim() : "");

const asStringArray = (value) =>
  Array.isArray(value)
    ? value
        .filter((item) => typeof item === "string" || typeof item === "number")
        .map((item) => String(item).trim())
        .filter(Boolean)
    : [];

const uniqueStrings = (items) => {
  const seen = new Set();
  const result = [];
  for (const item of items || []) {
    const key = String(item || "").trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(String(item).trim());
  }
  return result;
};

const extractEmail = (text) => {
  const match = asString(text).match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  return match ? match[0] : "";
};

const collectJdKeywordsNotDemonstrated = (skillsSet, data) => {
  const candidates = [];
  const match = data.match || null;
  const matchAnalysis = match && match.analysis ? match.analysis : {};
  const gap = data.skillGap || null;

  if (match) {
    candidates.push(
      asStringArray(matchAnalysis.missingSkills),
      asStringArray(matchAnalysis.missingTechnologies),
      asStringArray(matchAnalysis.missingKeywords),
      asStringArray(matchAnalysis.requiredSkillsMissing)
    );
  }
  if (gap) {
    candidates.push(
      (gap.missingSkills || []).map((g) => asString(g && g.name)),
      (gap.missingTechnologies || []).map((g) => asString(g && g.name)),
      (gap.missingKeywords || []).map((g) => asString(g && g.name))
    );
  }
  const jd = data.jd || null;
  const jdAnalysis = jd && jd.analysis ? jd.analysis : {};
  if (jd) {
    candidates.push(
      asStringArray(jdAnalysis.requiredSkills),
      asStringArray(
        jdAnalysis.technologies ||
          jdAnalysis.programmingLanguages ||
          jdAnalysis.frameworks ||
          jdAnalysis.databases ||
          jdAnalysis.tools ||
          jdAnalysis.cloudTechnologies ||
          []
      ),
      asStringArray(jdAnalysis.keywords)
    );
  }

  const notDemonstrated = [];
  const seen = new Set();
  candidates.flat().forEach((item) => {
    const key = String(item || "").trim().toLowerCase();
    if (!key || seen.has(key)) return;
    seen.add(key);
    if (!skillsSet.has(key)) notDemonstrated.push(String(item).trim());
  });
  return notDemonstrated.slice(0, 20);
};

// @desc  Deterministic fallback resume builder used when Gemini is unavailable
//        or fails. Produces a faithful structure from the source resume analysis.
const generateResumeFallback = (data) => {
  const resume = data && data.resume ? data.resume : {};
  const analysis = resume.analysis || {};
  const sourceText = asString(resume.extractedText);

  const technical = uniqueStrings(
    asStringArray(analysis.skills && analysis.skills.technical)
  );
  const soft = uniqueStrings(asStringArray(analysis.skills && analysis.skills.soft));

  const skills = [];
  if (technical.length) skills.push({ category: "Technical", items: technical });
  if (soft.length) skills.push({ category: "Soft Skills", items: soft });

  const experienceObservations = asStringArray(
    analysis.experience && analysis.experience.observations
  );
  const experience = [];
  if (experienceObservations.length) {
    experience.push({
      company: "",
      role: "",
      location: "",
      startDate: "",
      endDate: "",
      bullets: experienceObservations,
    });
  }

  const projectObservations = asStringArray(
    analysis.projects && analysis.projects.observations
  );
  const projects = [];
  if (projectObservations.length) {
    projects.push({
      name: "",
      technologies: [],
      description: asString(analysis.projects && analysis.projects.summary),
      bullets: projectObservations,
      link: "",
    });
  }

  const educationObservations = asStringArray(
    analysis.education && analysis.education.observations
  );
  const education = [];
  if (educationObservations.length) {
    education.push({
      institution: "",
      degree: "",
      field: "",
      location: "",
      startDate: "",
      endDate: "",
      details: educationObservations,
    });
  }

  const certifications = asStringArray(analysis.certifications).map((name) => ({
    name,
    issuer: "",
    date: "",
    link: "",
  }));

  const skillsSet = new Set(
    [...technical, ...soft].map((s) => s.toLowerCase())
  );
  const keywordsNotUsed = collectJdKeywordsNotDemonstrated(skillsSet, data);

  const notes = [
    "Reworded and reorganized the content directly from your source resume analysis.",
  ];
  if (!technical.length) notes.push("No technical skills were found in your resume analysis.");
  if (!experienceObservations.length) notes.push("No work experience section found.");
  if (!projectObservations.length) notes.push("No projects section found.");
  notes.push("Review and complete contact details, company names, roles and dates before downloading.");

  return {
    targetRole: asString(data && data.targetRole),
    content: {
      contact: {
        name: "",
        email: extractEmail(sourceText),
        phone: "",
        location: "",
        linkedin: "",
        github: "",
        portfolio: "",
      },
      summary: asString(analysis.summary),
      skills,
      experience,
      projects,
      education,
      certifications,
      additional: {
        languages: [],
        achievements: [],
        interests: [],
      },
    },
    atsMetadata: {
      keywordsUsed: uniqueStrings([...technical, ...soft]),
      keywordsNotUsed,
      optimizationNotes: notes,
    },
  };
};

// @desc  Generate an ATS-optimized resume draft. Uses Gemini when available and
//        falls back to a faithful deterministic builder so generation always works.
const generateOptimizedResume = async (data) => {
  try {
    const geminiResult = await geminiGenerateOptimizedResume(data);
    if (geminiResult && geminiResult.result) {
      return geminiResult.result;
    }
  } catch (error) {
    console.error("Gemini resume generation skipped/errored:", error.message);
  }
  return generateResumeFallback(data);
};

module.exports = { generateOptimizedResume };