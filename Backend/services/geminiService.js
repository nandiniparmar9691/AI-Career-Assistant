const { GoogleGenAI } = require("@google/genai");

const DEFAULT_MODEL = "gemini-3.6-flash";
const MAX_TEXT_CHARS = 60000;
const MAX_JD_CHARS = 20000;

const isConfigured = () =>
  Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim());

const makeError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const buildAnalysisPrompt = (resumeText, truncated) => {
  const note = truncated
    ? "\n(NOTE: The resume text was truncated because it is very long. Analyze the provided portion only.)\n"
    : "";

  return `You are an expert career advisor and professional resume reviewer. Analyze ONLY the resume text provided below.

Rules:
- Analyze ONLY the resume content that is provided. Never invent experience, education, projects, skills, certifications or achievements that are not present.
- Base every recommendation only on skills and experience actually found in the resume.
- If a section is missing from the resume, use an empty array for list fields and "Not mentioned in resume" for that section's summary.
- Be specific, objective and constructive.
- Do NOT provide a numeric score, rating or ATS score in any field.
- Return ONLY valid JSON. No markdown, no code fences, no extra commentary, using exactly this structure:
{
  "summary": "string",
  "strengths": ["string"],
  "weaknesses": ["string"],
  "skills": { "technical": ["string"], "soft": ["string"] },
  "experience": { "summary": "string", "observations": ["string"] },
  "education": { "summary": "string", "observations": ["string"] },
  "projects": { "summary": "string", "observations": ["string"] },
  "certifications": ["string"],
  "improvementSuggestions": ["string"],
  "recommendedRoles": ["string"]
}${note}

RESUME TEXT:
--- START ---
${resumeText}
--- END ---`;
};

const buildJobDescriptionPrompt = (description, title, company, truncated) => {
  const note = truncated
    ? "\n(NOTE: The job description was truncated because it is very long. Analyze the provided portion only.)\n"
    : "";

  return `You are an expert technical recruiter and job analyst. Analyze ONLY the job description provided below.

Context (may be empty; never invent details when not provided):
- Job title: ${title || "Not specified"}
- Company: ${company || "Not specified"}

Rules:
- Extract information ONLY from the supplied job description. Never invent requirements, skills, responsibilities, education, certifications or locations.
- Separate required skills from preferred skills based on wording (e.g., "must have", "required" = required; "nice to have", "preferred", "a plus", "would be great" = preferred).
- Identify programming languages, frameworks, databases, tools and cloud technologies accurately.
- Extract experience requirements in years; use null when not specified.
- Extract job type (full-time, part-time, contract, internship, etc.) and location only if mentioned; otherwise use "".
- If a field is not mentioned, use [] for list fields, null for number fields, and "" for string fields. Never fill with guesses.
- Return ONLY valid JSON. No markdown, no code fences, no commentary, using exactly this structure:
{
  "jobTitle": "",
  "company": "",
  "experience": { "minimumYears": null, "maximumYears": null, "description": "" },
  "education": [],
  "requiredSkills": [],
  "preferredSkills": [],
  "programmingLanguages": [],
  "frameworks": [],
  "databases": [],
  "tools": [],
  "cloudTechnologies": [],
  "softSkills": [],
  "responsibilities": [],
  "certifications": [],
  "keywords": [],
  "technologies": [],
  "jobType": "",
  "location": "",
  "summary": ""
}${note}

JOB DESCRIPTION:
--- START ---
${description}
--- END ---`;
};

const asNullableNumber = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

const normalizeJobAnalysis = (raw) => {
  const source = raw && typeof raw === "object" ? raw : {};
  const experience =
    source.experience && typeof source.experience === "object"
      ? source.experience
      : {};
  return {
    jobTitle: asString(source.jobTitle),
    company: asString(source.company),
    experience: {
      minimumYears: asNullableNumber(experience.minimumYears),
      maximumYears: asNullableNumber(experience.maximumYears),
      description: asString(experience.description),
    },
    education: asStringArray(source.education),
    requiredSkills: asStringArray(source.requiredSkills),
    preferredSkills: asStringArray(source.preferredSkills),
    programmingLanguages: asStringArray(source.programmingLanguages),
    frameworks: asStringArray(source.frameworks),
    databases: asStringArray(source.databases),
    tools: asStringArray(source.tools),
    cloudTechnologies: asStringArray(source.cloudTechnologies),
    softSkills: asStringArray(source.softSkills),
    responsibilities: asStringArray(source.responsibilities),
    certifications: asStringArray(source.certifications),
    keywords: asStringArray(source.keywords),
    technologies: asStringArray(source.technologies),
    jobType: asString(source.jobType),
    location: asString(source.location),
    summary: asString(source.summary),
  };
};

const parseJsonResponse = (text) => {
  if (!text) return null;

  let cleaned = text.trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, "");
  cleaned = cleaned.replace(/\s*```$/, "");

  try {
    return JSON.parse(cleaned);
  } catch {
    // fall through to block extraction
  }

  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start !== -1 && end > start) {
    try {
      return JSON.parse(cleaned.slice(start, end + 1));
    } catch {
      return null;
    }
  }

  return null;
};

const asString = (value) =>
  typeof value === "string" ? value.trim() : "";

const asStringArray = (value) => {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item) => typeof item === "string" || typeof item === "number")
    .map((item) => String(item).trim())
    .filter(Boolean);
};

const normalizeAnalysis = (raw) => {
  const source = raw && typeof raw === "object" ? raw : {};
  return {
    summary: asString(source.summary),
    strengths: asStringArray(source.strengths),
    weaknesses: asStringArray(source.weaknesses),
    skills: {
      technical: asStringArray(source.skills && source.skills.technical),
      soft: asStringArray(source.skills && source.skills.soft),
    },
    experience: {
      summary: asString(source.experience && source.experience.summary),
      observations: asStringArray(
        source.experience && source.experience.observations
      ),
    },
    education: {
      summary: asString(source.education && source.education.summary),
      observations: asStringArray(
        source.education && source.education.observations
      ),
    },
    projects: {
      summary: asString(source.projects && source.projects.summary),
      observations: asStringArray(
        source.projects && source.projects.observations
      ),
    },
    certifications: asStringArray(source.certifications),
    improvementSuggestions: asStringArray(source.improvementSuggestions),
    recommendedRoles: asStringArray(source.recommendedRoles),
  };
};

const extractResponseText = (response) => {
  if (response && typeof response.text === "string") return response.text;

  const parts =
    response &&
    response.candidates &&
    response.candidates[0] &&
    response.candidates[0].content &&
    response.candidates[0].content.parts;

  if (Array.isArray(parts)) {
    const joined = parts
      .map((part) => (part && part.text ? part.text : ""))
      .join("");
    if (joined) return joined;
  }

  return null;
};

const analyzeResume = async (resumeText) => {
  if (!isConfigured()) {
    throw makeError(
      "AI analysis is not configured. Please set the Gemini API key in the backend environment.",
      500
    );
  }

  if (typeof resumeText !== "string" || !resumeText.trim()) {
    throw makeError("No resume text available to analyze.", 400);
  }

  const fullText = resumeText.trim();
  const truncated = fullText.length > MAX_TEXT_CHARS;
  const textToSend = truncated
    ? fullText.slice(0, MAX_TEXT_CHARS)
    : fullText;

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY.trim() });
  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;

  let response;
  try {
    response = await ai.models.generateContent({
      model,
      contents: buildAnalysisPrompt(textToSend, truncated),
      config: {
        responseMimeType: "application/json",
        temperature: 0.3,
      },
    });
  } catch (error) {
    console.error("Gemini request failed:", error.message);
    throw makeError(
      "The AI service could not process the resume right now. Please try again.",
      502
    );
  }

  const responseText = extractResponseText(response);
  if (!responseText) {
    console.error("Gemini returned an empty response.");
    throw makeError(
      "The AI service returned an empty response. Please try again.",
      502
    );
  }

  const parsed = parseJsonResponse(responseText);
  if (!parsed) {
    console.error("Gemini returned an invalid JSON response.");
    throw makeError(
      "The AI service returned an unreadable response. Please try again.",
      502
    );
  }

  return normalizeJobAnalysis(parsed);
};

const analyzeJobDescription = async (description, title = "", company = "") => {
  if (!isConfigured()) {
    throw makeError(
      "AI analysis is not configured. Please set the Gemini API key in the backend environment.",
      500
    );
  }

  if (typeof description !== "string" || !description.trim()) {
    throw makeError("No job description provided.", 400);
  }

  const fullText = description.trim();
  const truncated = fullText.length > MAX_JD_CHARS;
  const textToSend = truncated ? fullText.slice(0, MAX_JD_CHARS) : fullText;

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY.trim() });
  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;

  let response;
  try {
    response = await ai.models.generateContent({
      model,
      contents: buildJobDescriptionPrompt(
        textToSend,
        title.trim(),
        company.trim(),
        truncated
      ),
      config: {
        responseMimeType: "application/json",
        temperature: 0.3,
      },
    });
  } catch (error) {
    console.error("Gemini request failed:", error.message);
    throw makeError(
      "The AI service could not process the job description right now. Please try again.",
      502
    );
  }

  const responseText = extractResponseText(response);
  if (!responseText) {
    console.error("Gemini returned an empty response.");
    throw makeError(
      "The AI service returned an empty response. Please try again.",
      502
    );
  }

  const parsed = parseJsonResponse(responseText);
  if (!parsed) {
    console.error("Gemini returned an invalid JSON response.");
    throw makeError(
      "The AI service returned an unreadable response. Please try again.",
      502
    );
  }

  return normalizeJobAnalysis(parsed);
};

const MAX_MATCH_TEXT_CHARS = 20000;

const buildMatchPrompt = (resumeData, jdData, truncated) => {
  const note = truncated
    ? "\n(NOTE: The resume text was truncated because it is very long. Compare the provided portion only.)\n"
    : "";

  const resumePayload = JSON.stringify(
    {
      resumeFileName: resumeData.fileName || "",
      summary: resumeData.summary || "",
      technicalSkills: resumeData.technicalSkills || [],
      softSkills: resumeData.softSkills || [],
      experienceSummary: resumeData.experienceSummary || "",
      educationSummary: resumeData.educationSummary || "",
      projectSummary: resumeData.projectSummary || "",
      certifications: resumeData.certifications || [],
      extractedTextPreview: resumeData.text || "",
    },
    null,
    2
  );

  const jdPayload = JSON.stringify(jdData || {}, null, 2);

  return `You are an expert technical recruiter comparing a candidate's resume with a job description.

Rules:
- Compare ONLY the supplied information. Never invent skills, experience, education, projects or achievements that are not present in the resume.
- Never assume a missing skill exists anywhere in the resume. If a skill is not clearly present in the resume, treat it as missing.
- Distinguish required skills from preferred skills. A missing required skill matters more than a missing preferred skill.
- Reserve high "semanticScore" for a genuinely strong overall fit. Be objective; do not inflate scores.
- Use the enum values exactly: experienceStatus must be one of "strong", "partial", "gap". educationStatus must be one of "match", "partial", "no_match", "not_specified".
- "recommendations" must be actionable and honest. If a skill is missing, phrase advice as gaining experience/learning it (e.g. "Consider learning or gaining hands-on experience with X"). Never recommend adding a skill as if the candidate already knows it.
- Keep feedback lists concise (1 to 4 short items each).
- Return ONLY valid JSON. No markdown, no code fences, no extra commentary, using exactly this structure:
{
  "semanticScore": 75,
  "message": "",
  "additionalMatchedSkills": [],
  "skillsNotes": [],
  "experienceStatus": "strong",
  "experienceFeedback": [],
  "educationStatus": "match",
  "educationFeedback": [],
  "overallFeedback": [],
  "recommendations": []
}

HERE IS THE RESUME (structured):
${resumePayload}${note}

HERE IS THE JOB DESCRIPTION ANALYSIS (structured):
${jdPayload}`;
};

const normalizeMatchAnalysis = (raw) => {
  const source = raw && typeof raw === "object" ? raw : {};

  let semanticScore = asNullableNumber(source.semanticScore);
  if (semanticScore === null) semanticScore = null;
  else semanticScore = Math.round(Math.min(Math.max(semanticScore, 0), 100));

  let experienceStatus = asString(source.experienceStatus);
  if (!["strong", "partial", "gap"].includes(experienceStatus)) {
    experienceStatus = "partial";
  }

  let educationStatus = asString(source.educationStatus);
  if (
    !["match", "partial", "no_match", "not_specified"].includes(
      educationStatus
    )
  ) {
    educationStatus = "not_specified";
  }

  return {
    semanticScore,
    message: asString(source.message),
    additionalMatchedSkills: asStringArray(source.additionalMatchedSkills),
    skillsNotes: asStringArray(source.skillsNotes),
    experienceStatus,
    experienceFeedback: asStringArray(source.experienceFeedback),
    educationStatus,
    educationFeedback: asStringArray(source.educationFeedback),
    overallFeedback: asStringArray(source.overallFeedback),
    recommendations: asStringArray(source.recommendations),
  };
};

const matchResumeWithJobDescription = async (resumeData, jobDescriptionData) => {
  if (!isConfigured()) {
    return { skipped: false, result: null };
  }

  const fullText =
    resumeData && typeof resumeData.text === "string" ? resumeData.text.trim() : "";
  if (!fullText && !resumeData) {
    return { skipped: false, result: null };
  }

  const truncated = fullText.length > MAX_MATCH_TEXT_CHARS;
  const textToSend = truncated
    ? fullText.slice(0, MAX_MATCH_TEXT_CHARS)
    : fullText;

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY.trim() });
  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;

  let response;
  try {
    response = await ai.models.generateContent({
      model,
      contents: buildMatchPrompt(
        { ...resumeData, text: textToSend },
        jobDescriptionData || {},
        truncated
      ),
      config: {
        responseMimeType: "application/json",
        temperature: 0.3,
      },
    });
  } catch (error) {
    console.error("Gemini match request failed:", error.message);
    throw makeError(
      "The AI service could not compare the resume with the job description right now. Please try again.",
      502
    );
  }

  const responseText = extractResponseText(response);
  if (!responseText) {
    console.error("Gemini returned an empty match response.");
    throw makeError(
      "The AI service returned an empty response. Please try again.",
      502
    );
  }

  const parsed = parseJsonResponse(responseText);
  if (!parsed) {
    console.error("Gemini returned an invalid match JSON response.");
    throw makeError(
      "The AI service returned an unreadable response. Please try again.",
      502
    );
  }

  return { skipped: false, result: normalizeMatchAnalysis(parsed) };
};

const MAX_GAP_TEXT_CHARS = 20000;

const buildSkillGapPrompt = (matchData, resumeData, jdData, truncated) => {
  const note = truncated
    ? "\n(NOTE: The resume text was truncated because it is very long. Base your reasoning on the provided portion only.)\n"
    : "";

  const matchPayload = JSON.stringify(matchData || {}, null, 2);
  const resumePayload = JSON.stringify(resumeData || {}, null, 2);
  const jdPayload = JSON.stringify(jdData || {}, null, 2);

  return `You are an expert career advisor building a skill gap analysis for a candidate.

Rules (strictly enforced):
- The candidate's existing skills are ONLY the items listed under "ALREADY DEMONSTRATED". Never claim the candidate knows anything else.
- The only gaps you may reference are the items listed under "MISSING SKILLS TO ANALYZE", "MISSING TECHNOLOGIES TO ANALYZE" and "MISSING KEYWORDS TO ANALYZE". Never invent, add or rename any skill, technology or keyword.
- Assign priority exactly as HIGH, MEDIUM or LOW, based on relevance to the job description:
  * HIGH: explicitly required by the job description, or a core technology for the role.
  * MEDIUM: preferred skill, supporting technology, or an important but non-core keyword.
  * LOW: nice-to-have or secondary keyword.
- For every gap, write one short, specific reason that references the job description (e.g. "Listed as a required skill in the job description" or "Supporting technology commonly used with <X>").
- Recommendations must be practical learning steps. Frame every missing item as learning or gaining experience with it (e.g. "Start a small project using PostgreSQL to practice relational schema design"). Never recommend adding a missing skill to the resume as if the candidate already has it.
- Return ONLY valid JSON. No markdown, no code fences, no extra commentary, using exactly this structure:
{
  "strengths": [],
  "missingSkills": [ { "name": "", "priority": "HIGH", "reason": "" } ],
  "missingTechnologies": [ { "name": "", "priority": "HIGH", "reason": "" } ],
  "missingKeywords": [ { "name": "", "priority": "MEDIUM", "reason": "" } ],
  "recommendations": [ { "type": "SKILL", "title": "", "description": "" } ],
  "overallSummary": ""
}
Use "type" from: SKILL, TECHNOLOGY, KEYWORD, EXPERIENCE, EDUCATION, GENERAL.${note}

MATCH RESULTS (primary source):
${matchPayload}

ALREADY DEMONSTRATED:
${resumePayload}

JOB DESCRIPTION ANALYSIS:
${jdPayload}`;
};

const asPriority = (value) => {
  const v = asString(value).toUpperCase();
  return ["HIGH", "MEDIUM", "LOW"].includes(v) ? v : "MEDIUM";
};

const asRecommendation = (item) => {
  if (!item || typeof item !== "object") return null;
  const type = asString(item.type).toUpperCase();
  const validTypes = [
    "SKILL",
    "TECHNOLOGY",
    "KEYWORD",
    "EXPERIENCE",
    "EDUCATION",
    "GENERAL",
  ];
  const title = asString(item.title);
  const description = asString(item.description);
  if (!title && !description) return null;
  return {
    type: validTypes.includes(type) ? type : "GENERAL",
    title: title || description.slice(0, 90),
    description,
  };
};

// Keep only gap items whose names already exist in the deterministic missing lists.
const filterKnownGapItems = (items, knownNames) => {
  if (!Array.isArray(items)) return [];
  const seen = new Set();
  const result = [];
  for (const item of items) {
    if (!item || typeof item !== "object") continue;
    const name = asString(item.name);
    if (!name) continue;
    const key = name.toLowerCase().replace(/[\s.]/g, "");
    if (seen.has(key)) continue;
    if (!knownNames.has(key)) continue;
    seen.add(key);
    result.push({
      name,
      priority: asPriority(item.priority),
      reason: asString(item.reason),
    });
  }
  return result;
};

const normalizeSkillGapAnalysis = (raw, knownNames) => {
  const source = raw && typeof raw === "object" ? raw : {};

  return {
    strengths: asStringArray(source.strengths),
    missingSkills: filterKnownGapItems(source.missingSkills, knownNames),
    missingTechnologies: filterKnownGapItems(
      source.missingTechnologies,
      knownNames
    ),
    missingKeywords: filterKnownGapItems(source.missingKeywords, knownNames),
    recommendations: (Array.isArray(source.recommendations)
      ? source.recommendations.map(asRecommendation).filter(Boolean)
      : []
    ).slice(0, 12),
    overallSummary: asString(source.overallSummary),
  };
};

// @desc    Analyze the gap between an existing resume-JD match.
// @return  { skipped: boolean, result: object|null } — never throws for config.
const analyzeSkillGap = async (matchData, resumeData, jdData, knownNames) => {
  if (!isConfigured()) {
    return { skipped: false, result: null };
  }

  const names = new Set();
  for (const group of [
    matchData && matchData.missingSkills,
    matchData && matchData.missingTechnologies,
    matchData && matchData.missingKeywords,
  ]) {
    if (Array.isArray(group)) {
      for (const item of group) {
        names.add(String(item || "").toLowerCase().replace(/[\s.]/g, ""));
      }
    }
  }
  if (names.size === 0) {
    return { skipped: false, result: null };
  }

  const fullText =
    resumeData && typeof resumeData.text === "string"
      ? resumeData.text.trim()
      : "";
  const truncated = fullText.length > MAX_GAP_TEXT_CHARS;
  const textToSend = truncated
    ? fullText.slice(0, MAX_GAP_TEXT_CHARS)
    : fullText;

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY.trim() });
  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;

  let response;
  try {
    response = await ai.models.generateContent({
      model,
      contents: buildSkillGapPrompt(
        matchData,
        { ...resumeData, text: textToSend },
        jdData,
        truncated
      ),
      config: {
        responseMimeType: "application/json",
        temperature: 0.3,
      },
    });
  } catch (error) {
    console.error("Gemini skill gap request failed:", error.message);
    throw makeError(
      "The AI service could not analyze the skill gap right now. Please try again later.",
      502
    );
  }

  const responseText = extractResponseText(response);
  if (!responseText) {
    console.error("Gemini returned an empty skill gap response.");
    throw makeError(
      "The AI service returned an empty response. Please try again.",
      502
    );
  }

  const parsed = parseJsonResponse(responseText);
  if (!parsed) {
    console.error("Gemini returned an invalid skill gap JSON response.");
    throw makeError(
      "The AI service returned an unreadable response. Please try again.",
      502
    );
  }

  return {
    skipped: false,
    result: normalizeSkillGapAnalysis(parsed, names),
  };
};

const MAX_QUESTION_TEXT_CHARS = 12000;

const buildInterviewQuestionsPrompt = (
  resumeData,
  jdData,
  matchData,
  gapData,
  options
) => {
  const targetRole = options.targetRole || "";
  const difficulty = options.difficulty || "MEDIUM";
  const count = options.questionCount || 15;

  const resumePayload = JSON.stringify(resumeData || {}, null, 2);
  const jdPayload = JSON.stringify(jdData || {}, null, 2);
  const matchPayload = JSON.stringify(matchData || {}, null, 2);
  const gapPayload = JSON.stringify(gapData || {}, null, 2);

  return `You are an expert technical interviewer preparing a fresher for a job interview. Build a personalized interview question set from the ACTUAL candidate and job data provided below.

Rules (strictly enforced):
- Use ONLY the real information supplied: the candidate's resume analysis, matched skills, projects, job description requirements, and (if present) skill gap data. Never invent companies, work experience, certifications, projects, achievements or tools the candidate has not demonstrated.
- The candidate is a FRESHER. Write questions at a fresher-appropriate level for the selected difficulty:
  * EASY: fundamentals and definitions.
  * MEDIUM: practical application and debugging.
  * HARD: deeper architecture, tradeoffs and edge cases.
- Assign every question exactly one category from: TECHNICAL, CODING, PROJECT, RESUME, BEHAVIORAL, JOB_SPECIFIC, SKILL_GAP.
- PROJECT and RESUME questions must reference only projects/skills that actually appear in the resume data. Never ask "walk me through your X" for something absent from the resume.
- For skills/technologies that the match analysis marks as MISSING (or that appear in the skill gap data), ask them as SKILL_GAP preparation questions phrased as general knowledge, e.g. "How would you design a relational database schema in PostgreSQL for an e-commerce application?" Never imply the candidate already used them (no "you have implemented PostgreSQL").
- JOB_SPECIFIC questions must reference the actual job description responsibilities and technologies.
- Avoid duplicate questions.
- Keep expectedTopics to 1-4 short topic names.
- whyAsked must be one short, specific sentence explaining why this question matters for THIS role.
- Generate exactly ${count} questions when possible. Target roughly this balance for ${count} questions when data supports it: TECHNICAL 4, CODING 2, PROJECT 3, RESUME 2, BEHAVIORAL 2, JOB_SPECIFIC 1, SKILL_GAP 1 (adjust counts proportionally; skip categories that have no relevant data).
- Return ONLY valid JSON. No markdown, no code fences, no extra commentary, using exactly this structure:
{
  "targetRole": "${targetRole}",
  "questions": [
    {
      "question": "",
      "category": "TECHNICAL",
      "difficulty": "MEDIUM",
      "expectedTopics": [],
      "whyAsked": ""
    }
  ]
}

CANDIDATE RESUME (structured, based on real resume analysis):
${resumePayload}

JOB DESCRIPTION ANALYSIS (structured):
${jdPayload}

RESUME-JOB MATCH RESULTS (structured):
${matchPayload}

SKILL GAP DATA (may be empty):
${gapPayload}`;
};

const asQuestionCategory = (value) => {
  const v = asString(value).toUpperCase();
  return [
    "TECHNICAL",
    "CODING",
    "PROJECT",
    "RESUME",
    "BEHAVIORAL",
    "JOB_SPECIFIC",
    "SKILL_GAP",
  ].includes(v)
    ? v
    : null;
};

const asQuestionDifficulty = (value) => {
  const v = asString(value).toUpperCase();
  return ["EASY", "MEDIUM", "HARD"].includes(v) ? v : "MEDIUM";
};

const normalizeInterviewQuestions = (raw, options) => {
  const source = raw && typeof raw === "object" ? raw : {};
  const targetRole = asString(source.targetRole);
  const questions = [];
  const seen = new Set();

  const list = Array.isArray(source.questions) ? source.questions : [];
  for (const item of list) {
    if (!item || typeof item !== "object") continue;
    const question = asString(item.question);
    const category = asQuestionCategory(item.category);
    if (!question || !category) continue;
    const key = question.toLowerCase().replace(/\s+/g, " ");
    if (seen.has(key)) continue;
    seen.add(key);
    questions.push({
      question,
      category,
      difficulty: asQuestionDifficulty(item.difficulty),
      expectedTopics: asStringArray(item.expectedTopics),
      whyAsked: asString(item.whyAsked),
    });
    if (questions.length >= options.questionCount) break;
  }

  return {
    targetRole,
    questions,
    totalQuestions: questions.length,
  };
};

// @desc    Generate a personalized set of interview questions with Gemini.
// @return  { skipped: boolean, result: object|null } — skipped when unconfigured.
const generateInterviewQuestions = async (
  resumeData,
  jdData,
  matchData,
  gapData,
  options
) => {
  if (!isConfigured()) {
    return { skipped: false, result: null };
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY.trim() });
  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;

  let response;
  try {
    response = await ai.models.generateContent({
      model,
      contents: buildInterviewQuestionsPrompt(
        resumeData,
        jdData,
        matchData,
        gapData,
        options
      ),
      config: {
        responseMimeType: "application/json",
        temperature: 0.5,
      },
    });
  } catch (error) {
    console.error("Gemini interview questions request failed:", error.message);
    throw makeError(
      "The AI service could not generate interview questions right now. Please try again later.",
      502
    );
  }

  const responseText = extractResponseText(response);
  if (!responseText) {
    console.error("Gemini returned an empty interview questions response.");
    throw makeError(
      "The AI service returned an empty response. Please try again.",
      502
    );
  }

  const parsed = parseJsonResponse(responseText);
  if (!parsed) {
    console.error("Gemini returned an invalid interview questions JSON response.");
    throw makeError(
      "The AI service returned an unreadable response. Please try again.",
      502
    );
  }

  return {
    skipped: false,
    result: normalizeInterviewQuestions(parsed, options),
  };
};

const MAX_EVAL_ANSWER_CHARS = 4000;

const cleanForPrompt = (value) => {
  const text = asString(value);
  return text.length > MAX_EVAL_ANSWER_CHARS
    ? `${text.slice(0, MAX_EVAL_ANSWER_CHARS)}...`
    : text;
};

const buildEvaluationPrompt = (data) => {
  const items = Array.isArray(data.items) ? data.items : [];
  const payload = items.map((item) => ({
    question: cleanForPrompt(item.question),
    category: item.category || "",
    difficulty: item.difficulty || "",
    expectedTopics: asStringArray(item.expectedTopics),
    whyAsked: cleanForPrompt(item.whyAsked),
    answer: cleanForPrompt(item.answer),
  }));

  const jobContext = {
    jobTitle: asString(data.jobTitle),
    company: asString(data.company),
    technologies: asStringArray(data.technologies).slice(0, 20),
    responsibilities: asStringArray(data.responsibilities).slice(0, 12),
    keywords: asStringArray(data.keywords).slice(0, 15),
  };

  return `You are an expert interviewer assessing a fresher's written answers in a mock interview.

Evaluate ONLY the submitted answers against the question, its category, expected topics and the job context. Follow these rules strictly:
- Never invent facts. Do NOT claim the candidate said something they did not write.
- Do NOT assess intelligence, mental health, personality traits, physical characteristics, or protected characteristics. Assess answer quality and alignment with the question only.
- If an answer is incomplete or missing concepts, point out which expected concepts were not demonstrated. Never say things like "You have no knowledge of X". Prefer phrasing like "The answer did not demonstrate the expected React concepts."
- For TECHNICAL and CODING questions, weight correctness, reasoning and completeness of the explanation.
- For BEHAVIORAL questions, weight clarity, structure, relevance to the question, use of a concrete example, and communication.
- For PROJECT questions, weight understanding of the actual project, architecture, technologies and implementation reasoning.
- For other categories, weight relevance, clarity and coverage of expected topics.
- Score each question 0-100 (integer) and provide concise strengths, weaknesses, feedback and suggested answer points.
- Provide an overall 0-100 integer score plus technical, communication and relevance sub-scores (0-100 integers).
- Provide a short overall summary, overall strengths, overall weaknesses, recommendations, and recommendedTopics.
- Return ONLY valid JSON. No markdown, no code fences, no extra commentary, using exactly this structure:
{
  "overallScore": 78,
  "technicalScore": 80,
  "communicationScore": 75,
  "relevanceScore": 82,
  "summary": "",
  "strengths": [],
  "weaknesses": [],
  "recommendations": [],
  "recommendedTopics": [],
  "questionEvaluations": [
    {
      "questionIndex": 0,
      "score": 80,
      "strengths": [],
      "weaknesses": [],
      "feedback": "",
      "suggestedAnswerPoints": []
    }
  ]
}

TARGET ROLE: ${asString(data.targetRole) || "Not specified"}
JOB CONTEXT:
${JSON.stringify(jobContext, null, 2)}

QUESTIONS AND ANSWERS:
${JSON.stringify(payload, null, 2)}`;
};

const normalizeEvaluation = (raw, count) => {
  const source = raw && typeof raw === "object" ? raw : {};

  const clampScore = (value) => {
    const num = Math.round(Number(value));
    if (!Number.isFinite(num)) return null;
    return Math.max(0, Math.min(100, num));
  };

  const overallScore = clampScore(source.overallScore);
  const questionEvaluations = [];
  const rawList = Array.isArray(source.questionEvaluations)
    ? source.questionEvaluations
    : [];

  for (let i = 0; i < count; i += 1) {
    const found = rawList.find(
      (item) => Math.round(Number(item && item.questionIndex)) === i
    );
    questionEvaluations.push({
      questionIndex: i,
      score: clampScore(found && found.score),
      strengths: asStringArray(found && found.strengths),
      weaknesses: asStringArray(found && found.weaknesses),
      feedback: asString(found && found.feedback),
      suggestedAnswerPoints: asStringArray(found && found.suggestedAnswerPoints),
    });
  }

  return {
    overallScore,
    technicalScore: clampScore(source.technicalScore),
    communicationScore: clampScore(source.communicationScore),
    relevanceScore: clampScore(source.relevanceScore),
    summary: asString(source.summary),
    strengths: asStringArray(source.strengths),
    weaknesses: asStringArray(source.weaknesses),
    recommendations: asStringArray(source.recommendations),
    recommendedTopics: asStringArray(source.recommendedTopics),
    questionEvaluations,
  };
};

// @desc    Evaluate a completed mock interview with Gemini.
// @return  { skipped: boolean, result: object|null } — skipped when unconfigured.
const evaluateMockInterview = async (data) => {
  if (!isConfigured()) {
    return { skipped: false, result: null };
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY.trim() });
  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;

  let response;
  try {
    response = await ai.models.generateContent({
      model,
      contents: buildEvaluationPrompt(data),
      config: {
        responseMimeType: "application/json",
        temperature: 0.3,
      },
    });
  } catch (error) {
    console.error("Gemini mock interview evaluation request failed:", error.message);
    throw makeError(
      "The AI service could not evaluate the interview right now. Please try again later.",
      502
    );
  }

  const responseText = extractResponseText(response);
  if (!responseText) {
    console.error("Gemini returned an empty mock interview evaluation response.");
    throw makeError(
      "The AI service returned an empty response. Please try again.",
      502
    );
  }

  const parsed = parseJsonResponse(responseText);
  if (!parsed) {
    console.error("Gemini returned an invalid mock interview evaluation JSON response.");
    throw makeError(
      "The AI service returned an unreadable response. Please try again.",
      502
    );
  }

  const count = Array.isArray(data.items) ? data.items.length : 0;
  return {
    skipped: false,
    result: normalizeEvaluation(parsed, count),
  };
};

const MAX_RESUME_BUILDER_CHARS = 25000;

const cleanResumeForPrompt = (text) => {
  const clean = asString(text);
  return clean.length > MAX_RESUME_BUILDER_CHARS
    ? `${clean.slice(0, MAX_RESUME_BUILDER_CHARS)}...`
    : clean;
};

const buildResumePrompt = (data) => {
  const resume = data.resume || {};
  const resumeAnalysis = resume.analysis || {};
  const jd = data.jd || null;
  const jdAnalysis = jd && jd.analysis ? jd.analysis : {};
  const match = data.match || null;
  const matchAnalysis = match && match.analysis ? match.analysis : {};
  const gap = data.skillGap || null;

  const context = {
    sourceResumeText: cleanResumeForPrompt(resume.extractedText),
    resumeAnalysis: {
      summary: asString(resumeAnalysis.summary),
      strengths: asStringArray(resumeAnalysis.strengths),
      skills: {
        technical: asStringArray(
          resumeAnalysis.skills && resumeAnalysis.skills.technical
        ),
        soft: asStringArray(resumeAnalysis.skills && resumeAnalysis.skills.soft),
      },
      experience: {
        summary: asString(
          resumeAnalysis.experience && resumeAnalysis.experience.summary
        ),
        observations: asStringArray(
          resumeAnalysis.experience && resumeAnalysis.experience.observations
        ),
      },
      education: {
        summary: asString(
          resumeAnalysis.education && resumeAnalysis.education.summary
        ),
        observations: asStringArray(
          resumeAnalysis.education && resumeAnalysis.education.observations
        ),
      },
      projects: {
        summary: asString(
          resumeAnalysis.projects && resumeAnalysis.projects.summary
        ),
        observations: asStringArray(
          resumeAnalysis.projects && resumeAnalysis.projects.observations
        ),
      },
      certifications: asStringArray(resumeAnalysis.certifications),
    },
    jobContext: jd
      ? {
          jobTitle:
            asString(jdAnalysis.jobTitle) ||
            asString(jdAnalysis.title) ||
            asString(jd.title) ||
            "",
          company: asString(jd.company),
          requiredSkills: asStringArray(jdAnalysis.requiredSkills),
          preferredSkills: asStringArray(jdAnalysis.preferredSkills),
          technologies: asStringArray(
            jdAnalysis.technologies ||
              jdAnalysis.programmingLanguages ||
              jdAnalysis.frameworks ||
              jdAnalysis.databases ||
              jdAnalysis.tools ||
              jdAnalysis.cloudTechnologies ||
              []
          ),
          keywords: asStringArray(
            jdAnalysis.keywords ||
              jdAnalysis.requiredSkills ||
              jdAnalysis.technologies ||
              []
          ),
          responsibilities: asStringArray(jdAnalysis.responsibilities),
        }
      : null,
    matchContext: match
      ? {
          matchPercentage:
            match.matchPercentage != null ? match.matchPercentage : null,
          matchedSkills: asStringArray(matchAnalysis.matchedSkills),
          semanticMatchedSkills: asStringArray(
            matchAnalysis.semanticMatchedSkills
          ),
          missingSkills: asStringArray(matchAnalysis.missingSkills),
          missingTechnologies: asStringArray(matchAnalysis.missingTechnologies),
          missingKeywords: asStringArray(matchAnalysis.missingKeywords),
        }
      : null,
    skillGapContext: gap
      ? {
          strengths: asStringArray(gap.strengths),
          missingSkills: (gap.missingSkills || []).map((g) => asString(g.name)),
          missingTechnologies: (gap.missingTechnologies || []).map((g) =>
            asString(g.name)
          ),
          missingKeywords: (gap.missingKeywords || []).map((g) =>
            asString(g.name)
          ),
        }
      : null,
    targetRole: asString(data.targetRole),
  };

  return `You are an expert ATS resume writer for a job seeker.

You will rewrite an EXISTING resume to be more ATS-friendly (parseable, keyword-rich, well-structured). You must NEVER fabricate information.

ABSOLUTE NO-FABRICATION RULES (critical):
- Never invent work experience, companies, job titles, projects, certifications, degrees, dates, skills, achievements, metrics, or responsibilities that do not appear in the source resume.
- Never create fake numbers, percentages, or metrics.
- Never add technologies, tools, or skills the source resume does not clearly demonstrate.
- Never change employment dates, company names, role/degree names.
- You may only: reword, reorganize, restructure, improve grammar and clarity, make existing content more concise, convert existing responsibilities into stronger bullet points, and prioritize/order existing relevant skills.
- If a fact is unclear, keep the original wording or omit it. Prefer honesty over embellishment.
- Only include sections that contain meaningful information. Skip empty sections.

ATS GUIDELINES:
- Use standard section names: Contact Information, Professional Summary, Technical Skills, Work Experience, Projects, Education, Certifications, Additional Information.
- Put contact details in "contact". Use bullet points for experience and projects.
- If the job description is provided, list the candidate's demonstrated skills that match the JD EARLIER in the skills list. Do NOT add JD-required skills the candidate has not demonstrated.
- "keywordsNotUsed" must list JD-relevant keywords that the source resume does NOT demonstrate. Never add those to skills/experience/projects/education.
- "optimizationNotes" should briefly explain what was reworded/reorganized (short strings).

Return ONLY valid JSON. No markdown, no code fences, no commentary, using exactly this structure:
{
  "targetRole": "",
  "content": {
    "contact": { "name": "", "email": "", "phone": "", "location": "", "linkedin": "", "github": "", "portfolio": "" },
    "summary": "",
    "skills": [ { "category": "", "items": [] } ],
    "experience": [ { "company": "", "role": "", "location": "", "startDate": "", "endDate": "", "bullets": [] } ],
    "projects": [ { "name": "", "technologies": [], "description": "", "bullets": [], "link": "" } ],
    "education": [ { "institution": "", "degree": "", "field": "", "location": "", "startDate": "", "endDate": "", "details": [] } ],
    "certifications": [ { "name": "", "issuer": "", "date": "", "link": "" } ],
    "additional": { "languages": [], "achievements": [], "interests": [] }
  },
  "atsMetadata": { "keywordsUsed": [], "keywordsNotUsed": [], "optimizationNotes": [] }
}

INPUT CONTEXT:
${JSON.stringify(context, null, 2)}`;
};

const normalizeOptimizedResume = (raw) => {
  const source = raw && typeof raw === "object" ? raw : {};
  const content = source.content && typeof source.content === "object" ? source.content : {};
  const contact = content.contact && typeof content.contact === "object" ? content.contact : {};
  const skills = Array.isArray(content.skills) ? content.skills : [];
  const experience = Array.isArray(content.experience) ? content.experience : [];
  const projects = Array.isArray(content.projects) ? content.projects : [];
  const education = Array.isArray(content.education) ? content.education : [];
  const certifications = Array.isArray(content.certifications) ? content.certifications : [];
  const additional = content.additional && typeof content.additional === "object" ? content.additional : {};
  const ats = source.atsMetadata && typeof source.atsMetadata === "object" ? source.atsMetadata : {};

  return {
    targetRole: asString(source.targetRole),
    content: {
      contact: {
        name: asString(contact.name),
        email: asString(contact.email),
        phone: asString(contact.phone),
        location: asString(contact.location),
        linkedin: asString(contact.linkedin),
        github: asString(contact.github),
        portfolio: asString(contact.portfolio),
      },
      summary: asString(content.summary),
      skills: skills
        .filter((s) => s && typeof s === "object")
        .map((s) => ({
          category: asString(s.category),
          items: asStringArray(s.items),
        }))
        .filter((s) => s.category || s.items.length),
      experience: experience
        .filter((e) => e && typeof e === "object")
        .map((e) => ({
          company: asString(e.company),
          role: asString(e.role),
          location: asString(e.location),
          startDate: asString(e.startDate),
          endDate: asString(e.endDate),
          bullets: asStringArray(e.bullets),
        }))
        .filter((e) => e.company || e.role || e.bullets.length),
      projects: projects
        .filter((p) => p && typeof p === "object")
        .map((p) => ({
          name: asString(p.name),
          technologies: asStringArray(p.technologies),
          description: asString(p.description),
          bullets: asStringArray(p.bullets),
          link: asString(p.link),
        }))
        .filter((p) => p.name || p.description || p.bullets.length),
      education: education
        .filter((e) => e && typeof e === "object")
        .map((e) => ({
          institution: asString(e.institution),
          degree: asString(e.degree),
          field: asString(e.field),
          location: asString(e.location),
          startDate: asString(e.startDate),
          endDate: asString(e.endDate),
          details: asStringArray(e.details),
        }))
        .filter((e) => e.institution || e.degree || e.details.length),
      certifications: certifications
        .filter((c) => c && typeof c === "object")
        .map((c) => ({
          name: asString(c.name),
          issuer: asString(c.issuer),
          date: asString(c.date),
          link: asString(c.link),
        }))
        .filter((c) => c.name),
      additional: {
        languages: asStringArray(additional.languages),
        achievements: asStringArray(additional.achievements),
        interests: asStringArray(additional.interests),
      },
    },
    atsMetadata: {
      keywordsUsed: asStringArray(ats.keywordsUsed),
      keywordsNotUsed: asStringArray(ats.keywordsNotUsed),
      optimizationNotes: asStringArray(ats.optimizationNotes),
    },
  };
};

// @desc    Generate an ATS-optimized resume draft, faithful to the source resume.
// @return  { skipped: boolean, result: object|null } — skipped when unconfigured.
const generateOptimizedResume = async (data) => {
  if (!isConfigured()) {
    return { skipped: false, result: null };
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY.trim() });
  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;

  let response;
  try {
    response = await ai.models.generateContent({
      model,
      contents: buildResumePrompt(data),
      config: {
        responseMimeType: "application/json",
        temperature: 0.3,
        maxOutputTokens: 8192,
      },
    });
  } catch (error) {
    console.error("Gemini resume generation request failed:", error.message);
    throw makeError(
      "The AI service could not generate the resume right now. Please try again.",
      502
    );
  }

  const responseText = extractResponseText(response);
  if (!responseText) {
    console.error("Gemini returned an empty resume generation response.");
    throw makeError(
      "The AI service returned an empty response. Please try again.",
      502
    );
  }

  const parsed = parseJsonResponse(responseText);
  if (!parsed) {
    console.error("Gemini returned an invalid resume generation JSON response.");
    throw makeError(
      "The AI service returned an unreadable response. Please try again.",
      502
    );
  }

  return { skipped: false, result: normalizeOptimizedResume(parsed) };
};

module.exports = {
  analyzeResume,
  analyzeJobDescription,
  matchResumeWithJobDescription,
  analyzeSkillGap,
  generateInterviewQuestions,
  evaluateMockInterview,
  generateOptimizedResume,
  isConfigured,
  parseJsonResponse,
};