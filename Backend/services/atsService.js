const clampNumber = (value, min, max) => Math.min(Math.max(value, min), max);

const clampInt = (value, max) =>
  Number.isFinite(value) ? Math.round(clampNumber(value, 0, max)) : 0;

const uniqueStrings = (items) => {
  const seen = new Set();
  const result = [];
  for (const item of items) {
    const key = String(item || "").trim().toLowerCase();
    if (!key) continue;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(String(item).trim());
  }
  return result;
};

const countMatches = (text, regexes) => {
  let count = 0;
  for (const regex of regexes) count += (text.match(regex) || []).length;
  return count;
};

const SECTION_LABELS = {
  summary: "Summary / Objective",
  skills: "Skills",
  experience: "Experience",
  education: "Education",
  projects: "Projects",
  certifications: "Certifications",
};

const HEADER_PATTERNS = {
  summary: [
    /\b(professional summary|career objective|career summary|objective|profile|about me)\b/i,
  ],
  skills: [
    /\b(technical skills|core competencies|core skills|skills|technologies|tech stack)\b/i,
  ],
  experience: [
    /\b(work experience|professional experience|employment history|relevant experience|experience)\b/i,
  ],
  education: [
    /\b(education|academic background|academic qualifications|qualification)\b/i,
  ],
  projects: [
    /\b(projects|personal projects|academic projects|project work|key projects|software projects)\b/i,
  ],
  certifications: [
    /\b(certifications|certificates|certification|licenses|licensure|certified)\b/i,
  ],
};

const INLINE_PATTERNS = {
  summary: [/\b(professional summary|career objective)\s*:/i, /\b(objective)\s*:/i],
  skills: [
    /\b(technical skills|core skills|skills|technologies|certifications)\s*:/i,
    /^skills\b/im,
  ],
  experience: [/\b(work experience|experience)\s*:/i],
  education: [/\b(education|qualification)\s*:/i],
  projects: [/\b(projects?\s*:|personal projects)\s*:/i],
  certifications: [/\b(certifications?|licenses)\s*:/i],
};

const detectSection = (text, key) => {
  const lines = text.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.length > 60) continue;
    for (const pattern of HEADER_PATTERNS[key]) {
      if (pattern.test(trimmed)) return true;
    }
  }
  for (const pattern of INLINE_PATTERNS[key]) {
    if (pattern.test(text)) return true;
  }
  return false;
};

const SKILLS = {
  languages: [
    "javascript", "typescript", "python", "java", "c++", "c#", "go", "golang",
    "rust", "php", "ruby", "swift", "kotlin", "scala", "dart", "html", "css",
    "sql", "bash", "shell",
  ],
  frontend: [
    "react", "reactjs", "next.js", "nextjs", "vue", "vue.js", "angular", "svelte",
    "tailwind", "tailwind css", "bootstrap", "jquery", "redux", "html5", "css3",
    "graphql", "mobx",
  ],
  backend: [
    "node.js", "nodejs", "express", "express.js", "nestjs", "django", "flask",
    "fastapi", "spring boot", "springboot", "spring", "laravel", "ruby on rails",
    "rails", "asp.net", "rest api", "restful api", "graphql", "microservices",
  ],
  database: [
    "mongodb", "mongoose", "mysql", "postgresql", "postgres", "sqlite", "redis",
    "oracle", "dynamodb", "firebase", "supabase", "prisma", "sql server",
  ],
  cloudDevOps: [
    "aws", "azure", "google cloud", "gcp", "docker", "kubernetes", "k8s",
    "terraform", "jenkins", "github actions", "ci/cd", "nginx", "vercel",
    "netlify", "linux", "heroku",
  ],
  tools: [
    "git", "github", "gitlab", "bitbucket", "jira", "postman", "figma",
    "vite", "webpack", "babel", "eslint", "jest", "cypress", "pytest",
    "selenium", "pandas", "numpy", "tensorflow", "pytorch", "machine learning",
    "data structures", "algorithms", "npm", "yarn", "agile",
  ],
  soft: [
    "communication", "teamwork", "leadership", "problem solving", "time management",
    "adaptability", "collaboration", "team player", "management", "negotiation",
    "presentation", "critical thinking",
  ],
};

const SKILL_REGEX = {
  javascript: /\bjavascript\b/i,
  typescript: /\btypescript\b/i,
  python: /\bpython\b/i,
  java: /\bjava\b/i,
  "c++": /\bc\+\+/i,
  "c#": /\bc#\b/i,
  go: /\bgo\b|\bgolang\b/i,
  rust: /\brust\b/i,
  php: /\bphp\b/i,
  ruby: /\bruby\b/i,
  swift: /\bswift\b/i,
  kotlin: /\bkotlin\b/i,
  scala: /\bscala\b/i,
  dart: /\bdart\b/i,
  html: /\bhtml\b/i,
  css: /\bcss\b/i,
  sql: /\bsql\b/i,
  bash: /\bbash\b/i,
  react: /\breact(?:\s*\.?js)?\b/i,
  next: /\bnext(?:\.?js)?\b/i,
  vue: /\bvue(?:\s*\.?js)?\b/i,
  angular: /\bangular\b/i,
  svelte: /\bsvelte\b/i,
  tailwind: /\btailwind(?:\s*css)?\b/i,
  bootstrap: /\bbootstrap\b/i,
  jquery: /\bjquery\b/i,
  redux: /\bredux\b/i,
  graphql: /\bgraphql\b/i,
  node: /\bnode(?:\.js)?\b/i,
  express: /\bexpress(?:\.js)?\b/i,
  nest: /\bnest(?:\.?js)?\b/i,
  django: /\bdjango\b/i,
  flask: /\bflask\b/i,
  fastapi: /\bfastapi\b/i,
  spring: /\bspring(?:\s*boot)?\b/i,
  laravel: /\blaravel\b/i,
  rails: /\brails\b|\bruby on rails\b/i,
  aspnet: /\basp\.net\b/i,
  mongodb: /\bmongodb\b/i,
  mongoose: /\bmongoose\b/i,
  mysql: /\bmysql\b/i,
  postgres: /\bpostgres(?:ql)?\b/i,
  sqlite: /\bsqlite\b/i,
  redis: /\bredis\b/i,
  oracle: /\boracle\b/i,
  dynamodb: /\bdynamodb\b/i,
  firebase: /\bfirebase\b/i,
  supabase: /\bsupabase\b/i,
  prisma: /\bprisma\b/i,
  aws: /\baws\b/i,
  azure: /\bazure\b/i,
  gcp: /\bgcp\b|\bgoogle cloud\b/i,
  docker: /\bdocker\b/i,
  kubernetes: /\bkubernetes\b|\bk8s\b/i,
  terraform: /\bterraform\b/i,
  jenkins: /\bjenkins\b/i,
  githubactions: /\bgithub actions\b/i,
  ci: /\bci\/cd\b/i,
  nginx: /\bnginx\b/i,
  vercel: /\bvercel\b/i,
  netlify: /\bnetlify\b/i,
  linux: /\blinux\b/i,
  git: /\bgit\b/i,
  github: /\bgithub\b/i,
  gitlab: /\bgitlab\b/i,
  jira: /\bjira\b/i,
  postman: /\bpostman\b/i,
  figma: /\bfigma\b/i,
  vite: /\bvite\b/i,
  webpack: /\bwebpack\b/i,
  eslint: /\beslint\b/i,
  jest: /\bjest\b/i,
  cypress: /\bcypress\b/i,
  pytest: /\bpytest\b/i,
  selenium: /\bselenium\b/i,
  pandas: /\bpandas\b/i,
  numpy: /\bnumpy\b/i,
  tensorflow: /\btensorflow\b/i,
  pytorch: /\bpytorch\b/i,
  ml: /\bmachine learning\b/i,
  npm: /\bnpm\b/i,
  yarn: /\byarn\b/i,
  agile: /\bagile\b/i,
};

const SKILL_DISPLAY = {
  javascript: "JavaScript", typescript: "TypeScript", python: "Python",
  java: "Java", "c++": "C++", "c#": "C#", go: "Go", rust: "Rust",
  php: "PHP", ruby: "Ruby", swift: "Swift", kotlin: "Kotlin", scala: "Scala",
  dart: "Dart", html: "HTML", css: "CSS", sql: "SQL", bash: "Bash",
  react: "React", next: "Next.js", vue: "Vue.js", angular: "Angular",
  svelte: "Svelte", tailwind: "Tailwind CSS", bootstrap: "Bootstrap",
  jquery: "jQuery", redux: "Redux", graphql: "GraphQL", node: "Node.js",
  express: "Express", nest: "NestJS", django: "Django", flask: "Flask",
  fastapi: "FastAPI", spring: "Spring Boot", laravel: "Laravel", rails: "Rails",
  aspnet: "ASP.NET", mongodb: "MongoDB", mongoose: "Mongoose", mysql: "MySQL",
  postgres: "PostgreSQL", sqlite: "SQLite", redis: "Redis", oracle: "Oracle",
  dynamodb: "DynamoDB", firebase: "Firebase", supabase: "Supabase",
  prisma: "Prisma", aws: "AWS", azure: "Azure", gcp: "Google Cloud",
  docker: "Docker", kubernetes: "Kubernetes", terraform: "Terraform",
  jenkins: "Jenkins", githubactions: "GitHub Actions", ci: "CI/CD",
  nginx: "Nginx", vercel: "Vercel", netlify: "Netlify", linux: "Linux",
  git: "Git", github: "GitHub", gitlab: "GitLab", jira: "Jira",
  postman: "Postman", figma: "Figma", vite: "Vite", webpack: "Webpack",
  eslint: "ESLint", jest: "Jest", cypress: "Cypress", pytest: "pytest",
  selenium: "Selenium", pandas: "Pandas", numpy: "NumPy", tensorflow: "TensorFlow",
  pytorch: "PyTorch", ml: "Machine Learning", npm: "npm", yarn: "Yarn",
  agile: "Agile",
};

const SKILL_BASE = {
  react: "react", nextjs: "next", nodejs: "node", "next.js": "next",
  "node.js": "node", "express.js": "express", "vue.js": "vue",
  "ruby on rails": "rails", "spring boot": "spring", "tailwind css": "tailwind",
  "google cloud": "gcp", "machine learning": "ml",
};

const SKILL_SUGGESTIONS = {
  react: ["TypeScript", "Next.js", "Tailwind CSS", "Redux"],
  javascript: ["TypeScript", "Node.js"],
  typescript: ["React", "Next.js"],
  node: ["Express", "MongoDB"],
  express: ["Node.js", "PostgreSQL"],
  django: ["Python", "REST API"],
  python: ["Django", "FastAPI", "Pandas"],
  java: ["Spring Boot"],
  spring: ["MySQL", "Docker"],
  next: ["TypeScript", "Tailwind CSS"],
  vue: ["TypeScript", "Vuex"],
  angular: ["TypeScript", "RxJS"],
  mongodb: ["PostgreSQL", "Redis"],
  mysql: ["PostgreSQL"],
  postgres: ["Redis"],
  aws: ["Docker", "Terraform", "Kubernetes"],
  docker: ["Kubernetes", "CI/CD"],
  kubernetes: ["Terraform", "Docker"],
  git: ["GitHub Actions", "CI/CD"],
  github: ["CI/CD", "GitHub Actions"],
  graphql: ["Node.js", "Apollo"],
  sql: ["PostgreSQL"],
  html: ["CSS", "JavaScript"],
  css: ["Tailwind CSS", "Sass"],
  ml: ["TensorFlow", "PyTorch"],
};

const ACTION_VERBS = [
  /\bdeveloped\b/i, /\bimplemented\b/i, /\bdesigned\b/i, /\boptimized\b/i,
  /\bintegrated\b/i, /\bbuilt\b/i, /\bautomated\b/i, /\bimproved\b/i,
  /\bled\b/i, /\bcreated\b/i, /\bmanaged\b/i, /\btested\b/i, /\bdeployed\b/i,
  /\bincreased\b/i, /\breduced\b/i, /\bdelivered\b/i, /\blaunched\b/i,
  /\bmaintained\b/i, /\bcoordinated\b/i, /\bdeveloped\b/i,
];

const METRIC_PATTERNS = [
  /\d+\s*%/, /\$\s*\d[\d,]*/, /\+\d+%/, /\d+x\s*/, /\b\d[\d,]*(?:\.\d+)?\s*(?:users|downloads|requests|queries|sales|revenue|clicks|ms|x faster)\b/i,
];

const DATE_PATTERNS = [
  /\b(?:19[5-9]\d|20[0-2]\d)\s*[–-]\s*(?:19[5-9]\d|20[0-2]\d|present|now|current)\b/i,
  /\b(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\.?\s+\d{4}\b/i,
  /\b(?:19[5-9]\d|20[0-2]\d)\s*[–/]\s*(?:19[5-9]\d|20[0-2]\d)\b/i,
];

const DEGREE_PATTERNS = [
  /\bb\.?\s?tech\b/i, /\bb\.?\s?sc\b/i, /\bb\.?\s?e\b/i, /\bbs\b/i,
  /\bb\.?\s?a\b/i, /\bm\.?\s?tech\b/i, /\bm\.?\s?sc\b/i, /\bms\b/i,
  /\bm\.?\s?a\b/i, /\bmba\b/i, /\bph\.?\s?d\b/i, /\bbachelor\b/i,
  /\bmaster\b/i, /\bdiploma\b/i, /\bengineering\b/i, /\bb\.?\s?a\b/i,
];

const INSTITUTION_PATTERNS = [
  /\buniversity\b/i, /\binstitute\b/i, /\bcollege\b/i, /\bschool\b/i,
  /\bacademy\b/i,
];

const GENERIC_PHRASES = [
  /\bhighly motivated\b/i, /\bself[- ]motivated\b/i, /\bteam player\b/i,
  /\bhard[- ]?working\b/i, /\bfast learner\b/i, /\blower\b/i,
  /\blooking for (?:an? )?(?:opportunity|role|position)\b/i,
  /\bgood communication skills\b/i, /\bseeking a (?:challenging )?role\b/i,
  /\bdedicated and (?:enthusiastic|hard[- ]?working) professional\b/i,
  /\blove to learn\b/i, /\bpassionate about learning\b/i,
];

const BULLET_LINE = /^\s*[-•*▪◦›]\s+/;

const scoreStructure = (text, sections, specialCharRatio, repeatedLines, tooShort, tooLong) => {
  const feedback = [];
  let raw = 0;

  const present = Object.keys(sections).filter((key) => sections[key]);
  raw += Math.min(12, present.length * 2);

  if (
    /\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/i.test(text) ||
    /(?:\+?\d[0-9 .\-()]{6,}\d)/.test(text)
  ) {
    raw += 3;
  }

  if (!tooShort && !tooLong) {
    raw += 2;
  } else if (tooShort) {
    feedback.push(`Resume content appears very short, which may indicate missing information.`);
  } else {
    feedback.push(`Resume content is very long; consider tightening it.`);
  }

  if (specialCharRatio < 0.08) {
    raw += 2;
  } else if (specialCharRatio < 0.15) {
    raw += 1;
    feedback.push(`Moderate amount of special characters detected in extracted text.`);
  } else {
    feedback.push(`High density of special characters may confuse ATS parsers; clean the formatting.`);
  }

  if (repeatedLines.length === 0) {
    raw += 1;
  } else {
    feedback.push(`Repeated text detected, which reads as duplicated content.`);
  }

  if (present.length < 3) {
    feedback.push(
      `Text-based approximation: visual layout cannot be perfectly evaluated from extracted text, but only a few recognizable sections were found.`
    );
  }

  return { score: clampInt(raw, 20), maxScore: 20, feedback };
};

const detectSkills = (text) => {
  const found = [];
  const totalMentions = [];
  for (const key of Object.keys(SKILL_REGEX)) {
    const matches = text.match(SKILL_REGEX[key]);
    if (matches && matches.length) {
      found.push(key);
      totalMentions.push(matches.length);
    }
  }
  return { found, totalMentions, totalCount: totalMentions.reduce((a, b) => a + b, 0) };
};

const scoreSkills = (
  sections,
  skillKeys,
  skillCategories,
  totalCount,
  actionVerbCount,
  analysis
) => {
  const feedback = [];

  if (!sections.skills) {
    feedback.push(`No clear Skills section detected; organize skills into clear categories.`);
  }

  let raw = sections.skills ? 4 : 0;
  const n = skillKeys.length;

  if (n >= 12) raw += 10;
  else if (n >= 9) raw += 8;
  else if (n >= 6) raw += 6;
  else if (n >= 4) raw += 5;
  else if (n >= 2) raw += 3;
  else if (n >= 1) raw += 2;

  raw += Math.min(5, skillCategories.length);

  const stuffed = totalCount > skillKeys.length * 2 && totalCount > 6;
  if (stuffed) {
    feedback.push(
      `Some keywords appear repeated many times; list them once under Skills and demonstrate them through results instead.`
    );
    raw = clampNumber(raw - 2, 0, 25);
  }

  if (sectionSkillsFromAnalysis(analysis) >= 5 && actionVerbCount >= 3) {
    raw += 2;
  }

  if (n === 0) {
    feedback.push(`No well-known technical keywords detected in the resume.`);
  } else if (n >= 5) {
    feedback.push(`Good diversity of technical keywords detected across the resume.`);
  }

  return { score: clampInt(raw, 25), maxScore: 25, feedback };
};

const sectionSkillsFromAnalysis = (analysis) =>
  Array.isArray(analysis && analysis.skills && analysis.skills.technical)
    ? analysis.skills.technical.length
    : 0;

const scoreExperience = (sections, text, actionVerbCount, metricCount, bulletCount, hasDates) => {
  const feedback = [];
  let raw = 0;

  if (sections.experience) {
    raw += 6;
  } else {
    feedback.push(`No work experience section detected; internships or supervised projects can help.`);
  }

  const titleMatches = countMatches(text, [
    /\b(?:software\s+)?(?:engineer|developer|intern|analyst|manager|designer|lead|sde|consultant|specialist|architect)\b/i,
  ]);
  if (titleMatches >= 1) raw += 3;

  if (hasDates) {
    raw += 3;
  } else {
    feedback.push(`No clear dates or durations found for the experience entries.`);
  }

  if (actionVerbCount >= 3) raw += 4;
  else if (actionVerbCount >= 2) raw += 3;
  else if (actionVerbCount >= 1) raw += 2;
  else feedback.push(`Use action-oriented verbs to describe responsibilities (e.g., developed, implemented, improved).`);

  if (metricCount >= 1) {
    raw += 2;
  } else {
    feedback.push(`Add measurable achievements where possible (percentages, counts, time saved).`);
  }

  if (bulletCount >= 3) raw += 2;

  return { score: clampInt(raw, 20), maxScore: 20, feedback };
};

const scoreProjects = (sections, text, metricCount, skillCount, bulletCount, hasLinks) => {
  const feedback = [];
  let raw = 0;

  if (sections.projects) {
    raw += 5;
  } else {
    feedback.push(`Add a Projects section showing technologies used and your specific contribution.`);
  }

  if (hasLinks) raw += 3;
  if (metricCount >= 1) raw += 1;

  if (sections.projects) {
    if (skillCount >= 5 && bulletCount >= 2) raw += 4;
    else if (skillCount >= 2) raw += 3;
    else if (bulletCount >= 1) raw += 2;
  } else if (skillCount >= 2 && bulletCount >= 1) {
    raw += 1;
  }

  if (sections.projects && bulletCount < 2) {
    feedback.push(`Strengthen each project with a description, role and technologies used.`);
  }

  return { score: clampInt(raw, 15), maxScore: 15, feedback };
};

const scoreEducation = (sections, text, certMentioned, analysis) => {
  const feedback = [];
  let raw = 0;

  if (sections.education) {
    raw += 4;
  } else {
    feedback.push(`No education section detected; add your degree and institution.`);
  }

  if (countMatches(text, DEGREE_PATTERNS)) raw += 2;
  if (countMatches(text, INSTITUTION_PATTERNS)) raw += 2;
  if (DATE_PATTERNS.some((pattern) => /\b(19[5-9]\d|20[0-2]\d)\b/.test(text))) raw += 1;

  const certs =
    sections.certifications ||
    certMentioned ||
    (analysis && Array.isArray(analysis.certifications) && analysis.certifications.length > 0);
  if (certs) {
    raw += 1;
  } else {
    feedback.push(`Consider adding any relevant certifications you hold.`);
  }

  return { score: clampInt(raw, 10), maxScore: 10, feedback };
};

const scoreContent = (
  sections,
  text,
  genericPhrases,
  repeatedLines,
  tooLong,
  hasContact,
  tooShort
) => {
  const feedback = [];
  let raw = 0;

  if (sections.summary) {
    raw += 3;
  } else {
    feedback.push(`Add a concise professional summary near the top of your resume.`);
  }

  if (hasContact) {
    raw += 2;
  } else {
    feedback.push(`Add contact information (email, phone, LinkedIn or portfolio link).`);
  }

  if (tooShort) raw -= 1;
  if (tooLong) raw -= 1;

  if (genericPhrases.length) {
    raw -= 2;
    feedback.push(`Replace generic phrases (${genericPhrases.slice(0, 3).join(", ")}) with specific accomplishments.`);
  }

  if (repeatedLines.length) {
    raw -= 2;
    feedback.push(`Repeated information reduces clarity; remove duplicates.`);
  }

  raw += 2;
  if (raw < 10) {
    feedback.push(`Add specific details and quantify outcomes where possible.`);
  }

  return { score: clampInt(raw, 10), maxScore: 10, feedback };
};

const computeSpecialCharRatio = (text) => {
  const total = text.length;
  if (!total) return 1;
  const bad = (text.match(/[^a-z0-9\s.,;:()\/\-+%'$&*#!?@"]/gi) || []).length;
  return bad / total;
};

const buildKnowledge = (text) => {
  const lines = (text.match(/^.*$/gm) || []).map((l) => l.trim()).filter(Boolean);
  const repeated = {};
  for (const line of lines) {
    if (line.length < 20) continue;
    const key = line.toLowerCase();
    repeated[key] = (repeated[key] || 0) + 1;
  }
  return Object.keys(repeated).filter((key) => repeated[key] >= 3);
};

const detectGenericPhrases = (text) => {
  const found = [];
  for (const pattern of GENERIC_PHRASES) {
    const match = text.match(pattern);
    if (match) found.push(match[0].trim());
  }
  return uniqueStrings(found);
};

const analysisKeywords = (analysis) => {
  const items = [];
  const techs = analysis && analysis.skills && analysis.skills.technical;
  if (Array.isArray(techs)) items.push(...techs);
  const roles = analysis && analysis.recommendedRoles;
  if (Array.isArray(roles)) items.push(...roles);
  return uniqueStrings(items).filter((item) => item.length <= 32);
};

const buildSuggestedKeywords = (detectedKeys, analysis) => {
  const suggested = [];
  const baseKeys = detectedKeys.map((key) => {
    const lower = key.toLowerCase().replace(/\s+/g, "").replace(/-/g, "");
    if (SKILL_BASE[lower]) return SKILL_BASE[lower];
    if (SKILL_BASE[key.toLowerCase()]) return SKILL_BASE[key.toLowerCase()];
    return key;
  });

  for (const key of baseKeys) {
    const bucket = SKILL_SUGGESTIONS[key];
    if (Array.isArray(bucket)) suggested.push(...bucket);
  }

  suggested.push(...analysisKeywords(analysis));

  return uniqueStrings(suggested).filter(
    (item) =>
      !detectedKeys.some((d) => d.toLowerCase() === item.toLowerCase())
  );
};

const buildRecommendations = (state) => {
  const recommendations = [];

  if (!state.sections.summary) {
    recommendations.push(`Add a concise professional summary.`);
  }
  if (!state.sections.projects) {
    recommendations.push(`Add a Projects section with your specific contribution and technologies used.`);
  }
  if (!state.sections.experience) {
    recommendations.push(`Add work or internship experience; even strong internships or projects help.`);
  }
  if (state.sections.skills && state.skillCategories.length < 3) {
    recommendations.push(`Organize skills into clear categories to help parsers understand them.`);
  }
  if (state.metricCount === 0) {
    recommendations.push(`Add measurable achievements where possible (percentages, counts, time saved).`);
  }
  if (state.genericPhrases.length) {
    recommendations.push(`Replace generic statements with specific, result-oriented details.`);
  }
  if (state.repeatedLines.length) {
    recommendations.push(`Remove unnecessary repeated information.`);
  }
  if (!state.sections.certifications) {
    recommendations.push(`Consider adding relevant certifications to strengthen your resume.`);
  }

  const improvements =
    state.analysis && Array.isArray(state.analysis.improvementSuggestions)
      ? state.analysis.improvementSuggestions
      : [];
  recommendations.push(...improvements.slice(0, 3));

  return uniqueStrings(recommendations).slice(0, 8);
};

const calculateATSScore = (resumeText, analysis) => {
  if (typeof resumeText !== "string" || !resumeText.trim()) {
    const error = new Error("No resume text available to score.");
    error.statusCode = 400;
    throw error;
  }

  const text = resumeText.replace(/^\uFEFF/, "");
  const lowerText = text.toLowerCase();
  const charCount = text.length;

  const sections = {};
  for (const key of Object.keys(SECTION_LABELS)) {
    sections[key] = detectSection(lowerText, key);
  }

  const detectedSections = Object.keys(SECTION_LABELS)
    .filter((key) => sections[key])
    .map((key) => SECTION_LABELS[key]);
  const missingSections = Object.keys(SECTION_LABELS)
    .filter((key) => !sections[key])
    .map((key) => SECTION_LABELS[key]);

  const specialCharRatio = computeSpecialCharRatio(text);
  const repeatedLines = buildKnowledge(text);
  const tooShort = charCount < 400;
  const tooLong = charCount > 120000;

  const { found: skillKeys, totalCount } = detectSkills(lowerText);
  const skillCategories = [
    ...new Set(
      Object.keys(SKILLS).filter((category) =>
        SKILLS[category].some((skill) => skillKeys.includes(skill))
      )
    ),
  ];

  const actionVerbCount = countMatches(lowerText, ACTION_VERBS);
  const metricCount = countMatches(text, METRIC_PATTERNS);
  const bulletCount = (text.match(/^.*$/gm) || []).filter((line) => BULLET_LINE.test(line)).length;
  const hasDates = DATE_PATTERNS.some((pattern) => pattern.test(lowerText));
  const hasLinks = /\b(?:https?:\/\/|github\.com|linkedin\.com|vercel\.app|netlify\.app)\b/i.test(text);
  const hasContact =
    /\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/i.test(text) ||
    /\b(?:\+?\d{1,3}[\s-]?)?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{4}\b/.test(text) ||
    /\b(?:linkedin|github)\b/i.test(lowerText);
  const genericPhrases = detectGenericPhrases(lowerText);
  const certMentioned = /\bcertif\w+/i.test(lowerText);

  const structure = scoreStructure(
    text,
    sections,
    specialCharRatio,
    repeatedLines,
    tooShort,
    tooLong
  );
  const skills = scoreSkills(
    sections,
    skillKeys,
    skillCategories,
    totalCount,
    actionVerbCount,
    analysis
  );
  const experience = scoreExperience(
    sections,
    lowerText,
    actionVerbCount,
    metricCount,
    bulletCount,
    hasDates
  );
  const projects = scoreProjects(
    sections,
    text,
    metricCount,
    skillKeys.length,
    bulletCount,
    hasLinks
  );
  const education = scoreEducation(sections, lowerText, certMentioned, analysis);
  const content = scoreContent(
    sections,
    text,
    genericPhrases,
    repeatedLines,
    tooLong,
    hasContact,
    tooShort
  );

  const categories = { structure, skills, experience, projects, education, content };

  const overallScore = clampInt(
    categories.structure.score +
      categories.skills.score +
      categories.experience.score +
      categories.projects.score +
      categories.education.score +
      categories.content.score,
    100
  );

  const detectedKeywords = uniqueStrings([
    ...skillKeys.map((key) => SKILL_DISPLAY[key] || key),
    ...analysisKeywords(analysis),
  ]);

  const suggestedKeywords = buildSuggestedKeywords(skillKeys, analysis);

  const formattingIssues = structure.feedback.filter(
    (item) => !item.startsWith("Text-based approximation")
  );
  if (specialCharRatio >= 0.15) {
    formattingIssues.push(
      `High density of special characters; clean the resume formatting.`
    );
  }

  const contentIssues = content.feedback;
  if (tooShort) contentIssues.push(`Content is quite short; consider adding more detail.`);

  const recommendations = buildRecommendations({
    sections,
    skillCategories,
    metricCount,
    genericPhrases,
    repeatedLines,
    analysis,
  });

  return {
    overallScore,
    categories,
    detectedSections,
    missingSections,
    detectedKeywords,
    suggestedKeywords,
    formattingIssues: uniqueStrings(formattingIssues),
    contentIssues: uniqueStrings(contentIssues),
    recommendations,
    analyzedAt: new Date(),
  };
};

module.exports = { calculateATSScore };