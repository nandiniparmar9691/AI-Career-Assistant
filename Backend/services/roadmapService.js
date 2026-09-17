const asString = (value) => (typeof value === "string" ? value.trim() : "");

const asStringArray = (value) =>
  Array.isArray(value)
    ? value
        .filter((item) => typeof item === "string" || typeof item === "number")
        .map((item) => String(item).trim())
        .filter(Boolean)
    : [];

const normalizeName = (value) =>
  asString(value).toLowerCase().replace(/[\s.]/g, "");

const gapNames = (items) =>
  asStringArray((items || []).map((item) => item && item.name));

// Prerequisite (foundation) knowledge for a gap, used only when a gap really exists.
const PREREQ = {
  react: ["JavaScript", "HTML", "CSS"],
  "react.js": ["JavaScript", "HTML", "CSS"],
  "next.js": ["JavaScript", "React"],
  vue: ["JavaScript", "HTML"],
  "vue.js": ["JavaScript", "HTML"],
  angular: ["TypeScript", "JavaScript"],
  svelte: ["JavaScript"],
  typescript: ["JavaScript"],
  "node.js": ["JavaScript"],
  express: ["JavaScript", "Node.js"],
  nestjs: ["JavaScript", "Node.js", "TypeScript"],
  django: ["Python"],
  flask: ["Python"],
  fastapi: ["Python"],
  springboot: ["Java"],
  "spring boot": ["Java"],
  ".net": ["C#"],
  "c#": [".NET fundamentals"],
  go: ["Go fundamentals"],
  rust: ["Rust fundamentals"],
  postgresql: ["SQL", "Database fundamentals"],
  postgres: ["SQL", "Database fundamentals"],
  mysql: ["SQL", "Database fundamentals"],
  mongodb: ["Database fundamentals", "MongoDB basics"],
  redis: ["Database fundamentals"],
  aws: ["Linux basics", "Networking basics", "Cloud CLI"],
  azure: ["Linux basics", "Cloud CLI"],
  googlecloud: ["Cloud fundamentals", "Cloud CLI"],
  "google cloud": ["Cloud fundamentals", "Cloud CLI"],
  docker: ["Linux basics", "Terminal & CLI"],
  kubernetes: ["Docker", "Linux basics", "Networking basics"],
  terraform: ["Infrastructure basics", "Cloud basics"],
  jenkins: ["CI/CD basics", "Git"],
  cicd: ["Git", "Automation basics"],
  "ci/cd": ["Git", "Automation basics"],
  git: ["Version control", "Git workflows"],
  github: ["Git", "GitHub workflows"],
  bash: ["Command line", "Linux basics"],
  linux: ["Command line", "Linux basics"],
  sql: ["Relational database fundamentals"],
};

const TOPIC_MAP = {
  react: [
    "React fundamentals",
    "Components, props and state",
    "React hooks",
    "Forms and API integration",
    "Styling with Tailwind CSS",
  ],
  "next.js": [
    "Next.js routing and data fetching",
    "Server components and API routes",
    "Deployment to Vercel",
  ],
  "node.js": [
    "Node.js basics and the event loop",
    "Building REST APIs",
    "Middleware and error handling",
  ],
  express: [
    "Express routing and middleware",
    "REST API design",
    "Error handling and validation",
  ],
  typescript: [
    "TypeScript fundamentals",
    "Interfaces, types and generics",
    "Typing a React/Node project",
  ],
  javascript: [
    "JavaScript fundamentals",
    "Async programming (Promises, async/await)",
    "DOM and modern ES features",
  ],
  mongodb: [
    "Document modelling",
    "MongoDB queries and indexes",
    "Mongoose schemas and aggregations",
  ],
  postgresql: [
    "SQL and relational modelling",
    "Joins, indexes and transactions",
  ],
  mysql: ["SQL and schema design", "Indexes, constraints and joins"],
  sql: ["Select, insert, update, delete", "Joins and grouping", "Indexes and performance"],
  docker: [
    "Images and containers",
    "Dockerfiles",
    "Docker Compose",
    "Container networking and volumes",
  ],
  kubernetes: [
    "Pods, deployments and services",
    "Helm and manifests",
    "Cluster basics",
  ],
  aws: [
    "Core services (EC2, S3, Lambda)",
    "IAM security basics",
    "Serverless patterns",
  ],
  azure: ["Azure core services", "Azure DevOps basics"],
  googlecloud: ["Compute and storage services", "Cloud Run and IAM"],
  terraform: ["Terraform basics", "State and providers"],
  jenkins: ["Jenkins pipeline", "Build automation"],
  cicd: ["GitHub Actions basics", "Build, test and deploy pipeline"],
  "ci/cd": ["GitHub Actions basics", "Build, test and deploy pipeline"],
  git: ["Git basics and branching", "Rebasing and merging", "Collaborative workflows"],
  github: ["Repositories and PRs", "Issues and project boards", "GitHub Actions"],
  python: ["Python basics", "Libraries and tooling"],
  java: ["Java fundamentals", "Build tools and packaging"],
  go: ["Go syntax and tooling", "Concurrency basics"],
  rust: ["Rust ownership", "Cargo and crates"],
  redis: ["Redis data structures", "Caching patterns"],
};

const RESOURCE_MAP = {
  react: [{ title: "React documentation (react.dev)", type: "Documentation", url: "https://react.dev/learn" }],
  "next.js": [{ title: "Next.js documentation", type: "Documentation", url: "https://nextjs.org/docs" }],
  "node.js": [{ title: "Node.js official learn guides", type: "Documentation", url: "https://nodejs.org/en/learn" }],
  express: [{ title: "Express.js documentation", type: "Documentation", url: "https://expressjs.com/" }],
  typescript: [{ title: "TypeScript documentation", type: "Documentation", url: "https://www.typescriptlang.org/docs/" }],
  javascript: [{ title: "MDN — JavaScript guide", type: "Documentation", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide" }],
  html: [{ title: "MDN — HTML documentation", type: "Documentation", url: "https://developer.mozilla.org/en-US/docs/Web/HTML" }],
  css: [{ title: "MDN — CSS documentation", type: "Documentation", url: "https://developer.mozilla.org/en-US/docs/Web/CSS" }],
  tailwindcss: [{ title: "Tailwind CSS documentation", type: "Documentation", url: "https://tailwindcss.com/docs" }],
  bootstrap: [{ title: "Bootstrap documentation", type: "Documentation", url: "https://getbootstrap.com/docs/" }],
  vue: [{ title: "Vue.js documentation", type: "Documentation", url: "https://vuejs.org/guide/" }],
  angular: [{ title: "Angular documentation", type: "Documentation", url: "https://angular.dev/docs" }],
  svelte: [{ title: "Svelte documentation", type: "Documentation", url: "https://svelte.dev/docs" }],
  redux: [{ title: "Redux documentation", type: "Documentation", url: "https://redux.js.org/" }],
  graphql: [{ title: "GraphQL learning resources", type: "Documentation", url: "https://graphql.org/learn/" }],
  mongodb: [{ title: "MongoDB documentation", type: "Documentation", url: "https://www.mongodb.com/docs/" }],
  mongoose: [{ title: "Mongoose documentation", type: "Documentation", url: "https://mongoosejs.com/docs/" }],
  postgresql: [{ title: "PostgreSQL documentation", type: "Documentation", url: "https://www.postgresql.org/docs/current/" }],
  mysql: [{ title: "MySQL documentation", type: "Documentation", url: "https://dev.mysql.com/doc/" }],
  sql: [
    { title: "PostgreSQL tutorial (SQL fundamentals)", type: "Tutorial", url: "https://www.postgresql.org/docs/current/tutorial.html" },
  ],
  sqlite: [{ title: "SQLite documentation", type: "Documentation", url: "https://www.sqlite.org/docs.html" }],
  redis: [{ title: "Redis documentation", type: "Documentation", url: "https://redis.io/docs/" }],
  prisma: [{ title: "Prisma documentation", type: "Documentation", url: "https://www.prisma.io/docs/" }],
  docker: [{ title: "Docker documentation", type: "Documentation", url: "https://docs.docker.com/" }],
  kubernetes: [{ title: "Kubernetes documentation", type: "Documentation", url: "https://kubernetes.io/docs/" }],
  terraform: [{ title: "Terraform documentation", type: "Documentation", url: "https://developer.hashicorp.com/terraform/docs" }],
  aws: [{ title: "AWS documentation", type: "Documentation", url: "https://docs.aws.amazon.com/" }],
  azure: [{ title: "Microsoft Azure documentation", type: "Documentation", url: "https://learn.microsoft.com/en-us/azure/" }],
  googlecloud: [{ title: "Google Cloud documentation", type: "Documentation", url: "https://cloud.google.com/docs" }],
  jenkins: [{ title: "Jenkins documentation", type: "Documentation", url: "https://www.jenkins.io/doc/" }],
  cicd: [{ title: "GitHub Actions documentation", type: "Documentation", url: "https://docs.github.com/en/actions" }],
  "ci/cd": [{ title: "GitHub Actions documentation", type: "Documentation", url: "https://docs.github.com/en/actions" }],
  git: [{ title: "Git documentation", type: "Documentation", url: "https://git-scm.com/doc" }],
  github: [{ title: "GitHub documentation", type: "Documentation", url: "https://docs.github.com/" }],
  gitlab: [{ title: "GitLab documentation", type: "Documentation", url: "https://docs.gitlab.com/" }],
  python: [{ title: "Python documentation", type: "Documentation", url: "https://www.python.org/doc/" }],
  java: [{ title: "Java documentation (Oracle)", type: "Documentation", url: "https://docs.oracle.com/en/java/" }],
  go: [{ title: "Go documentation", type: "Documentation", url: "https://go.dev/doc/" }],
  rust: [{ title: "The Rust Book", type: "Documentation", url: "https://doc.rust-lang.org/book/" }],
  django: [{ title: "Django documentation", type: "Documentation", url: "https://docs.djangoproject.com/" }],
  flask: [{ title: "Flask documentation", type: "Documentation", url: "https://flask.palletsprojects.com/" }],
  fastapi: [{ title: "FastAPI documentation", type: "Documentation", url: "https://fastapi.tiangolo.com/" }],
  springboot: [{ title: "Spring Boot documentation", type: "Documentation", url: "https://docs.spring.io/spring-boot/" }],
  nestjs: [{ title: "NestJS documentation", type: "Documentation", url: "https://docs.nestjs.com/" }],
  jest: [{ title: "Jest documentation", type: "Documentation", url: "https://jestjs.io/docs/" }],
  cypress: [{ title: "Cypress documentation", type: "Documentation", url: "https://docs.cypress.io/" }],
  postman: [{ title: "Postman learning center", type: "Documentation", url: "https://learning.postman.com/" }],
};

const resourcesFor = (names) => {
  const seen = new Set();
  const resources = [];
  for (const name of names) {
    const key = normalizeName(name);
    const mapped = RESOURCE_MAP[key] || [
      { title: `${name} — start with its official documentation`, type: "Documentation", url: "" },
    ];
    for (const item of mapped) {
      const resKey = `${asString(item.title)}|${asString(item.url)}`;
      if (seen.has(resKey)) continue;
      seen.add(resKey);
      resources.push({
        title: asString(item.title),
        type: asString(item.type) || "Documentation",
        url: asString(item.url),
      });
    }
  }
  return resources.slice(0, 6);
};

const topicsFor = (name) => {
  const mapped = TOPIC_MAP[normalizeName(name)];
  if (mapped && mapped.length) return mapped;
  return [`${name} fundamentals`, `Practical application of ${name}`, `Common patterns and best practices`];
};

const prereqFor = (name) => {
  const mapped = PREREQ[normalizeName(name)];
  if (mapped && mapped.length) return mapped;
  return [];
};

const upperFirst = (value) => {
  const v = asString(value);
  return v ? v.charAt(0).toUpperCase() + v.slice(1) : v;
};

const calculateProgress = (phases) => {
  if (!phases || phases.length === 0) return 0;
  const completed = phases.filter((p) => p.completed).length;
  return Math.round((completed / phases.length) * 100);
};

const buildPhase = (seed) => ({
  phaseNumber: seed.phaseNumber,
  title: seed.title,
  duration: seed.duration,
  goals: asStringArray(seed.goals),
  skills: asStringArray(seed.skills),
  topics: asStringArray(seed.topics),
  resources: seed.resources || [],
  projects: asStringArray(seed.projects),
  completed: false,
});

const jobTitleText = (jobDescription) =>
  asString(
    (jobDescription && jobDescription.analysis && jobDescription.analysis.jobTitle) ||
      (jobDescription && jobDescription.title)
  ) || "this role";

const generateRoadmap = (skillGap, jobDescription, resume) => {
  const strengths = asStringArray(skillGap && skillGap.strengths);
  const strengthSet = new Set(strengths.map(normalizeName).filter(Boolean));

  const skillItems = (skillGap && skillGap.missingSkills) || [];
  const techItems = (skillGap && skillGap.missingTechnologies) || [];
  const keywordItems = (skillGap && skillGap.missingKeywords) || [];

  const highSkills = gapNames(skillItems.filter((g) => g && g.priority === "HIGH"));
  const mediumSkills = gapNames(skillItems.filter((g) => g && g.priority === "MEDIUM"));
  const techSkills = gapNames(techItems);
  const keywords = gapNames(keywordItems);

  const notAlreadyDemonstrated = (names) =>
    names.filter((n) => !strengthSet.has(normalizeName(n)));

  const toLearnHigh = notAlreadyDemonstrated([...highSkills]);
  const toLearnMedium = notAlreadyDemonstrated([...mediumSkills, ...techSkills.filter((t) => !highSkills.includes(t))]);
  const toLearnKeywords = keywords.filter((k) => !strengthSet.has(normalizeName(k)));

  const focus = [...toLearnHigh, ...toLearnMedium, ...toLearnKeywords];
  const title = `Roadmap to ${jobTitleText(jobDescription)}`;

  // No meaningful technical gaps: build a lighter "polish & prepare" roadmap.
  if (focus.length === 0) {
    const phases = [
      buildPhase({
        phaseNumber: 1,
        title: "Strengthen Your Results",
        duration: "Week 1–2",
        goals: [
          "Rewrite resume bullets with measurable outcomes for work already demonstrated",
          "Make strengths and keywords consistent with the job description",
        ],
        skills: strengths.slice(0, 6),
        topics: [
          "Writing measurable bullet points",
          "Tailoring a resume to a specific job description",
        ],
        resources: resourcesFor(strengths.slice(0, 4)),
        projects: ["Update your resume and create matching LinkedIn and GitHub summaries"],
      }),
      buildPhase({
        phaseNumber: 2,
        title: "Build a Stronger Portfolio",
        duration: "Week 3–5",
        goals: [
          "Build one polished project that showcases your best skills",
          "Publish it with clean code, documentation and a live demo",
        ],
        skills: strengths.slice(0, 6),
        topics: [
          "Project architecture and structure",
          "Testing and deployment basics",
          "Documentation and README wiring",
        ],
        resources: resourcesFor(strengths.slice(0, 4)),
        projects: [
          "Ship a project that uses your top demonstrated technologies, with tests and a README",
          "Add a case study section to your resume describing the impact",
        ],
      }),
      buildPhase({
        phaseNumber: 3,
        title: "Interview & Job Preparation",
        duration: "Week 6–8",
        goals: [
          "Practice technical interview questions on your core technologies",
          "Prepare concise stories that connect your experience to this role",
        ],
        skills: strengths.slice(0, 6),
        topics: [
          "Interview-style coding questions",
          "Behavioural questions (STAR method)",
          "Questions to ask the interviewer",
        ],
        resources: [
          { title: `Common interview questions for ${jobTitleText(jobDescription)}`, type: "Guide", url: "" },
        ],
        projects: ["Run a timed mock interview and review the recording"],
      }),
    ];

    return {
      title,
      summary: "Your resume already demonstrates the key requirements for this role. This roadmap helps you showcase that evidence more strongly and prepare for interviews.",
      totalDuration: "Approximately 6–8 weeks",
      phases,
      progress: calculateProgress(phases),
    };
  }

  const primaryTech = toLearnHigh.length ? toLearnHigh : toLearnMedium.slice(0, 2);
  const baseNames = primaryTech.flatMap((t) => prereqFor(t));
  const foundationTopicNames = baseNames.length
    ? baseNames
    : primaryTech.slice(0, 2);
  const foundationSkills = foundationTopicNames.slice(0, 4);

  const phase1 = buildPhase({
    phaseNumber: 1,
    title: "Foundation & Prerequisites",
    duration: "Week 1–2",
    goals: [
      `Build the fundamentals needed before learning ${primaryTech.slice(0, 3).join(", ")}`,
      "Set up a clean development environment and git workflow",
    ],
    skills: foundationSkills,
    topics: foundationSkills.flatMap((s) => topicsFor(s)).slice(0, 6),
    resources: resourcesFor(foundationSkills),
    projects: [
      `Complete a small practice exercise using ${foundationSkills.slice(0, 2).join(" and ") || "your core tools"}`,
    ],
  });

  const coreFocus = primaryTech.slice(0, 5);
  const phase2 = buildPhase({
    phaseNumber: 2,
    title: "Core Missing Technologies",
    duration: "Week 3–5",
    goals: [
      `Learn ${coreFocus.join(", ")} through guided practice`,
      "Use each technology in at least one hands-on exercise",
    ],
    skills: coreFocus,
    topics: coreFocus.flatMap((t) => topicsFor(t)).slice(0, 8),
    resources: resourcesFor(coreFocus),
    projects: coreFocus.map((t) => `Build a focused mini-project that practices ${t}`).slice(0, 3),
  });

  const jobSpecific = [...toLearnMedium, ...toLearnKeywords].slice(0, 5);
  const phase3 = jobSpecific.length
    ? buildPhase({
        phaseNumber: 3,
        title: "Job-Specific Skills",
        duration: "Week 6–7",
        goals: [
          `Cover the supporting skills this role mentions: ${jobSpecific.join(", ")}`,
          "Practice combining them with the core technologies from Phase 2",
        ],
        skills: jobSpecific,
        topics: jobSpecific.flatMap((t) => topicsFor(t)).slice(0, 8),
        resources: resourcesFor(jobSpecific),
        projects: jobSpecific.length >= 2
          ? [`Combine ${jobSpecific[0]} and ${jobSpecific[1]} in an end-to-end task`]
          : [`Use ${jobSpecific[0]} in a realistic task for this role`],
      })
    : null;

  const projectTech = [...primaryTech, ...jobSpecific].slice(0, 4);
  const phase4 = buildPhase({
    phaseNumber: jobSpecific ? 4 : 3,
    title: "Capstone Project",
    duration: "Week 8–9",
    goals: [
      `Build one complete project using ${projectTech.join(", ") || "the technologies you learned"}`,
      "Focus on production-quality practices: structure, error handling and clear docs",
    ],
    skills: projectTech,
    topics: [
      "API design and data modelling",
      "Containerization and deployment",
      "Testing and code quality",
    ],
    resources: projectTech.length ? resourcesFor(projectTech) : [],
    projects: [
      `Ship a full project combining ${projectTech.join(", ") || "your new technologies"}, with a README and live demo`,
    ],
  });

  const phase5 = buildPhase({
    phaseNumber: jobSpecific ? 5 : 4,
    title: "Interview & Job Preparation",
    duration: "Week 10",
    goals: [
      `Practice interview questions that cover ${[...primaryTech, ...jobSpecific].slice(0, 4).join(", ")}`,
      "Prepare stories that map your projects to this role's responsibilities",
    ],
    skills: [...primaryTech, ...strengths.slice(0, 3)].slice(0, 6),
    topics: [
      "Interview-style coding questions",
      "Behavioural questions (STAR method)",
      "Questions to ask the interviewer",
    ],
    resources: [
      { title: `Common interview questions for ${jobTitleText(jobDescription)}`, type: "Guide", url: "" },
    ],
    projects: ["Run a timed mock interview and review the recording"],
  });

  const phases = jobSpecific
    ? [phase1, phase2, phase3, phase4, phase5]
    : [phase1, phase2, phase4, phase5];

  const totalWeeks = jobSpecific ? "10" : "8";
  const summary = `Focused on closing the gaps for ${title.toLowerCase()}: the roadmap starts from the ${phase1.skills.join(", ")} you need first, then moves into the core missing technologies (${coreFocus.join(", ")}), supporting skills, a capstone project and interview preparation. Skills you already demonstrated are not re-taught.`;

  return {
    title,
    summary,
    totalDuration: `Approximately ${totalWeeks} weeks`,
    phases,
    progress: calculateProgress(phases),
  };
};

module.exports = { generateRoadmap, calculateProgress };