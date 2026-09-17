const { matchResumeWithJobDescription } = require("./geminiService");

const clampNumber = (value, min, max) =>
  Math.min(Math.max(value, min), max);

const clampInt = (value, max) =>
  Number.isFinite(value) ? Math.round(clampNumber(value, 0, max)) : 0;

const round1 = (value) => Math.round(value * 10) / 10;

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

const asStringArray = (value) =>
  Array.isArray(value)
    ? value
        .filter((item) => typeof item === "string" || typeof item === "number")
        .map((item) => String(item).trim())
        .filter(Boolean)
    : [];

const asString = (value) =>
  typeof value === "string" ? value.trim() : "";

// Skill aliasing: map a learned vocabulary of variants to canonical keys.
const CANONICAL = {
  react: "react",
  "react.js": "react",
  "reactjs": "react",
  "react js": "react",
  "node": "node.js",
  "node.js": "node.js",
  "nodejs": "node.js",
  "node js": "node.js",
  "express": "express",
  "express.js": "express",
  "expressjs": "express",
  "express js": "express",
  "mongodb": "mongodb",
  "mongo": "mongodb",
  "mongoose": "mongoose",
  "postgres": "postgresql",
  "postgresql": "postgresql",
  "mysql": "mysql",
  "javascript": "javascript",
  "js": "javascript",
  "typescript": "typescript",
  "ts": "typescript",
  "next": "next.js",
  "next.js": "next.js",
  "nextjs": "next.js",
  "next js": "next.js",
  "vue": "vue",
  "vue.js": "vue",
  "vuejs": "vue",
  "angular": "angular",
  "svelte": "svelte",
  "tailwind": "tailwindcss",
  "tailwind css": "tailwindcss",
  "tailwindcss": "tailwindcss",
  "bootstrap": "bootstrap",
  "jquery": "jquery",
  "redux": "redux",
  "graphql": "graphql",
  "html": "html",
  "html5": "html",
  "css": "css",
  "css3": "css",
  "sass": "sass",
  "python": "python",
  "java": "java",
  "c++": "c++",
  "cpp": "c++",
  "c": "c",
  "c#": "c#",
  "csharp": "c#",
  "c-sharp": "c#",
  "golang": "go",
  "go": "go",
  "rust": "rust",
  "php": "php",
  "ruby": "ruby",
  "swift": "swift",
  "kotlin": "kotlin",
  "scala": "scala",
  "dart": "dart",
  "sql": "sql",
  "bash": "bash",
  "shell": "shell",
  "django": "django",
  "flask": "flask",
  "fastapi": "fastapi",
  "spring": "springboot",
  "spring boot": "springboot",
  "springboot": "springboot",
  "nestjs": "nestjs",
  "nest": "nestjs",
  "laravel": "laravel",
  "rails": "rails",
  "ruby on rails": "rails",
  "asp.net": "asp.net",
  ".net": ".net",
  ".net core": ".netcore",
  "dotnet": ".net",
  "rest api": "restapi",
  "restful api": "restapi",
  "rest": "restapi",
  "microservices": "microservices",
  "sqlite": "sqlite",
  "redis": "redis",
  "oracle": "oracle",
  "dynamodb": "dynamodb",
  "firebase": "firebase",
  "supabase": "supabase",
  "prisma": "prisma",
  "sql server": "sqlserver",
  "mssql": "sqlserver",
  "aws": "aws",
  "amazon web services": "aws",
  "azure": "azure",
  "gcp": "googlecloud",
  "google cloud": "googlecloud",
  "docker": "docker",
  "kubernetes": "kubernetes",
  "k8s": "kubernetes",
  "terraform": "terraform",
  "jenkins": "jenkins",
  "github actions": "githubactions",
  "ci/cd": "cicd",
  "ci cd": "cicd",
  "nginx": "nginx",
  "vercel": "vercel",
  "netlify": "netlify",
  "linux": "linux",
  "git": "git",
  "github": "github",
  "gitlab": "gitlab",
  "bitbucket": "bitbucket",
  "jira": "jira",
  "postman": "postman",
  "figma": "figma",
  "vite": "vite",
  "webpack": "webpack",
  "babel": "babel",
  "eslint": "eslint",
  "jest": "jest",
  "cypress": "cypress",
  "pytest": "pytest",
  "selenium": "selenium",
  "pandas": "pandas",
  "numpy": "numpy",
  "tensorflow": "tensorflow",
  "pytorch": "pytorch",
  "machine learning": "ml",
  "ml": "ml",
  "deep learning": "deeplearning",
  "data structures": "datastructures",
  "algorithms": "algorithms",
  "npm": "npm",
  "yarn": "yarn",
  "agile": "agile",
  "scrum": "scrum",
  "restful": "restapi",
};

const DISPLAY = {
  react: "React",
  "node.js": "Node.js",
  express: "Express",
  mongodb: "MongoDB",
  mongoose: "Mongoose",
  postgresql: "PostgreSQL",
  mysql: "MySQL",
  javascript: "JavaScript",
  typescript: "TypeScript",
  "next.js": "Next.js",
  vue: "Vue.js",
  angular: "Angular",
  svelte: "Svelte",
  tailwindcss: "Tailwind CSS",
  bootstrap: "Bootstrap",
  jquery: "jQuery",
  redux: "Redux",
  graphql: "GraphQL",
  html: "HTML",
  css: "CSS",
  sass: "Sass",
  python: "Python",
  java: "Java",
  "c++": "C++",
  "c": "C",
  "c#": "C#",
  go: "Go",
  rust: "Rust",
  php: "PHP",
  ruby: "Ruby",
  swift: "Swift",
  kotlin: "Kotlin",
  scala: "Scala",
  dart: "Dart",
  sql: "SQL",
  bash: "Bash",
  shell: "Shell",
  django: "Django",
  flask: "Flask",
  fastapi: "FastAPI",
  springboot: "Spring Boot",
  nestjs: "NestJS",
  laravel: "Laravel",
  rails: "Ruby on Rails",
  "asp.net": "ASP.NET",
  ".net": ".NET",
  ".netcore": ".NET Core",
  restapi: "REST API",
  microservices: "Microservices",
  sqlite: "SQLite",
  redis: "Redis",
  oracle: "Oracle",
  dynamodb: "DynamoDB",
  firebase: "Firebase",
  supabase: "Supabase",
  prisma: "Prisma",
  sqlserver: "SQL Server",
  aws: "AWS",
  azure: "Azure",
  googlecloud: "Google Cloud",
  docker: "Docker",
  kubernetes: "Kubernetes",
  terraform: "Terraform",
  jenkins: "Jenkins",
  githubactions: "GitHub Actions",
  cicd: "CI/CD",
  nginx: "Nginx",
  vercel: "Vercel",
  netlify: "Netlify",
  linux: "Linux",
  git: "Git",
  github: "GitHub",
  gitlab: "GitLab",
  bitbucket: "Bitbucket",
  jira: "Jira",
  postman: "Postman",
  figma: "Figma",
  vite: "Vite",
  webpack: "Webpack",
  babel: "Babel",
  eslint: "ESLint",
  jest: "Jest",
  cypress: "Cypress",
  pytest: "pytest",
  selenium: "Selenium",
  pandas: "Pandas",
  numpy: "NumPy",
  tensorflow: "TensorFlow",
  pytorch: "PyTorch",
  ml: "Machine Learning",
  deeplearning: "Deep Learning",
  datastructures: "Data Structures",
  algorithms: "Algorithms",
  npm: "npm",
  yarn: "Yarn",
  agile: "Agile",
  scrum: "Scrum",
};

const normalizeSkill = (item) => {
  if (!item) return null;
  const base = String(item).trim().toLowerCase();
  if (!base) return null;
  const collapsed = base.replace(/\s+/g, " ").replace(/[\s.]/g, "");
  if (CANONICAL[collapsed]) return CANONICAL[collapsed];
  if (CANONICAL[base]) return CANONICAL[base];
  return base;
};

const presentInText = (term, text) => {
  if (!term || !text) return false;
  const lower = text.toLowerCase();
  const base = String(term).trim().toLowerCase();
  if (!base) return false;

  const hasNonAlpha = /[^a-z0-9 ]/.test(base);
  if (base.length <= 3 || hasNonAlpha) {
    const esc = base.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = esc
      .replace(/\./g, "[.]?")
      .replace(/ /g, "\\s*")
      .replace(/\+/g, "\\+")
      .replace(/#/g, "#");
    const regex = new RegExp(`\\b${pattern}\\b`, "i");
    if (regex.test(text)) return true;
    return lower.includes(base.replace(/\./g, ""));
  }

  const collapsed = base.replace(/[\s.]/g, "");
  if (lower.includes(collapsed)) return true;
  if (lower.includes(base)) return true;
  return false;
};

const displaySkill = (canonical, original) => {
  return DISPLAY[canonical] || original || canonical;
};

const buildResumeSkillSet = (resume) => {
  const set = new Set();
  const analysis = resume.analysis || {};
  const technical = asStringArray(
    analysis.skills && analysis.skills.technical
  );
  for (const skill of technical) {
    const c = normalizeSkill(skill);
    if (c) set.add(c);
  }
  if (resume.atsScore && Array.isArray(resume.atsScore.detectedKeywords)) {
    for (const keyword of resume.atsScore.detectedKeywords) {
      const c = normalizeSkill(keyword);
      if (c) set.add(c);
    }
  }
  return set;
};

const buildResumeKeywords = (resume) => {
  const keywords = [];
  const analysis = resume.analysis || {};
  const technical = asStringArray(
    analysis.skills && analysis.skills.technical
  );
  keywords.push(...technical);
  if (resume.atsScore && Array.isArray(resume.atsScore.detectedKeywords)) {
    keywords.push(...resume.atsScore.detectedKeywords);
  }
  return uniqueStrings(keywords);
};

const buildJdTechList = (analysis) => {
  const tech = [];
  tech.push(...asStringArray(analysis.programmingLanguages));
  tech.push(...asStringArray(analysis.frameworks));
  tech.push(...asStringArray(analysis.databases));
  tech.push(...asStringArray(analysis.tools));
  tech.push(...asStringArray(analysis.cloudTechnologies));
  tech.push(...asStringArray(analysis.technologies));
  return uniqueStrings(tech);
};

const buildJdKeywordList = (analysis) => {
  const keywords = asStringArray(analysis.keywords);
  if (keywords.length) return keywords;
  keywords.push(...asStringArray(analysis.requiredSkills));
  keywords.push(...asStringArray(analysis.preferredSkills));
  keywords.push(...buildJdTechList(analysis));
  return uniqueStrings(keywords);
};

const matchSkills = (jdItems, resumeSkillSet, resumeText) => {
  const matched = [];
  const missing = [];
  for (const item of jdItems) {
    const canonical = normalizeSkill(item);
    const isMatched =
      (canonical && resumeSkillSet.has(canonical)) ||
      presentInText(item, resumeText);
    const label = isMatched
      ? displaySkill(canonical, item)
      : String(item).trim();
    (isMatched ? matched : missing).push(label);
  }
  return { matched: uniqueStrings(matched), missing: uniqueStrings(missing) };
};

const scoreSkills = (result) => {
  const feedback = [];

  const required = result.required || [];
  const preferred = result.preferred || [];

  const matchedRequired = result.requiredMatched || [];
  const missingRequired = result.requiredMissing || [];
  const matchedPreferred = result.preferredMatched || [];

  if (!required.length && !preferred.length) {
    feedback.push(
      "The job description does not list specific skills, so no skill penalty was applied."
    );
    return { score: 30, maxScore: 30, feedback };
  }

  const requiredWeight = required.length * 2;
  const preferredWeight = preferred.length;
  const totalWeight = requiredWeight + preferredWeight;

  const earnedRequired = matchedRequired.length * 2;
  const earnedPreferred = matchedPreferred.length;
  const earned = earnedRequired + earnedPreferred;

  const score = totalWeight > 0 ? round1((30 * earned) / totalWeight) : 30;

  feedback.push(
    `Matched ${matchedRequired.length} of ${required.length} required and ${matchedPreferred.length} of ${preferred.length} preferred skills.`
  );
  if (missingRequired.length) {
    feedback.push(
      `Missing required skills: ${missingRequired.join(", ")}.`
    );
  }
  if (result.preferredMissing && result.preferredMissing.length) {
    feedback.push(
      `Missing preferred skills: ${result.preferredMissing.join(", ")}.`
    );
  }

  return { score, maxScore: 30, feedback };
};

const scoreKeywords = (result) => {
  const feedback = [];
  const { matched = [], missing = [] } = result;

  if (!result.total) {
    feedback.push("The job description does not list keywords.");
    return { score: 20, maxScore: 20, feedback };
  }

  const score = round1((20 * matched.length) / result.total);
  feedback.push(
    `Matched ${matched.length} of ${result.total} JD keywords in the resume.`
  );
  if (missing.length) {
    feedback.push(`Missing keywords: ${missing.join(", ")}.`);
  }

  return { score, maxScore: 20, feedback };
};

const scoreTechnologies = (result) => {
  const feedback = [];
  const { matched = [], missing = [] } = result;

  if (!result.total) {
    feedback.push(
      "The job description does not list specific technologies to compare."
    );
    return { score: 20, maxScore: 20, feedback };
  }

  const score = round1((20 * matched.length) / result.total);
  feedback.push(
    `Matched ${matched.length} of ${result.total} JD technologies in the resume.`
  );
  if (missing.length) {
    feedback.push(`Missing technologies: ${missing.join(", ")}.`);
  }

  return { score, maxScore: 20, feedback };
};

const CURRENT_YEAR = new Date().getFullYear();

const estimateResumeExperience = (resume) => {
  const text = (resume.extractedText || "").replace(/\s+/g, " ");
  const lower = text.toLowerCase();

  const rangePattern =
    /(?:19|20)\d{2}\s*[-–—]\s*(?:(?:19|20)\d{2}|present|now|current)/gi;
  const ranges = text.match(rangePattern) || [];
  let maxSpan = 0;

  const monthRangePattern =
    /(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\.?\s+\d{4}\s*[-–—]\s*(?:(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\.?\s+\d{4}|present|now|current)/gi;
  const monthRanges = text.match(monthRangePattern) || [];

  const yearFromRange = (range) => {
    const years = range.match(/(?:19|20)\d{2}/g) || [];
    const start = years.length ? parseInt(years[0], 10) : null;
    let end = null;
    if (/present|now|current/i.test(range)) end = CURRENT_YEAR;
    else if (years.length > 1) end = parseInt(years[years.length - 1], 10);
    return { start, end };
  };

  for (const range of ranges) {
    const { start, end } = yearFromRange(range);
    if (
      Number.isFinite(start) &&
      Number.isFinite(end) &&
      end >= start &&
      start >= 1980
    ) {
      maxSpan = Math.max(maxSpan, end - start);
    }
  }

  for (const range of monthRanges) {
    const { start, end } = yearFromRange(range);
    if (
      Number.isFinite(start) &&
      Number.isFinite(end) &&
      end >= start &&
      start >= 1980
    ) {
      maxSpan = Math.max(maxSpan, end - start);
    }
  }

  const hasExperienceSection = /\b(work experience|professional experience|employment|relevant experience|experience)\b/.test(
    lower
  );
  const hasInternship = /\bintern(ship)?\b/.test(lower);
  const hasProjects =
    /\bprojects?\b/.test(lower) || /\brepos?\b/.test(lower);

  let years = 0;
  if (maxSpan >= 1) {
    years = clampNumber(maxSpan * 0.8, 0, 12);
    years = round1(years);
  } else if (hasInternship && hasProjects && hasExperienceSection) {
    years = 0.75;
  } else if (hasInternship || (hasExperienceSection && hasProjects)) {
    years = 0.5;
  } else if (hasProjects) {
    years = 0.25;
  }

  return {
    years,
    hasExperienceSection,
    hasInternship,
    hasProjects,
    observedSpanYears: maxSpan,
  };
};

const scoreExperience = (jdAnalysis, resume, estimate) => {
  const feedback = [];
  const jdExp = (jdAnalysis && jdAnalysis.experience) || {};
  const minYears = jdExp.minimumYears;
  const maxYears = jdExp.maximumYears;

  let requirement = "Not specified";
  if (minYears != null && maxYears != null && maxYears > minYears) {
    requirement = `${minYears}-${maxYears} years`;
  } else if (minYears != null) {
    requirement = `${minYears}+ years`;
  } else if (maxYears != null) {
    requirement = `${maxYears} years or less`;
  }

  let resumeSummary = "No explicit experience period was detected on the resume.";
  if (estimate.years >= 1) {
    resumeSummary = `~${estimate.years} years estimated from the resume (approximate).`;
  } else if (estimate.observedSpanYears >= 1) {
    resumeSummary = `A ${estimate.observedSpanYears}-year span of activity is visible on the resume (approximate).`;
  } else if (estimate.hasInternship) {
    resumeSummary = "Internship experience is mentioned on the resume.";
  } else if (estimate.hasProjects || estimate.hasExperienceSection) {
    resumeSummary =
      "Project/academic experience is present; no professional years were stated.";
  }

  // Not specified -> do not penalize.
  if (minYears == null) {
    feedback.push(
      "The job description does not state a minimum experience requirement, so no penalty was applied."
    );
    feedback.push(resumeSummary);
    return {
      score: 16,
      maxScore: 20,
      status: "not_specified",
      jdRequirement: requirement,
      resumeSummary,
      feedback: uniqueStrings(feedback),
    };
  }

  const needed = minYears;
  const hasRelevantEntrySignal =
    estimate.years > 0 ||
    estimate.hasInternship ||
    estimate.hasProjects ||
    estimate.hasExperienceSection;

  if (estimate.years >= needed) {
    const bonus = clampInt(clampNumber(estimate.years - needed, 0, 4), 4);
    feedback.push(
      `The resume shows about ${estimate.years} years, meeting the ${requirement} requirement.`
    );
    feedback.push(resumeSummary);
    return {
      score: 16 + bonus,
      maxScore: 20,
      status: "strong",
      jdRequirement: requirement,
      resumeSummary,
      feedback: uniqueStrings(feedback),
    };
  }

  if (
    needed <= 1 &&
    (estimate.hasInternship || estimate.hasProjects || estimate.years > 0)
  ) {
    // Freshers: entry-level requirements can be satisfied with internships/projects.
    const base = estimate.years >= 0.75 ? 18 : estimate.years >= 0.5 ? 17 : 15;
    feedback.push(
      `This is an entry-level requirement (${requirement}); relevant internship and project experience is treated as qualifying experience.`
    );
    feedback.push(resumeSummary);
    return {
      score: base,
      maxScore: 20,
      status: "strong",
      jdRequirement: requirement,
      resumeSummary,
      feedback: uniqueStrings(feedback),
    };
  }

  if (estimate.years >= needed * 0.5 || (needed <= 1 && hasRelevantEntrySignal)) {
    feedback.push(
      `The role expects ${requirement}, while the resume currently shows limited professional years. The overlap is partial.`
    );
    feedback.push(resumeSummary);
    return {
      score: 9 + Math.round(Math.min(needed * 0.5, 3)) + (estimate.years >= 1 ? 2 : 0),
      maxScore: 20,
      status: "partial",
      jdRequirement: requirement,
      resumeSummary,
      feedback: uniqueStrings(feedback),
    };
  }

  feedback.push(
    `Experience gap: the role expects about ${requirement}, but the resume does not currently evidence that level of professional experience.`
  );
  feedback.push(resumeSummary);
  return {
    score: 3 + Math.round(clampNumber(estimate.years * 3, 0, 5)),
    maxScore: 20,
    status: "gap",
    jdRequirement: requirement,
    resumeSummary,
    feedback: uniqueStrings(feedback),
  };
};

const DEGREE_TOKENS = {
  bachelor: [
    /\bb\.?\s?tech\b/i,
    /\bb\.?\s?sc(?:\.| )/i,
    /\bb\.?\s?e\b/i,
    /\bbs\b/i,
    /\bb\.?\s?a\b/i,
    /\bbachelor(?:'s)?\b/i,
    /\bengineering\b/i,
    /\bbe\b/i,
  ],
  master: [
    /\bm\.?\s?tech\b/i,
    /\bm\.?\s?sc(?:\.| )/i,
    /\bms\b/i,
    /\bm\.?\s?a\b/i,
    /\bmba\b/i,
    /\bmaster(?:'s)?\b/i,
    /pgdm/i,
  ],
  phd: [/\bph\.?\s?d\b/i],
  diploma: [/\bdiploma\b/i, /\bpgd\b/i],
};

const detectResumeDegreeLevel = (resume) => {
  const text = resume.extractedText || "";
  const edu = resume.analysis && resume.analysis.education
    ? `${asString(resume.analysis.education.summary)} ${asStringArray(
        resume.analysis.education.observations
      ).join(" ")}`
    : "";

  const haystack = `${text} ${edu}`;

  if (DEGREE_TOKENS.phd.some((r) => r.test(haystack))) return "phd";
  if (DEGREE_TOKENS.master.some((r) => r.test(haystack))) return "master";
  if (DEGREE_TOKENS.bachelor.some((r) => r.test(haystack))) return "bachelor";
  if (DEGREE_TOKENS.diploma.some((r) => r.test(haystack))) return "diploma";
  return "none";
};

const LEVEL_RANK = { none: 0, diploma: 1, bachelor: 2, master: 3, phd: 4 };

const jdEducationRequirements = (jdAnalysis) => {
  const items = asStringArray(jdAnalysis.education);
  if (items.length) return items;
  // fall back: look for degree mentions inside the description only if clearly stated
  return [];
};

const levelFromRequirement = (req) => {
  if (/ph\.?\s?d|doctorate/i.test(req)) return "phd";
  if (/master|m\.?\s?tech|m\.?\s?sc|mba|post[\s-]?graduate/i.test(req))
    return "master";
  if (/bachelor|b\.?\s?tech|b\.?\s?sc|b\.?\s?e|b\.?\s?a|\bbs\b|engineering|undergraduate/i.test(req))
    return "bachelor";
  if (/diploma/i.test(req)) return "diploma";
  return null;
};

const educationSpecMatches = (req, resume) => {
  const text = `${resume.extractedText || ""} ${
    (resume.analysis && resume.analysis.education && resume.analysis.education.summary) || ""
  }`;

  if (/any (degree|graduate|graduate degree)|graduate (degree )?|not (specified|required)|open.?degree/i.test(req)) {
    if (detectResumeDegreeLevel(resume) !== "none") {
      return { matched: true, reason: "An open/generic degree requirement is satisfied by the resume degree." };
    }
    return { matched: false, reason: "The resume does not clearly show a degree." };
  }

  const requiredLevel = levelFromRequirement(req);
  const resumeLevel = detectResumeDegreeLevel(resume);

  if (!requiredLevel) {
    // Requirement mentions education but at an unknown level -> compare keywords in text while staying conservative.
    const words = req.split(/\s+/).filter((w) => w.length > 3);
    const found = words.filter((w) => new RegExp(`\\b${escapeRegex(w)}\\b`, "i").test(text));
    if (found.length >= 2) {
      return { matched: true, reason: "The education field appears on the resume." };
    }
    return { matched: false, reason: "The specific education requirement could not be confirmed on the resume." };
  }

  if (LEVEL_RANK[resumeLevel] >= LEVEL_RANK[requiredLevel]) {
    return { matched: true, reason: `The ${resumeLevel} degree on the resume meets the ${requiredLevel} requirement.` };
  }

  if (LEVEL_RANK[resumeLevel] > 0) {
    return {
      matched: false,
      partial: true,
      reason: `The resume shows a ${resumeLevel} level but the requirement asks for ${requiredLevel}.`,
    };
  }

  return { matched: false, reason: "No matching degree level was found on the resume." };
};

const escapeRegex = (value) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const scoreEducation = (jdAnalysis, resume) => {
  const feedback = [];
  const requirements =
    jdEducationRequirements(jdAnalysis);

  if (!requirements.length) {
    return {
      score: 10,
      maxScore: 10,
      status: "not_specified",
      jdRequirement: "Not specified",
      resumeSummary: detectResumeDegreeLevel(resume),
      feedback: [
        "The job description does not specify an education requirement, so no penalty was applied.",
      ],
    };
  }

  const requirementText = requirements.join("; ");
  const results = requirements.map((req) => ({
    requirement: req,
    ...educationSpecMatches(req, resume),
  }));

  const anyMatched = results.some((r) => r.matched);
  const anyPartial = results.some((r) => r.partial);

  let score;
  let status;
  if (anyMatched) {
    score = 9;
    status = "match";
    feedback.push(
      "The resume education meets the stated degree requirement."
    );
  } else if (anyPartial) {
    score = 6;
    status = "partial";
    feedback.push(
      "The resume education partially matches the stated requirement."
    );
  } else {
    score = 3;
    status = "no_match";
    feedback.push(
      "The resume does not clearly evidence the education level requested."
    );
  }

  results.forEach((r) => {
    if (!r.matched && r.reason) feedback.push(r.reason);
  });

  return {
    score,
    maxScore: 10,
    status,
    jdRequirement: requirementText,
    resumeSummary: detectResumeDegreeLevel(resume),
    feedback: uniqueStrings(feedback),
  };
};

const buildRecommendations = (state) => {
  const recommendations = [];

  const coveredByRequired = new Set(
    (state.missingRequiredSkills || []).map((s) => normalizeSkill(s))
  );

  state.missingRequiredSkills.forEach((skill) => {
    recommendations.push(
      `Consider learning or gaining hands-on experience with ${skill} — it is listed as a required skill for this role.`
    );
  });

  let techCounter = 0;
  state.missingTechnologies.forEach((tech) => {
    const canonical = normalizeSkill(tech);
    if ((canonical && coveredByRequired.has(canonical)) || coveredByRequired.has(tech.toLowerCase())) {
      return;
    }
    if (techCounter >= 4) return;
    techCounter += 1;
    recommendations.push(
      `Gain practical exposure to ${tech} to strengthen your fit for this role.`
    );
  });

  state.missingKeywords.slice(0, 3).forEach((keyword) => {
    recommendations.push(
      `Mention ${keyword} in your resume only if you genuinely have related experience.`
    );
  });

  if (state.experienceStatus === "gap") {
    recommendations.push(
      `This role expects about ${state.experienceRequirement}. Strengthen your best internships and projects with measurable results, and consider gaining additional relevant experience.`
    );
  } else if (state.experienceStatus === "partial") {
    recommendations.push(
      `Add measurable results to your relevant internship and project bullets to better evidence your experience level.`
    );
  }

  if (state.educationStatus === "partial") {
    recommendations.push(
      "Your education is close to the requirement; highlight relevant coursework, specialization or certifications."
    );
  }

  if (state.educationStatus === "no_match") {
    recommendations.push(
      "Emphasize any related coursework, projects or certifications that demonstrate the required academic background."
    );
  }

  if (state.semanticRecommendations) {
    recommendations.push(...state.semanticRecommendations);
  }

  return uniqueStrings(recommendations).slice(0, 10);
};

const buildOverallFeedback = (state) => {
  const feedback = [];

  feedback.push(
    `Skills: ${state.skillsResult.requiredMatched.length}/${state.skillsResult.required.length} required and ${state.skillsResult.preferredMatched.length}/${state.skillsResult.preferred.length} preferred skills matched.`
  );
  feedback.push(
    `Keywords: ${state.keywordResult.matched.length}/${state.keywordResult.total} JD keywords matched.`
  );
  feedback.push(
    `Technologies: ${state.technologyResult.matched.length}/${state.technologyResult.total} JD technologies matched.`
  );
  feedback.push(`Experience: ${state.experienceMatch.status.replace("_", " ")}.`);
  feedback.push(`Education: ${state.educationMatch.status.replace("_", " ")}.`);

  if (state.semanticFeedback) {
    feedback.push(...state.semanticFeedback);
  }

  return uniqueStrings(feedback);
};

const calculateMatch = async (resume, jd) => {
  const analysis = jd.analysis || {};
  const resumeText = asString(resume.extractedText);
  const resumeSkillSet = buildResumeSkillSet(resume);
  const resumeKeywords = buildResumeKeywords(resume);

  // ---- Skills (weight 30) ----
  const requiredSkills = asStringArray(analysis.requiredSkills);
  const preferredSkills = asStringArray(analysis.preferredSkills);

  const requiredResult = matchSkills(requiredSkills, resumeSkillSet, resumeText);
  const preferredResult = matchSkills(preferredSkills, resumeSkillSet, resumeText);

  const skillsResult = {
    required: requiredSkills,
    preferred: preferredSkills,
    requiredMatched: requiredResult.matched,
    requiredMissing: requiredResult.missing,
    preferredMatched: preferredResult.matched,
    preferredMissing: preferredResult.missing,
  };
  const skillsMatch = scoreSkills(skillsResult);

  // ---- Keywords (weight 20) ----
  const jdKeywords = buildJdKeywordList(analysis);
  const keywordMatched = [];
  const keywordMissing = [];
  for (const keyword of jdKeywords) {
    const isPresent =
      presentInText(keyword, resumeText) ||
      resumeKeywords.some((rk) => normalizeSkill(rk) === normalizeSkill(keyword));
    (isPresent ? keywordMatched : keywordMissing).push(String(keyword).trim());
  }
  const keywordResult = {
    matched: uniqueStrings(keywordMatched),
    missing: uniqueStrings(keywordMissing),
    total: uniqueStrings(jdKeywords).length,
  };
  const keywordMatch = scoreKeywords(keywordResult);

  // ---- Technologies (weight 20) ----
  const jdTechs = buildJdTechList(analysis);
  const techMatched = [];
  const techMissing = [];
  for (const tech of jdTechs) {
    const canonical = normalizeSkill(tech);
    const isPresent =
      (canonical && resumeSkillSet.has(canonical)) ||
      presentInText(tech, resumeText);
    (isPresent ? techMatched : techMissing).push(String(tech).trim());
  }
  const technologyResult = {
    matched: uniqueStrings(techMatched),
    missing: uniqueStrings(techMissing),
    total: uniqueStrings(jdTechs).length,
  };
  const technologyMatch = scoreTechnologies(technologyResult);

  // ---- Experience (weight 20) ----
  const experienceEstimate = estimateResumeExperience(resume);
  const experienceMatch = scoreExperience(analysis, resume, experienceEstimate);

  // ---- Education (weight 10) ----
  const educationMatch = scoreEducation(analysis, resume);

  // ---- Semantic overlay via Gemini (single call) ----
  let semantic = null;
  try {
    const matchedInfo = await matchResumeWithJobDescription(
      {
        fileName: resume.fileName,
        summary: asString(resume.analysis && resume.analysis.summary),
        technicalSkills: asStringArray(
          resume.analysis && resume.analysis.skills && resume.analysis.skills.technical
        ),
        softSkills: asStringArray(
          resume.analysis && resume.analysis.skills && resume.analysis.skills.soft
        ),
        experienceSummary: asString(
          resume.analysis && resume.analysis.experience && resume.analysis.experience.summary
        ),
        educationSummary: asString(
          resume.analysis && resume.analysis.education && resume.analysis.education.summary
        ),
        projectSummary: asString(
          resume.analysis && resume.analysis.projects && resume.analysis.projects.summary
        ),
        certifications: asStringArray(resume.analysis && resume.analysis.certifications),
        text: resumeText,
      },
      {
        jobTitle: asString(analysis.jobTitle),
        company: asString(analysis.company),
        summary: asString(analysis.summary),
        experience: analysis.experience || {},
        education: asStringArray(analysis.education),
        requiredSkills: asStringArray(analysis.requiredSkills),
        preferredSkills: asStringArray(analysis.preferredSkills),
        responsibilities: asStringArray(analysis.responsibilities),
        certifications: asStringArray(analysis.certifications),
        keywords: asStringArray(analysis.keywords),
        technologies: buildJdTechList(analysis),
        jobType: asString(analysis.jobType),
        location: asString(analysis.location),
      }
    );
    semantic = matchedInfo.result;
  } catch (error) {
    console.error("Gemini semantic match skipped/errored:", error.message);
    semantic = null;
  }

  // ---- Combine ----
  const deterministicScore =
    skillsMatch.score +
    keywordMatch.score +
    technologyMatch.score +
    experienceMatch.score +
    educationMatch.score;

  let finalScore = round1(deterministicScore);
  if (
    semantic &&
    Number.isFinite(semantic.semanticScore)
  ) {
    finalScore = round1(
      deterministicScore * 0.8 + semantic.semanticScore * 0.2
    );
  }
  finalScore = clampInt(finalScore, 100);

  // Merge semantic additions (matched skills that the deterministic pass may miss).
  const semanticMatchedSkills =
    semantic && Array.isArray(semantic.additionalMatchedSkills)
      ? semantic.additionalMatchedSkills.filter(
          (s) =>
            !skillsResult.requiredMatched.some(
              (m) => m.toLowerCase() === String(s).toLowerCase()
            ) &&
            !skillsResult.preferredMatched.some(
              (m) => m.toLowerCase() === String(s).toLowerCase()
            ) &&
            presentInText(s, resumeText)
        )
      : [];

  const state = {
    skillsResult,
    keywordResult,
    technologyResult,
    experienceMatch,
    educationMatch,
    missingRequiredSkills: skillsResult.requiredMissing,
    missingTechnologies: technologyResult.missing,
    missingKeywords: keywordResult.missing,
    experienceStatus: experienceMatch.status,
    experienceRequirement: experienceMatch.jdRequirement,
    educationStatus: educationMatch.status,
    semanticRecommendations:
      semantic && Array.isArray(semantic.recommendations)
        ? semantic.recommendations
        : null,
    semanticFeedback:
      semantic && Array.isArray(semantic.overallFeedback)
        ? semantic.overallFeedback
        : null,
  };

  const recommendations = buildRecommendations(state);
  const overallFeedback = buildOverallFeedback(state);

  const matchedSkills = uniqueStrings([
    ...skillsResult.requiredMatched,
    ...skillsResult.preferredMatched,
  ]);
  const missingSkills = uniqueStrings([
    ...skillsResult.requiredMissing,
    ...skillsResult.preferredMissing,
  ]);
  const missingTechnologies = technologyResult.missing;

  return {
    matchPercentage: finalScore,
    resumeFileName: asString(resume.fileName),
    jobTitle: asString(analysis.jobTitle) || asString(jd.title),
    company: asString(analysis.company) || asString(jd.company),

    matchedSkills,
    missingSkills,
    requiredSkillsMatched: skillsResult.requiredMatched,
    requiredSkillsMissing: skillsResult.requiredMissing,
    preferredSkillsMatched: skillsResult.preferredMatched,
    preferredSkillsMissing: skillsResult.preferredMissing,

    matchedKeywords: keywordResult.matched,
    missingKeywords: keywordResult.missing,

    matchedTechnologies: technologyResult.matched,
    missingTechnologies,
    semanticMatchedSkills,

    skillsMatch,
    keywordMatch,
    technologyMatch,
    experienceMatch,
    educationMatch,

    overallFeedback,
    recommendations,
  };
};

module.exports = { calculateMatch };