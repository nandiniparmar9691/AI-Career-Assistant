const { analyzeSkillGap: geminiAnalyzeSkillGap } = require("./geminiService");

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

const ALIASES = {
  reactjs: "react",
  "react.js": "react",
  nodejs: "node.js",
  "node.js": "node",
  postgres: "postgresql",
  mysql: "mysql",
  mongodb: "mongodb",
  mongo: "mongodb",
  javascript: "javascript",
  js: "javascript",
  typescript: "typescript",
  nextjs: "next.js",
  "next.js": "next.js",
  tailwindcss: "tailwindcss",
  bootstrap: "bootstrap",
  python: "python",
  java: "java",
  golang: "go",
  springboot: "spring boot",
  "c#": "c#",
  "c++": "c++",
  sql: "sql",
  aws: "aws",
  azure: "azure",
  gcp: "google cloud",
  googlecloud: "google cloud",
  docker: "docker",
  kubernetes: "kubernetes",
  k8s: "kubernetes",
  terraform: "terraform",
  jenkins: "jenkins",
  cicd: "ci/cd",
  redis: "redis",
  git: "git",
  github: "github",
  express: "express",
  django: "django",
  flask: "flask",
  fastapi: "fastapi",
  nestjs: "nestjs",
  graphql: "graphql",
};

const normalizeName = (value) => {
  const base = asString(value).toLowerCase();
  if (!base) return "";
  const collapsed = base.replace(/[\s.]/g, "");
  return ALIASES[collapsed] || collapsed;
};

const summaryFromStatus = (analysis) => {
  const experienceStatus = (analysis.experienceMatch && analysis.experienceMatch.status) || "";
  const educationStatus = (analysis.educationMatch && analysis.educationMatch.status) || "";
  const notes = [];
  if (experienceStatus === "gap") notes.push("experience gap");
  else if (experienceStatus === "partial") notes.push("partial experience match");
  else notes.push("experience matches the role");
  if (educationStatus === "no_match") notes.push("education requirement unsatisfied");
  else if (educationStatus === "partial") notes.push("education partially matches");
  else if (educationStatus === "match") notes.push("education meets the requirement");

  const gapCounts = [
    analysis.missingSkillsCount || 0,
    analysis.missingTechnologiesCount || 0,
    analysis.missingKeywordsCount || 0,
  ];
  const totalGaps = gapCounts.reduce((a, b) => a + b, 0);

  if (totalGaps === 0) {
    return `Your resume demonstrates the key skills and technologies this role expects (${notes.join(", ")}). The remaining focus is on strengthening results you already show and preparing for interviews.`;
  }
  return `Compared with this role you have ${totalGaps} skill gap(s) to close: ${analysis.missingSkillsCount || 0} skill(s), ${analysis.missingTechnologiesCount || 0} technology/technologies, and ${analysis.missingKeywordsCount || 0} keyword(s). Your resume currently ${notes.join(", ")}. The roadmap below targets the missing areas first, prioritizing what the job description explicitly requires.`;
};

const buildRecommendations = (state, semantic) => {
  const recommendations = [];
  const seenTitles = new Set();
  const push = (item) => {
    if (!item || !item.description) return;
    const key = item.description.toLowerCase();
    if (seenTitles.has(key)) return;
    seenTitles.add(key);
    if (recommendations.length < 8) recommendations.push(item);
  };

  state.skillItems
    .filter((g) => g.priority === "HIGH")
    .slice(0, 4)
    .forEach((g) =>
      push({
        type: "SKILL",
        title: `Learn ${g.name}`,
        description: `Learn or gain hands-on experience with ${g.name}. It is listed as a required skill for this role. Build focused practice projects until you can use it confidently.`,
      })
    );

  state.techItems
    .slice(0, 4)
    .forEach((g) =>
      push({
        type: "TECHNOLOGY",
        title: `Gain practical experience with ${g.name}`,
        description: `${g.name} is a technology mentioned in the job description that is not yet demonstrated in your resume. Try a small project or tutorial series to get practical exposure. (${g.reason})`,
      })
    );

  state.keywordItems
    .filter((g) => g.priority === "LOW")
    .slice(0, 3)
    .forEach((g) =>
      push({
        type: "KEYWORD",
        title: "Refine resume keywords",
        description: `Consider mentioning "${g.name}" in your resume only if you genuinely have related experience. Never add it as if you already know it.`,
      })
    );

  const experienceStatus = state.experienceStatus;
  if (experienceStatus === "gap") {
    push({
      type: "EXPERIENCE",
      title: "Strengthen professional experience",
      description:
        "The role expects more professional experience than the resume currently shows. Add measurable results to internships and projects, and consider a relevant role or freelance work to close the gap.",
    });
  } else if (experienceStatus === "partial") {
    push({
      type: "EXPERIENCE",
      title: "Quantify your experience",
      description:
        "Your experience is close to the requirement. Write project and internship bullets with numbers: scale, impact, time saved, or results delivered.",
    });
  }

  const educationStatus = state.educationStatus;
  if (educationStatus === "no_match" || educationStatus === "partial") {
    push({
      type: "EDUCATION",
      title: "Highlight relevant coursework",
      description:
        "Bring related coursework, specializations, or certifications to the top of your resume to better evidence the education this role asks for.",
    });
  }

  if (semantic && Array.isArray(semantic.recommendations)) {
    semantic.recommendations.forEach(push);
  }

  return recommendations;
};

const mergeGapReasons = (ourItems, semanticItems) => {
  if (!Array.isArray(semanticItems) || semanticItems.length === 0) {
    return ourItems;
  }
  const byName = new Map();
  for (const item of semanticItems) {
    const key = normalizeName(item.name);
    if (key) byName.set(key, item);
  }
  return ourItems.map((item) => {
    const semantic = byName.get(normalizeName(item.name));
    if (!semantic) return item;
    return {
      name: item.name,
      priority: semantic.priority || item.priority,
      reason: semantic.reason || item.reason,
    };
  });
};

// @desc  Deterministic skill gap analysis, optionally enriched by a single Gemini call.
const analyzeSkillGap = async (matchData, resumeData, jobDescriptionData) => {
  const analysis = matchData && matchData.analysis ? matchData.analysis : matchData || {};

  const requiredSkillsMissing = asStringArray(analysis.requiredSkillsMissing);
  const preferredSkillsMissing = asStringArray(analysis.preferredSkillsMissing);
  const missingSkills = asStringArray(analysis.missingSkills);
  const missingTechnologies = asStringArray(analysis.missingTechnologies);
  const missingKeywords = asStringArray(analysis.missingKeywords);
  const matchedSkills = uniqueStrings([
    ...asStringArray(analysis.matchedSkills),
    ...asStringArray(analysis.semanticMatchedSkills),
  ]);
  const matchedTechnologies = asStringArray(analysis.matchedTechnologies);

  const requiredSet = new Set(requiredSkillsMissing.map(normalizeName).filter(Boolean));
  const preferredSet = new Set(
    requiredSkillsMissing.map(normalizeName).filter(Boolean).concat(
      preferredSkillsMissing.map(normalizeName).filter(Boolean)
    )
  );

  const skillItems = missingSkills.map((name) => {
    const key = normalizeName(name);
    if (requiredSet.has(key)) {
      return {
        name,
        priority: "HIGH",
        reason: "Listed as a required skill in the job description.",
      };
    }
    if (preferredSet.has(key)) {
      return {
        name,
        priority: "MEDIUM",
        reason: "Listed as a preferred skill in the job description.",
      };
    }
    return {
      name,
      priority: "MEDIUM",
      reason: "Mentioned in the job description; relevant to the role.",
    };
  });

  const techItems = missingTechnologies.map((name) => {
    const key = normalizeName(name);
    if (requiredSet.has(key) || preferredSet.has(key)) {
      return {
        name,
        priority: "HIGH",
        reason: "Core technology needed for this role, referenced in the job description.",
      };
    }
    return {
      name,
      priority: "MEDIUM",
      reason: "Technology listed in the job description; gaining exposure strengthens your fit.",
    };
  });

  const keywordItems = missingKeywords.map((name) => {
    const key = normalizeName(name);
    if (requiredSet.has(key) || preferredSet.has(key)) {
      return {
        name,
        priority: "HIGH",
        reason: "Appears as a required keyword in the job description.",
      };
    }
    return {
      name,
      priority: "LOW",
      reason:
        "Nice-to-have keyword from the job description. Mention it in your resume only if you genuinely have related experience.",
    };
  });

  const state = {
    skillItems,
    techItems,
    keywordItems,
    experienceStatus: analysis.experienceMatch && analysis.experienceMatch.status,
    educationStatus: analysis.educationMatch && analysis.educationMatch.status,
  };

  const strengths = uniqueStrings([...matchedSkills, ...matchedTechnologies]);

  let semantic = null;
  try {
    const geminiResult = await geminiAnalyzeSkillGap(
      {
        missingSkills: missingSkills.map((n) => ({ name: n })),
        missingTechnologies: missingTechnologies.map((n) => ({ name: n })),
        missingKeywords: missingKeywords.map((n) => ({ name: n })),
        matchedSkills,
        matchedTechnologies,
        matchPercentage:
          analysis.matchPercentage != null ? analysis.matchPercentage : null,
        experienceMatch: analysis.experienceMatch || {},
        educationMatch: analysis.educationMatch || {},
      },
      {
        technicalSkills: asStringArray(
          resumeData && resumeData.analysis && resumeData.analysis.skills && resumeData.analysis.skills.technical
        ),
        softSkills: asStringArray(
          resumeData && resumeData.analysis && resumeData.analysis.skills && resumeData.analysis.skills.soft
        ),
        summary: asString(resumeData && resumeData.analysis && resumeData.analysis.summary),
        text: asString(resumeData && resumeData.extractedText),
      },
      {
        jobTitle: asString(jobDescriptionData && jobDescriptionData.analysis && jobDescriptionData.analysis.jobTitle),
        company: asString(jobDescriptionData && jobDescriptionData.analysis && jobDescriptionData.analysis.company),
        requiredSkills: asStringArray(
          jobDescriptionData && jobDescriptionData.analysis && jobDescriptionData.analysis.requiredSkills
        ),
        preferredSkills: asStringArray(
          jobDescriptionData && jobDescriptionData.analysis && jobDescriptionData.analysis.preferredSkills
        ),
        keywords: asStringArray(jobDescriptionData && jobDescriptionData.analysis && jobDescriptionData.analysis.keywords),
        technologies: asStringArray(
          jobDescriptionData && jobDescriptionData.analysis && (
            jobDescriptionData.analysis.technologies ||
            jobDescriptionData.analysis.requiredSkills ||
            jobDescriptionData.analysis.programmingLanguages ||
            jobDescriptionData.analysis.frameworks ||
            jobDescriptionData.analysis.databases ||
            jobDescriptionData.analysis.tools ||
            jobDescriptionData.analysis.cloudTechnologies
          )
        ),
        responsibilities: asStringArray(
          jobDescriptionData && jobDescriptionData.analysis && jobDescriptionData.analysis.responsibilities
        ),
      },
      new Set()
    );
    semantic = geminiResult.result;
  } catch (error) {
    console.error("Gemini skill gap overlay skipped/errored:", error.message);
    semantic = null;
  }

  const missingSkillsCount = skillItems.length;
  const missingTechnologiesCount = techItems.length;
  const missingKeywordsCount = keywordItems.length;

  const summaryState = {
    ...state,
    missingSkillsCount,
    missingTechnologiesCount,
    missingKeywordsCount,
  };

  const finalSkillItems = mergeGapReasons(skillItems, semantic && semantic.missingSkills);
  const finalTechItems = mergeGapReasons(techItems, semantic && semantic.missingTechnologies);
  const finalKeywordItems = mergeGapReasons(keywordItems, semantic && semantic.missingKeywords);

  const recommendations = buildRecommendations(state, semantic);

  return {
    strengths,
    missingSkills: finalSkillItems,
    missingTechnologies: finalTechItems,
    missingKeywords: finalKeywordItems,
    recommendations,
    overallSummary: (semantic && semantic.overallSummary) || summaryFromStatus(summaryState),
  };
};

module.exports = { analyzeSkillGap };