const {
  evaluateMockInterview: geminiEvaluateMockInterview,
} = require("./geminiService");

const asString = (value) => (typeof value === "string" ? value.trim() : "");

const asStringArray = (value) =>
  Array.isArray(value)
    ? value
        .filter((item) => typeof item === "string" || typeof item === "number")
        .map((item) => String(item).trim())
        .filter(Boolean)
    : [];

const clampScore = (value) => {
  const num = Math.round(Number(value));
  if (!Number.isFinite(num)) return null;
  return Math.max(0, Math.min(100, num));
};

const normalizeName = (value) =>
  asString(value).toLowerCase().replace(/[\s-]/g, "");

const answerLengthFactor = (answer) => {
  const length = asString(answer).length;
  if (length === 0) return 0;
  if (length < 40) return 0.45;
  if (length < 120) return 0.65;
  if (length < 400) return 0.85;
  return 1;
};

const coverageFactor = (answer, expectedTopics) => {
  const text = normalizeName(answer);
  const topics = asStringArray(expectedTopics);
  if (topics.length === 0 || !text) return 0;
  const matched = topics.filter((topic) => {
    const norm = normalizeName(topic);
    return norm && text.includes(norm);
  });
  return Math.min(1, matched.length / topics.length);
};

const determinQuestionScore = (item) => {
  const answer = asString(item.answer);
  if (!answer) return 0;

  let score = 20;
  score += answerLengthFactor(answer) * 45;
  score += coverageFactor(answer, item.expectedTopics) * 25;

  const category = asString(item.category).toUpperCase();
  const hasCodeWord = /(function|const|let|=>|return|loop|array)/i.test(answer);
  if (category === "CODING" && hasCodeWord) {
    score = Math.min(100, score + 8);
  }
  if (
    category === "BEHAVIORAL" &&
    /(example|situation|team|I did|I built|project|internship)/i.test(answer)
  ) {
    score = Math.min(100, score + 8);
  }

  return clampScore(score);
};

// @desc  Deterministic fallback evaluation used when Gemini is unavailable.
const evaluateMockInterviewFallback = async (data) => {
  const items = Array.isArray(data.items) ? data.items : [];

  const questionEvaluations = items.map((item, index) => {
    const score = determinQuestionScore(item);
    const answer = asString(item.answer);
    const expectedTopics = asStringArray(item.expectedTopics);
    const strengths = [];
    const weaknesses = [];
    const feedback = [];
    const coverage = coverageFactor(answer, expectedTopics);

    if (!answer) {
      weaknesses.push("The question was not answered.");
      feedback.push("No answer was submitted for this question.");
    } else {
      if (answer.length < 40) {
        feedback.push("The answer is very brief. Expand it with concrete detail.");
      } else {
        strengths.push("The answer provides substantive content.");
      }
      if (expectedTopics.length && coverage < 0.5) {
        weaknesses.push(
          `The answer did not demonstrate the expected concepts (${expectedTopics.join(
            ", "
          )}).`
        );
      } else if (expectedTopics.length) {
        strengths.push("The answer covers the expected topics.");
      }
    }

    return {
      questionIndex: index,
      score,
      strengths: strengths.slice(0, 3),
      weaknesses: weaknesses.slice(0, 3),
      feedback: feedback.slice(0, 3).join(" "),
      suggestedAnswerPoints: expectedTopics.slice(0, 4),
    };
  });

  const scores = questionEvaluations
    .map((q) => q.score)
    .filter((s) => s != null);
  const average = scores.length
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    : 0;

  const overallScore = clampScore(average);
  const technicalScore = clampScore(overallScore);
  const weightedCount = items.filter(
    (item) => asString(item.answer).length >= 120
  ).length;
  const communicationScore = clampScore(
    overallScore + (weightedCount >= items.length / 2 ? 2 : 0)
  );
  const coveredCount = items.filter(
    (item) => coverageFactor(item, item.expectedTopics) >= 0.5
  ).length;
  const relevanceScore = clampScore(
    overallScore + (coveredCount >= items.length / 2 ? 3 : -2)
  );

  const missedTopics = [];
  items.forEach((item) => {
    const answer = asString(item.answer);
    if (!answer || coverageFactor(item, item.expectedTopics) < 0.5) {
      asStringArray(item.expectedTopics).forEach((t) => {
        if (!missedTopics.includes(t)) missedTopics.push(t);
      });
    }
  });

  return {
    overallScore,
    technicalScore,
    communicationScore,
    relevanceScore,
    summary:
      scores.length === 0
        ? "The interview was completed, but no answer contained enough content to score meaningfully."
        : `On average the answers scored ${overallScore}/100. Review the question-wise feedback and suggested answer points to prepare more thoroughly for the next attempt.`,
    strengths: scores.length
      ? ["All questions received a response."]
      : [],
    weaknesses: missedTopics.length
      ? [
          `The following topics were not demonstrated: ${missedTopics
            .slice(0, 5)
            .join(", ")}.`,
        ]
      : [],
    recommendations: [
      "Practice giving structured answers: claim, explanation, example and takeaway.",
      "Cover each expected topic explicitly in your answer.",
      "Use concrete examples from projects or internships where relevant.",
    ],
    recommendedTopics: missedTopics.slice(0, 6),
    questionEvaluations,
  };
};

// @desc  Evaluate a completed mock interview. Uses Gemini when available,
//        and a deterministic fallback when it is not to avoid losing the
//        completed interview.
const evaluateMockInterview = async (data) => {
  try {
    const geminiResult = await geminiEvaluateMockInterview(data);
    if (geminiResult && geminiResult.result) {
      return geminiResult.result;
    }
  } catch (error) {
    console.error("Gemini mock interview evaluation skipped/errored:", error.message);
  }
  return evaluateMockInterviewFallback(data);
};

module.exports = { evaluateMockInterview };