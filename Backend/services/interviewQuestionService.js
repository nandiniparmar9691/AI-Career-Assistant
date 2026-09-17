const {
  generateInterviewQuestions: geminiGenerateInterviewQuestions,
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

const VALID_DIFFICULTIES = ["EASY", "MEDIUM", "HARD"];

const normalizeDifficulty = (value) => {
  const v = asString(value).toUpperCase();
  return VALID_DIFFICULTIES.includes(v) ? v : "MEDIUM";
};

const normalizeQuestionCount = (value, fallback = 15) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Math.max(5, Math.min(30, Math.round(num)));
};

const pickGapNames = (items) =>
  uniqueStrings(
    (items || []).map((item) =>
      item && typeof item === "object" ? item.name : item
    )
  );

const collectResumeData = (resume) => {
  const analysis = (resume && resume.analysis) || {};
  const skills = analysis.skills || {};
  return {
    summary: asString(analysis.summary),
    technicalSkills: asStringArray(skills.technical),
    softSkills: asStringArray(skills.soft),
    experienceObservations: asStringArray(
      analysis.experience && analysis.experience.observations
    ),
    educationSummary: asString(analysis.education && analysis.education.summary),
    projectSummary: asString(analysis.projects && analysis.projects.summary),
    projectObservations: asStringArray(
      analysis.projects && analysis.projects.observations
    ),
    certifications: asStringArray(analysis.certifications),
    recommendedRoles: asStringArray(analysis.recommendedRoles),
  };
};

const collectJdData = (jd) => {
  const analysis = (jd && jd.analysis) || {};
  return {
    jobTitle: asString(analysis.jobTitle) || asString(jd && jd.title),
    company: asString(analysis.company) || asString(jd && jd.company),
    requiredSkills: asStringArray(analysis.requiredSkills),
    preferredSkills: asStringArray(analysis.preferredSkills),
    technologies: asStringArray(
      analysis.technologies ||
        analysis.programmingLanguages ||
        analysis.frameworks ||
        analysis.databases ||
        analysis.tools ||
        analysis.cloudTechnologies
    ),
    responsibilities: asStringArray(analysis.responsibilities),
    keywords: asStringArray(analysis.keywords),
    summary: asString(analysis.summary),
  };
};

const collectMatchData = (match) => {
  const analysis = (match && match.analysis) || {};
  return {
    matchPercentage:
      match && match.matchPercentage != null
        ? match.matchPercentage
        : analysis.matchPercentage,
    matchedSkills: uniqueStrings([
      ...asStringArray(analysis.matchedSkills),
      ...asStringArray(analysis.semanticMatchedSkills),
    ]),
    matchedTechnologies: asStringArray(analysis.matchedTechnologies),
    missingSkills: asStringArray(analysis.missingSkills),
    missingTechnologies: asStringArray(analysis.missingTechnologies),
    missingKeywords: asStringArray(analysis.missingKeywords),
  };
};

const collectGapData = (gap) => {
  if (!gap) return {};
  return {
    strengths: asStringArray(gap.strengths),
    missingSkills: pickGapNames(gap.missingSkills),
    missingTechnologies: pickGapNames(gap.missingTechnologies),
    missingKeywords: pickGapNames(gap.missingKeywords),
    recommendations: asStringArray(
      (gap.recommendations || []).map((r) => r && r.title)
    ),
    overallSummary: asString(gap.overallSummary),
  };
};

const normalizeName = (value) =>
  asString(value)
    .toLowerCase()
    .replace(/[\s.]/g, "");

const TECHNICAL_QUESTION_MAP = {
  react: [
    {
      question: "What is the difference between props and state in React, and when do you use each?",
      difficulty: "EASY",
      topics: ["React", "props", "state"],
    },
    {
      question: "Explain how React hooks manage side effects like fetching data, and the rules you must follow.",
      difficulty: "MEDIUM",
      topics: ["React", "hooks", "side effects"],
    },
  ],
  "node.js": [
    {
      question: "Explain how the Node.js event loop works and why it helps a single process handle many requests.",
      difficulty: "MEDIUM",
      topics: ["Node.js", "event loop", "concurrency"],
    },
    {
      question: "What is the difference between a Promise and a callback in JavaScript, and why are Promises preferred?",
      difficulty: "EASY",
      topics: ["Node.js", "Promises", "async"],
    },
  ],
  express: [
    {
      question: "How would you build a REST endpoint with Express and handle validation and errors correctly?",
      difficulty: "MEDIUM",
      topics: ["Express", "REST", "error handling"],
    },
  ],
  mongodb: [
    {
      question: "When would you embed documents versus reference them when designing a MongoDB schema?",
      difficulty: "MEDIUM",
      topics: ["MongoDB", "schema design"],
    },
    {
      question: "How does an index work in MongoDB, and when does it speed up queries?",
      difficulty: "HARD",
      topics: ["MongoDB", "indexing"],
    },
  ],
  javascript: [
    {
      question: "Explain the difference between == and === in JavaScript and give an example.",
      difficulty: "EASY",
      topics: ["JavaScript", "equality"],
    },
    {
      question: "How do closures work in JavaScript, and where are they used in everyday code?",
      difficulty: "MEDIUM",
      topics: ["JavaScript", "closures"],
    },
  ],
  typescript: [
    {
      question: "What are the main benefits of TypeScript over JavaScript, and what is type inference?",
      difficulty: "EASY",
      topics: ["TypeScript", "types"],
    },
  ],
  python: [
    {
      question: "What are the key differences between a list and a tuple in Python, and when do you use each?",
      difficulty: "EASY",
      topics: ["Python", "data structures"],
    },
  ],
  java: [
    {
      question: "Explain what the JVM is and how Java achieves platform independence.",
      difficulty: "EASY",
      topics: ["Java", "JVM"],
    },
  ],
  sql: [
    {
      question: "Explain the difference between an inner join and a left join with a simple example.",
      difficulty: "EASY",
      topics: ["SQL", "joins"],
    },
  ],
  git: [
    {
      question: "Explain the typical Git workflow when adding a feature: branch, commit, pull request.",
      difficulty: "EASY",
      topics: ["Git", "workflow"],
    },
  ],
  html: [
    {
      question: "What is semantic HTML, and why does it matter for accessibility and SEO?",
      difficulty: "EASY",
      topics: ["HTML", "accessibility"],
    },
  ],
  css: [
    {
      question: "How does the CSS box model work, and how do flexbox and grid differ?",
      difficulty: "EASY",
      topics: ["CSS", "box model", "flexbox", "grid"],
    },
  ],
  nextjs: [
    {
      question: "What are the differences between server-side rendering and client-side rendering in Next.js?",
      difficulty: "MEDIUM",
      topics: ["Next.js", "SSR"],
    },
  ],
  graphql: [
    {
      question: "How does GraphQL differ from a REST API, and when would you choose one over the other?",
      difficulty: "MEDIUM",
      topics: ["GraphQL", "REST"],
    },
  ],
  docker: [
    {
      question: "What problem does Docker solve, and how do containers differ from virtual machines?",
      difficulty: "MEDIUM",
      topics: ["Docker", "containers"],
    },
  ],
};

const CODING_POOL = [
  {
    question: "Write a function that checks whether a string is a palindrome and explain its time and space complexity.",
    difficulty: "MEDIUM",
    topics: ["algorithms", "strings", "complexity"],
  },
  {
    question: "Write a small JavaScript function that fetches data from an API and handles errors gracefully.",
    difficulty: "MEDIUM",
    topics: ["JavaScript", "async", "error handling"],
  },
  {
    question: "Design the REST API endpoints (paths, methods, request and response shapes) for a simple task management app.",
    difficulty: "MEDIUM",
    topics: ["REST", "API design"],
  },
  {
    question: "Given an array of numbers, write code to find the second largest value. How would you test your solution?",
    difficulty: "EASY",
    topics: ["arrays", "logic", "testing"],
  },
  {
    question: "Explain how you would debug a React component whose state is not updating as expected.",
    difficulty: "HARD",
    topics: ["debugging", "React", "state"],
  },
  {
    question: "What is the difference between an array and an object in JavaScript, and how do you decide which to use?",
    difficulty: "EASY",
    topics: ["JavaScript", "data structures"],
  },
  {
    question: "Write a function that flattens a nested array and removes duplicate values. What is the time complexity?",
    difficulty: "MEDIUM",
    topics: ["arrays", "algorithms", "complexity"],
  },
  {
    question: "Write a small function that takes a list of user objects and returns the names of users who are active, sorted alphabetically.",
    difficulty: "EASY",
    topics: ["JavaScript", "filtering", "sorting"],
  },
  {
    question: "Explain how you would add debouncing to a search input that calls a backend API on every keystroke.",
    difficulty: "HARD",
    topics: ["debouncing", "JavaScript", "performance"],
  },
];

const BEHAVIORAL_POOL = [
  {
    question: "Tell me about a time you had to learn a new technology quickly. How did you approach it?",
    difficulty: "MEDIUM",
    topics: ["learning", "initiative"],
  },
  {
    question: "Describe a group project where the team disagreed. How did you help resolve it?",
    difficulty: "MEDIUM",
    topics: ["teamwork", "conflict"],
  },
  {
    question: "Tell me about a difficult problem you faced in an academic or personal project and how you solved it.",
    difficulty: "MEDIUM",
    topics: ["problem solving"],
  },
  {
    question: "How do you manage your time when several assignments have the same deadline?",
    difficulty: "EASY",
    topics: ["time management"],
  },
  {
    question: "Tell me about a time you received constructive feedback and what you changed because of it.",
    difficulty: "EASY",
    topics: ["feedback", "growth"],
  },
  {
    question: "Describe a project you are proud of and what your specific contribution was.",
    difficulty: "EASY",
    topics: ["ownership", "project"],
  },
  {
    question: "How do you react when a requirement is unclear? Walk me through how you would clarify it.",
    difficulty: "EASY",
    topics: ["communication", "ambiguity"],
  },
  {
    question: "Tell me about a mistake you made in a project and what you learned from it.",
    difficulty: "MEDIUM",
    topics: ["accountability", "learning"],
  },
];

const SKILL_GAP_QUESTION_MAP = {
  postgresql: {
    question:
      "How would you design a relational database schema in PostgreSQL for an e-commerce application?",
    difficulty: "MEDIUM",
    topics: ["PostgreSQL", "SQL", "schema design"],
  },
  sql: {
    question:
      "How would you write a query to find the top 5 products by sales in a relational database?",
    difficulty: "MEDIUM",
    topics: ["SQL", "queries"],
  },
  docker: {
    question:
      "What does Docker help you do, and how would you containerize a Node.js application?",
    difficulty: "MEDIUM",
    topics: ["Docker", "containers"],
  },
  kubernetes: {
    question:
      "What is Kubernetes used for, and how does it help manage and scale a set of containers?",
    difficulty: "MEDIUM",
    topics: ["Kubernetes", "orchestration"],
  },
  aws: {
    question:
      "Which core AWS services would you use to deploy a web application, and what is each one responsible for?",
    difficulty: "MEDIUM",
    topics: ["AWS", "deployment"],
  },
  "azure": {
    question:
      "What are the core Azure services used for hosting and storing a web application?",
    difficulty: "MEDIUM",
    topics: ["Azure", "cloud"],
  },
  redis: {
    question:
      "What kinds of problems does Redis solve, and what is the basic idea behind how it caches data?",
    difficulty: "MEDIUM",
    topics: ["Redis", "caching"],
  },
  graphql: {
    question:
      "How does GraphQL change the way a client requests data compared with REST?",
    difficulty: "MEDIUM",
    topics: ["GraphQL", "REST"],
  },
  "typescript": {
    question:
      "What are the main benefits a team gets from using TypeScript, and how does type checking help prevent bugs?",
    difficulty: "EASY",
    topics: ["TypeScript", "type safety"],
  },
  "jenkins": {
    question:
      "What is CI/CD, and how does a tool like Jenkins help a team ship software reliably?",
    difficulty: "EASY",
    topics: ["CI/CD", "Jenkins"],
  },
  "api": {
    question:
      "What is a REST API, and what are HTTP methods, status codes, and request/response structure?",
    difficulty: "EASY",
    topics: ["REST", "HTTP"],
  },
};

const genericQuestionFor = (name, roleTitle) => ({
  question: `Explain what ${name} is and the key concepts a fresher should know before using it in a ${roleTitle || "software development"} role.`,
  difficulty: "EASY",
  topics: [name],
});

const buildTechnicalPool = ({ technicalSkills, resumeObservations }) => {
  const pool = [];
  const seen = new Set();
  const skills = uniqueStrings(technicalSkills);
  for (const skill of skills) {
    const templates = TECHNICAL_QUESTION_MAP[normalizeName(skill)] || [
      {
        question: `Explain the core idea behind ${skill} and a typical scenario where it is used in software development.`,
        difficulty: "EASY",
        topics: [skill],
      },
    ];
    templates.forEach((t) => {
      const key = normalizeName(t.question);
      if (seen.has(key)) return;
      seen.add(key);
      pool.push({
        category: "TECHNICAL",
        question: t.question,
        difficulty: t.difficulty,
        expectedTopics: t.topics || [skill],
        whyAsked: "The resume demonstrates this technology, so interviewers are likely to test whether the fundamentals are solid.",
      });
    });
  }
  const CORE_TECHNICAL = [
    {
      question: "Walk me through what happens when you type a URL into a browser and press Enter.",
      difficulty: "MEDIUM",
      topics: ["HTTP", "DNS", "browser"],
    },
    {
      question: "How would you debug a feature that works locally but fails after deployment?",
      difficulty: "MEDIUM",
      topics: ["debugging", "deployment"],
    },
  ];
  CORE_TECHNICAL.forEach((t) => {
    const key = normalizeName(t.question);
    if (seen.has(key)) return;
    seen.add(key);
    pool.push({
      category: "TECHNICAL",
      question: t.question,
      difficulty: t.difficulty,
      expectedTopics: t.topics,
      whyAsked: "Core software fundamentals that apply to most fresher developer interviews.",
    });
  });
  return pool;
};

const buildCodingPool = () =>
  CODING_POOL.map((item) => ({
    category: "CODING",
    question: item.question,
    difficulty: item.difficulty,
    expectedTopics: item.topics,
    whyAsked:
      "Coding questions check practical problem solving, which is expected for a fresher developer role.",
  }));

const buildProjectPool = ({ projectObservations, projectSummary }) => {
  const pool = [];
  const used = new Set();
  for (const obs of projectObservations) {
    const key = normalizeName(obs);
    if (used.has(key)) continue;
    used.add(key);
    pool.push({
      category: "PROJECT",
      question: `Your resume lists a project described as: "${obs}". Describe what it does, your role in it, and what you learned.`,
      difficulty: "MEDIUM",
      expectedTopics: ["project", "experience"],
      whyAsked:
        "Asks the candidate to explain work they actually listed on the resume to gauge depth of contribution.",
    });
  }
  if (projectSummary && !used.has(normalizeName(projectSummary))) {
    pool.push({
      category: "PROJECT",
      question: `Your resume says you built ${projectSummary}. Walk me through the problem it solved and the key decisions you made.`,
      difficulty: "MEDIUM",
      expectedTopics: ["project", "architecture"],
      whyAsked:
        "Bases the project walkthrough on a project the candidate actually listed on the resume.",
    });
  }
  return pool;
};

const buildResumePool = ({ summary, recommendedRoles, matchedSkills, roleTitle }) => {
  const pool = [];
  if (summary) {
    pool.push({
      category: "RESUME",
      question: `Your resume summary reads: "${summary}". How does your background prepare you for this ${roleTitle || "role"}?`,
      difficulty: "EASY",
      expectedTopics: ["resume", "background"],
      whyAsked:
        "References the exact summary on the resume to check the candidate can connect it to the job.",
    });
  }
  if (recommendedRoles[0]) {
    pool.push({
      category: "RESUME",
      question: `What interests you about working as ${recommendedRoles[0]}, based on your skills and projects?`,
      difficulty: "EASY",
      expectedTopics: ["career interests"],
      whyAsked:
        "Explores motivation against a role the resume analysis suggested for the candidate.",
    });
  }
  if (matchedSkills[0]) {
    pool.push({
      category: "RESUME",
      question: `Your resume and match results highlight ${matchedSkills.slice(0, 4).join(", ")}. Which are you strongest in, and why?`,
      difficulty: "EASY",
      expectedTopics: ["skills", "self assessment"],
      whyAsked:
        "Asks the candidate to discuss skills that genuinely matched in the resume-job comparison.",
    });
  }
  pool.push({
    category: "RESUME",
    question: "Walk me through your resume. Which experiences stand out to you and why?",
    difficulty: "EASY",
    expectedTopics: ["resume", "communication"],
    whyAsked:
      "A standard opening that checks how clearly the candidate can present their own background.",
  });
  return pool;
};

const buildBehavioralPool = () =>
  BEHAVIORAL_POOL.map((item) => ({
    category: "BEHAVIORAL",
    question: item.question,
    difficulty: item.difficulty,
    expectedTopics: item.topics,
    whyAsked:
      "Behavioral questions assess collaboration, ownership and growth, which matter for junior hires.",
  }));

const buildJobSpecificPool = ({ responsibilities, technologies, roleTitle }) => {
  const pool = [];
  if (responsibilities[0]) {
    pool.push({
      category: "JOB_SPECIFIC",
      question: `The job description includes work like "${responsibilities[0]}". How would you approach that kind of work as a fresher?`,
      difficulty: "MEDIUM",
      expectedTopics: ["job responsibilities"],
      whyAsked:
        "Taken directly from the job description so the question is specific to this role.",
    });
  }
  if (technologies[0]) {
    pool.push({
      category: "JOB_SPECIFIC",
      question: `This role mentions ${technologies.slice(0, 4).join(", ")}. How do these technologies fit together, and what would you need to learn to contribute quickly?`,
      difficulty: "MEDIUM",
      expectedTopics: technologies.slice(0, 4),
      whyAsked:
        "Uses the technologies the job description requires to check role-specific awareness.",
    });
  }
  if (roleTitle) {
    pool.push({
      category: "JOB_SPECIFIC",
      question: `Based on the description, what do you understand the ${roleTitle} role to involve day to day?`,
      difficulty: "EASY",
      expectedTopics: [roleTitle, "role"],
      whyAsked:
        "Verifies the candidate read and understood the actual job description.",
    });
  }
  return pool;
};

const buildSkillGapPool = ({ missingSkills, missingTechnologies, missingKeywords, roleTitle }) => {
  const pool = [];
  const seen = new Set();
  const names = pickGapNames([...missingSkills, ...missingTechnologies]);
  for (const name of names) {
    const template =
      SKILL_GAP_QUESTION_MAP[normalizeName(name)] ||
      genericQuestionFor(name, roleTitle);
    const key = normalizeName(template.question);
    if (seen.has(key)) continue;
    seen.add(key);
    pool.push({
      category: "SKILL_GAP",
      question: template.question,
      difficulty: template.difficulty,
      expectedTopics: template.topics || [name],
      whyAsked:
        `${name} is missing from the resume but relevant to this role; the question checks preparation without assuming experience.`,
    });
  }
  for (const keyword of missingKeywords) {
    const key = normalizeName(keyword);
    if (seen.has(key)) continue;
    seen.add(key);
    pool.push({
      category: "SKILL_GAP",
      question: `What does "${keyword}" mean in the context of this role, and can you give a concrete example of it in practice?`,
      difficulty: "MEDIUM",
      expectedTopics: [keyword],
      whyAsked:
        `${keyword} appears in the job description but is not yet demonstrated; this checks conceptual understanding.`,
    });
  }
  return pool;
};

const DIFFICULTY_ORDER = {
  EASY: ["EASY", "MEDIUM", "HARD"],
  MEDIUM: ["MEDIUM", "EASY", "HARD"],
  HARD: ["HARD", "MEDIUM", "EASY"],
};

const byPreferredDifficulty = (difficulty) => (a, b) => {
  const order = DIFFICULTY_ORDER[difficulty] || DIFFICULTY_ORDER.MEDIUM;
  return order.indexOf(a.difficulty) - order.indexOf(b.difficulty);
};

const DISTRIBUTION_WEIGHTS = {
  TECHNICAL: 4,
  CODING: 2,
  PROJECT: 3,
  RESUME: 2,
  BEHAVIORAL: 2,
  JOB_SPECIFIC: 1,
  SKILL_GAP: 1,
};

const allocateFallback = (pools, count, difficulty) => {
  const cats = Object.keys(pools).filter((c) => pools[c].length > 0);
  if (cats.length === 0) return [];

  const totalWeight = cats.reduce(
    (sum, c) => sum + (DISTRIBUTION_WEIGHTS[c] || 1),
    0
  );
  const allocated = {};
  let remaining = count;

  for (const c of cats) {
    let share = Math.floor((count * (DISTRIBUTION_WEIGHTS[c] || 1)) / totalWeight);
    if (share < 1 && cats.length <= count) share = 1;
    share = Math.min(share, pools[c].length);
    allocated[c] = share;
    remaining -= share;
  }

  const order = [...cats].sort(
    (a, b) => (DISTRIBUTION_WEIGHTS[b] || 0) - (DISTRIBUTION_WEIGHTS[a] || 0)
  );
  let guard = 0;
  while (remaining > 0 && guard < 300) {
    guard += 1;
    let progressed = false;
    for (const c of order) {
      if (remaining <= 0) break;
      if (allocated[c] < pools[c].length) {
        allocated[c] += 1;
        remaining -= 1;
        progressed = true;
      }
    }
    if (!progressed) break;
  }

  const result = [];
  for (const c of cats) {
    result.push(
      ...pools[c].slice().sort(byPreferredDifficulty(difficulty)).slice(0, allocated[c])
    );
  }
  return result;
};

const buildFallbackQuestions = (ctx) => {
  const pools = {
    TECHNICAL: buildTechnicalPool(ctx),
    CODING: buildCodingPool(ctx),
    PROJECT: buildProjectPool(ctx),
    RESUME: buildResumePool(ctx),
    BEHAVIORAL: buildBehavioralPool(ctx),
    JOB_SPECIFIC: buildJobSpecificPool(ctx),
    SKILL_GAP: buildSkillGapPool(ctx),
  };
  return allocateFallback(pools, ctx.questionCount, ctx.difficulty);
};

const dedupeQuestions = (questions) => {
  const seen = new Set();
  const result = [];
  for (const q of questions || []) {
    const key = normalizeName(q && q.question);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(q);
  }
  return result;
};

const validQuestions = (questions) =>
  (questions || []).filter(
    (q) =>
      q &&
      asString(q.question) &&
      VALID_DIFFICULTIES.includes(q.difficulty)
  );

// @desc  Generate a personalized interview question set.
// @return { targetRole, difficulty, questions, totalQuestions }
const generateInterviewQuestions = async (data) => {
  const difficulty = normalizeDifficulty(data.difficulty);
  const questionCount = normalizeQuestionCount(data.questionCount, 15);

  const resumeData = collectResumeData(data.resume);
  const jdData = collectJdData(data.jobDescription);
  const matchData = collectMatchData(data.resumeMatch);
  const gapData = collectGapData(data.skillGap);
  const targetRole =
    asString(data.targetRole) || jdData.jobTitle || asString(data.roleTitle) || "";

  const ctx = {
    ...resumeData,
    ...jdData,
    ...matchData,
    ...gapData,
    roleTitle: targetRole,
    difficulty,
    questionCount,
  };

  let aiResult = null;
  try {
    const gemini = await geminiGenerateInterviewQuestions(
      resumeData,
      jdData,
      matchData,
      gapData,
      { targetRole, difficulty, questionCount }
    );
    aiResult = gemini.result;
  } catch (error) {
    console.error("Gemini interview questions skipped/errored:", error.message);
    aiResult = null;
  }

  let finalRole = targetRole;
  const used = new Set();
  const questions = [];

  const pushQuestion = (q) => {
    const key = normalizeName(q.question);
    if (!key || used.has(key)) return;
    if (questions.length >= questionCount) return;
    used.add(key);
    questions.push({
      category: q.category,
      question: q.question,
      difficulty: q.difficulty,
      expectedTopics: asStringArray(q.expectedTopics),
      whyAsked: asString(q.whyAsked),
    });
  };

  const aiQuestions = validQuestions(aiResult && aiResult.questions);
  if (aiQuestions.length) {
    if (asString(aiResult.targetRole)) finalRole = asString(aiResult.targetRole);
    aiQuestions.forEach((q) => {
      if (questions.length >= questionCount) return;
      const key = normalizeName(q.question);
      if (used.has(key)) return;
      used.add(key);
      questions.push({
        category: q.category,
        question: q.question,
        difficulty: q.difficulty,
        expectedTopics: asStringArray(q.expectedTopics),
        whyAsked: asString(q.whyAsked),
      });
    });
  }

  if (questions.length < questionCount) {
    const fallback = dedupeQuestions(buildFallbackQuestions(ctx));
    fallback.forEach((q) => pushQuestion(q));
  }

  const finalQuestions = questions
    .sort(byPreferredDifficulty(difficulty))
    .slice(0, questionCount);

  return {
    targetRole: finalRole,
    difficulty,
    questions: finalQuestions,
    totalQuestions: finalQuestions.length,
  };
};

module.exports = { generateInterviewQuestions };