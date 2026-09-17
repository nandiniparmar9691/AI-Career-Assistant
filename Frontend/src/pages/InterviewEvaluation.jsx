import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowLeft,
  Award,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CircleDashed,
  Loader2,
  MessageSquareText,
  Sparkles,
  Target,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { getErrorMessage, getMockInterviewById } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { CATEGORY_LABELS } from '../constants/interviewCategories'
import { scoreLabel } from '../constants/scoreLabels'

const formatDate = (value) => {
  if (!value) return ''
  try {
    return new Date(value).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return ''
  }
}

const CATEGORY_STYLES = {
  TECHNICAL: 'bg-indigo-50 text-indigo-700',
  CODING: 'bg-violet-50 text-violet-700',
  PROJECT: 'bg-sky-50 text-sky-700',
  RESUME: 'bg-teal-50 text-teal-700',
  BEHAVIORAL: 'bg-orange-50 text-orange-700',
  JOB_SPECIFIC: 'bg-fuchsia-50 text-fuchsia-700',
  SKILL_GAP: 'bg-rose-50 text-rose-700',
}

const DIFFICULTY_STYLES = {
  EASY: 'bg-emerald-50 text-emerald-700',
  MEDIUM: 'bg-amber-50 text-amber-700',
  HARD: 'bg-red-50 text-red-700',
}

const SCORE_RING_COLORS = {
  40: 'text-red-600',
  60: 'text-orange-500',
  75: 'text-amber-500',
  90: 'text-emerald-600',
  101: 'text-slate-400',
}

const scoreColor = (score) => {
  const num = Number(score)
  if (!Number.isFinite(num) || num < 0) return SCORE_RING_COLORS[101]
  if (num < 40) return SCORE_RING_COLORS[40]
  if (num < 60) return SCORE_RING_COLORS[60]
  if (num < 75) return SCORE_RING_COLORS[75]
  return SCORE_RING_COLORS[90]
}

const EvaluationCard = ({ title, score, note }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <p className="text-sm font-medium text-slate-500">{title}</p>
    <div className={`mt-2 flex items-end gap-1.5 ${scoreColor(score)}`}>
      <span className="text-4xl font-bold">{Number(score) >= 0 ? score : '—'}</span>
      <span className="pb-1 text-sm font-medium text-slate-400">/ 100</span>
    </div>
    <p className="mt-1.5 text-xs font-semibold text-slate-600">{note}</p>
  </div>
)

const InterviewEvaluation = () => {
  const { id } = useParams()
  const { logout } = useAuth()

  const [interview, setInterview] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [expanded, setExpanded] = useState({})

  useEffect(() => {
    let active = true
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const { data } = await getMockInterviewById(id)
        if (!active) return
        setInterview(data.interview || null)
      } catch (err) {
        if (err.response?.status === 401) {
          await logout()
          return
        }
        if (active) setError(getErrorMessage(err))
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [id, logout])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-500">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <Link
          to="/mock-interview"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 transition hover:text-indigo-700"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Mock Interview
        </Link>
        <div className="mx-auto mt-4 flex h-11 w-11 items-center justify-center rounded-full bg-red-50">
          <AlertTriangle className="h-5 w-5 text-red-600" />
        </div>
        <p className="mt-3 text-sm text-red-600">{error}</p>
      </div>
    )
  }

  if (!interview) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <Link
          to="/mock-interview"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 transition hover:text-indigo-700"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Mock Interview
        </Link>
        <div className="mx-auto mt-4 flex h-11 w-11 items-center justify-center rounded-full bg-amber-50">
          <CircleDashed className="h-5 w-5 text-amber-600" />
        </div>
        <p className="mt-3 text-sm font-medium text-slate-700">Interview not found.</p>
      </div>
    )
  }

  if (interview.status !== 'COMPLETED') {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <Link
          to={`/mock-interview/${interview.id}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 transition hover:text-indigo-700"
        >
          <ArrowLeft className="h-4 w-4" /> Continue Interview
        </Link>
        <div className="mx-auto mt-4 flex h-11 w-11 items-center justify-center rounded-full bg-amber-50">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
        </div>
        <p className="mt-3 text-sm font-medium text-slate-700">
          This interview is still in progress.
        </p>
        <p className="mt-1 text-sm text-slate-500">
          Answer all questions and complete the interview to see your evaluation.
        </p>
      </div>
    )
  }

  const evalData = interview.evaluation || {}
  const overall = Number(evalData.overallScore)
  const hasScore = Number.isFinite(overall) && overall >= 0
  const answers = interview.answers || []

  const toggleQuestion = (index) => {
    setExpanded((prev) => ({ ...prev, [index]: !prev[index] }))
  }

  return (
    <div className="space-y-8">
      <div>
        <Link
          to="/mock-interview"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 transition hover:text-indigo-700"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Mock Interview
        </Link>
        <h1 className="mt-3 text-2xl font-bold text-slate-900 sm:text-3xl">Interview Evaluation</h1>
        <p className="mt-1.5 text-sm text-slate-500 sm:text-base">
          {interview.targetRole || interview.jobTitle || 'Mock interview'} ·{' '}
          {interview.difficulty} difficulty · Completed {formatDate(interview.completedAt)}
        </p>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2">
          <Award className="h-5 w-5 text-indigo-600" />
          <h2 className="text-lg font-semibold text-slate-900">Overall Evaluation</h2>
        </div>

        <div className="mt-5 rounded-2xl border border-slate-200 bg-gradient-to-br from-indigo-50 via-white to-white p-5 text-center">
          <p className="text-sm font-medium text-slate-500">Overall Score</p>
          <div className={`mt-2 flex items-end justify-center gap-1.5 ${scoreColor(overall)}`}>
            <span className="text-5xl font-extrabold">{hasScore ? overall : '—'}</span>
            <span className="pb-1.5 text-sm font-medium text-slate-400">/ 100</span>
          </div>
          <span
            className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-bold ${
              hasScore ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-500'
            }`}
          >
            {hasScore ? scoreLabel(overall) : 'Not Available'}
          </span>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <EvaluationCard
            title="Technical Score"
            score={evalData.technicalScore}
            note="Depth and accuracy of technical content."
          />
          <EvaluationCard
            title="Communication Score"
            score={evalData.communicationScore}
            note="Clarity, structure and explanation."
          />
          <EvaluationCard
            title="Relevance Score"
            score={evalData.relevanceScore}
            note="Alignment with the target role."
          />
        </div>

        {evalData.summary && (
          <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-sm font-semibold text-slate-900">Summary</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-700">{evalData.summary}</p>
          </div>
        )}

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <h3 className="flex items-center gap-1.5 text-sm font-semibold text-emerald-800">
              <CheckCircle2 className="h-4 w-4" /> Strengths
            </h3>
            {evalData.strengths && evalData.strengths.length > 0 ? (
              <ul className="mt-2 space-y-1.5">
                {evalData.strengths.map((point, i) => (
                  <li
                    key={i}
                    className="flex gap-2 text-sm leading-relaxed text-emerald-900"
                  >
                    <span className="mt-0.5 shrink-0">•</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-emerald-800">None noted.</p>
            )}
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <h3 className="flex items-center gap-1.5 text-sm font-semibold text-amber-800">
              <AlertTriangle className="h-4 w-4" /> Areas to Improve
            </h3>
            {evalData.weaknesses && evalData.weaknesses.length > 0 ? (
              <ul className="mt-2 space-y-1.5">
                {evalData.weaknesses.map((point, i) => (
                  <li key={i} className="flex gap-2 text-sm leading-relaxed text-amber-900">
                    <span className="mt-0.5 shrink-0">•</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-amber-800">None noted.</p>
            )}
          </div>
          <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4">
            <h3 className="flex items-center gap-1.5 text-sm font-semibold text-indigo-800">
              <Target className="h-4 w-4" /> Recommendations
            </h3>
            {evalData.recommendations && evalData.recommendations.length > 0 ? (
              <ul className="mt-2 space-y-1.5">
                {evalData.recommendations.map((point, i) => (
                  <li key={i} className="flex gap-2 text-sm leading-relaxed text-indigo-900">
                    <span className="mt-0.5 shrink-0">•</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-indigo-800">None noted.</p>
            )}
          </div>
        </div>

        {evalData.recommendedTopics && evalData.recommendedTopics.length > 0 && (
          <div className="mt-5 flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-50">
              <BookOpen className="h-4 w-4 text-violet-600" />
            </div>
            <div>
              <h3 className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                <Sparkles className="h-4 w-4 text-violet-600" /> Recommended Topics to Practice
              </h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {evalData.recommendedTopics.map((topic, i) => (
                  <span
                    key={i}
                    className="rounded-full border border-violet-200 bg-white px-3 py-1 text-xs font-medium text-violet-700"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-4">
          <MessageSquareText className="h-5 w-5 text-indigo-600" />
          <h2 className="font-semibold text-slate-900">Question-by-Question Feedback</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {answers.length === 0 && (
            <div className="px-5 py-8 text-center text-sm text-slate-500">
              No answers recorded for this interview.
            </div>
          )}
          {answers.map((answer, index) => {
            const qEval = (evalData.questionEvaluations || []).find(
              (qe) => Number(qe.questionIndex) === index
            )
            const isOpen = Boolean(expanded[index])
            const qScore = qEval ? Number(qEval.score) : null
            const hasQScore = qScore !== null && Number.isFinite(qScore)
            return (
              <div key={index} className="px-5 py-4">
                <button
                  type="button"
                  onClick={() => toggleQuestion(index)}
                  className="flex w-full items-start gap-3 text-left"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-sm font-bold text-slate-600">
                    {index + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          CATEGORY_STYLES[answer.category] || 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {CATEGORY_LABELS[answer.category] || answer.category}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          DIFFICULTY_STYLES[answer.difficulty] || 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {answer.difficulty}
                      </span>
                      {hasQScore && (
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${scoreColor(
                            qScore
                          )} bg-white`}
                        >
                          {qScore} / 100
                        </span>
                      )}
                    </div>
                    <p className="mt-1.5 text-sm font-medium leading-relaxed text-slate-900">
                      {answer.question}
                    </p>
                  </div>
                  <span className="mt-1 shrink-0 text-slate-400">
                    {isOpen ? (
                      <ChevronUp className="h-5 w-5" />
                    ) : (
                      <ChevronDown className="h-5 w-5" />
                    )}
                  </span>
                </button>

                {isOpen && (
                  <div className="mt-3 space-y-4 pl-11">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Your Answer
                      </p>
                      <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                        {answer.answer}
                      </p>
                    </div>

                    {hasQScore && qEval ? (
                      <div className="space-y-4">
                        {qEval.strengths && qEval.strengths.length > 0 && (
                          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                              Strengths
                            </p>
                            <ul className="mt-1.5 space-y-1">
                              {qEval.strengths.map((point, i) => (
                                <li key={i} className="flex gap-2 text-sm text-emerald-900">
                                  <span className="shrink-0">•</span>
                                  <span>{point}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {qEval.weaknesses && qEval.weaknesses.length > 0 && (
                          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                              Areas to Improve
                            </p>
                            <ul className="mt-1.5 space-y-1">
                              {qEval.weaknesses.map((point, i) => (
                                <li key={i} className="flex gap-2 text-sm text-amber-900">
                                  <span className="shrink-0">•</span>
                                  <span>{point}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {qEval.feedback && (
                          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Feedback
                            </p>
                            <p className="mt-1.5 text-sm leading-relaxed text-slate-700">
                              {qEval.feedback}
                            </p>
                          </div>
                        )}
                        {qEval.suggestedAnswerPoints &&
                          qEval.suggestedAnswerPoints.length > 0 && (
                            <div className="rounded-xl border border-violet-200 bg-violet-50 p-4">
                              <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">
                                Suggested Answer Points
                              </p>
                              <ul className="mt-1.5 space-y-1">
                                {qEval.suggestedAnswerPoints.map((point, i) => (
                                  <li key={i} className="flex gap-2 text-sm text-violet-900">
                                    <span className="shrink-0">•</span>
                                    <span>{point}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500">
                        This question has not been scored individually.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}

export default InterviewEvaluation