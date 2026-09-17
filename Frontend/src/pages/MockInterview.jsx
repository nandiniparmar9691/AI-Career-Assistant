import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  FileText,
  Inbox,
  Loader2,
  MessageCircleQuestion,
  Mic,
  Sparkles,
  Trash2,
} from 'lucide-react'
import {
  completeMockInterview,
  deleteMockInterview,
  getErrorMessage,
  getInterviewQuestionSets,
  getJobDescriptions,
  getMockInterviewById,
  getMockInterviews,
  getResumes,
  startMockInterview,
  submitMockInterviewAnswer,
} from '../services/api'
import { useAuth } from '../context/AuthContext'
import { CATEGORY_LABELS } from '../constants/interviewCategories'

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

const SelectField = ({ label, value, onChange, children, placeholder }) => (
  <div>
    <label className="mb-1.5 block text-sm font-medium text-slate-700">{label}</label>
    <select
      value={value || ''}
      onChange={(e) => onChange(e.target.value || '')}
      className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
    >
      <option value="">{placeholder}</option>
      {children}
    </select>
  </div>
)

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

const InterviewSession = ({ interview, onRefresh, onComplete }) => {
  const [answerText, setAnswerText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [completing, setCompleting] = useState(false)
  const [error, setError] = useState(null)

  const answers = interview.answers || []
  const total = answers.length
  const answered = answers.filter((a) => a.answer).length
  const currentIndex = Math.min(interview.currentQuestionIndex || 0, total)
  const allAnswered = currentIndex >= total
  const current = allAnswered ? null : answers[currentIndex] || null
  const progress = total ? Math.round((answered / total) * 100) : 0

  const handleSubmit = async () => {
    if (submitting || !interview || !current || !answerText.trim()) return
    setSubmitting(true)
    setError(null)
    try {
      const { data } = await submitMockInterviewAnswer(interview.id, {
        answer: answerText,
      })
      setAnswerText('')
      await onRefresh(data.interview)
    } catch (err) {
      const status = err.response?.status
      if (status === 401) {
        await onRefresh(null, true)
        return
      }
      setError(err.response?.data?.message || getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  const handleComplete = async () => {
    if (completing || !interview) return
    setCompleting(true)
    setError(null)
    try {
      const { data } = await completeMockInterview(interview.id)
      await onComplete(data.interview)
    } catch (err) {
      const status = err.response?.status
      if (status === 401) {
        await onRefresh(null, true)
        return
      }
      setError(err.response?.data?.message || getErrorMessage(err))
      setCompleting(false)
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-5 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              {interview.targetRole || 'Mock Interview'}
            </h2>
            <p className="text-sm text-slate-500">
              {interview.difficulty} difficulty · {answered} of {total} answered
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-700">
              {currentIndex < total ? `${currentIndex + 1} / ${total}` : `${total} / ${total}`}
            </span>
            <div className="h-2 w-36 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-indigo-600 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 py-5">
        {error && (
          <div className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            <span className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {error}
            </span>
            <button type="button" onClick={() => setError(null)} className="font-medium hover:opacity-80">
              Dismiss
            </button>
          </div>
        )}

        {allAnswered ? (
          <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
              <CheckCircle2 className="h-7 w-7 text-emerald-600" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-slate-900">All questions answered</h3>
            <p className="mt-1.5 max-w-md text-sm text-slate-500">
              You have answered every question. Complete the interview to get your AI evaluation.
            </p>
            <button
              type="button"
              onClick={handleComplete}
              disabled={completing}
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
            >
              {completing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Evaluating your answers...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Complete & Get Evaluation
                </>
              )}
            </button>
          </div>
        ) : current ? (
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                  CATEGORY_STYLES[current.category] || 'bg-slate-100 text-slate-600'
                }`}
              >
                {CATEGORY_LABELS[current.category] || current.category}
              </span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                  DIFFICULTY_STYLES[current.difficulty] || 'bg-slate-100 text-slate-600'
                }`}
              >
                {current.difficulty}
              </span>
            </div>
            <h3 className="mt-3 text-base font-semibold leading-relaxed text-slate-900">
              Question {currentIndex + 1} of {total}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">{current.question}</p>
            {current.whyAsked && (
              <p className="mt-2 text-xs leading-relaxed text-slate-500">{current.whyAsked}</p>
            )}

            <div className="mt-5">
              <label
                htmlFor={`answer-${currentIndex}`}
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Your Answer
              </label>
              <textarea
                id={`answer-${currentIndex}`}
                value={answerText}
                onChange={(e) => setAnswerText(e.target.value)}
                rows={8}
                placeholder="Type your answer here..."
                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting || !answerText.trim()}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving answer...
                  </>
                ) : (
                  'Submit Answer'
                )}
              </button>
            </div>
            {currentIndex === total - 1 && (
              <p className="mt-3 text-right text-xs text-slate-500">
                This is the last question. After submitting it you can complete the interview.
              </p>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
            <Inbox className="h-10 w-10 text-slate-300" />
            <p className="mt-4 text-sm font-medium text-slate-700">No questions found.</p>
          </div>
        )}
      </div>
    </section>
  )
}

const MockInterview = () => {
  const { id: routeId } = useParams()
  const { logout } = useAuth()
  const navigate = useNavigate()

  const [resumes, setResumes] = useState([])
  const [jobDescriptions, setJobDescriptions] = useState([])
  const [questionSets, setQuestionSets] = useState([])
  const [history, setHistory] = useState([])
  const [selectedResume, setSelectedResume] = useState('')
  const [selectedJd, setSelectedJd] = useState('')
  const [selectedSet, setSelectedSet] = useState('')
  const [loadingPage, setLoadingPage] = useState(true)
  const [starting, setStarting] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [error, setError] = useState(null)
  const [interview, setInterview] = useState(null)
  const [loadingInterview, setLoadingInterview] = useState(false)

  useEffect(() => {
    let active = true
    const load = async () => {
      setLoadingPage(true)
      setError(null)
      try {
        const [resumesRes, jdsRes, setsRes] = await Promise.all([
          getResumes(),
          getJobDescriptions(),
          getInterviewQuestionSets(),
        ])
        if (!active) return
        setResumes(resumesRes.data.resumes || [])
        setJobDescriptions(jdsRes.data.jobDescriptions || [])
        setQuestionSets(setsRes.data.questionSets || [])
      } catch (err) {
        if (err.response?.status === 401) {
          await logout()
          return
        }
        if (active) setError(getErrorMessage(err))
      } finally {
        if (active) setLoadingPage(false)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [logout])

  useEffect(() => {
    let active = true
    const loadHistory = async () => {
      try {
        const { data } = await getMockInterviews()
        if (active) setHistory(data.mockInterviews || [])
      } catch (err) {
        if (err.response?.status === 401 && active) {
          await logout()
        }
      }
    }
    loadHistory()
    return () => {
      active = false
    }
  }, [logout, interview])

  useEffect(() => {
    if (!routeId) return
    let active = true
    const load = async () => {
      setLoadingInterview(true)
      setError(null)
      try {
        const { data } = await getMockInterviewById(routeId)
        if (!active) return
        if (data.interview.status === 'COMPLETED') {
          navigate(`/mock-interview/${data.interview.id}/evaluation`, { replace: true })
          return
        }
        setInterview(data.interview || null)
      } catch (err) {
        if (err.response?.status === 401) {
          await logout()
          return
        }
        if (active) setError(getErrorMessage(err))
      } finally {
        if (active) setLoadingInterview(false)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [routeId, logout, navigate])

  const availableSets = questionSets.filter((set) => {
    if (!selectedResume || !selectedJd) return true
    return (
      String(set.resumeId) === String(selectedResume) &&
      String(set.jobDescriptionId) === String(selectedJd)
    )
  })

  const handleStart = async () => {
    if (starting || !selectedResume || !selectedJd || !selectedSet) return
    setStarting(true)
    setError(null)
    try {
      const { data } = await startMockInterview({
        resumeId: selectedResume,
        jobDescriptionId: selectedJd,
        questionSetId: selectedSet,
      })
      setInterview(data.interview || null)
    } catch (err) {
      const status = err.response?.status
      if (status === 401) {
        await logout()
        return
      }
      setError(err.response?.data?.message || getErrorMessage(err))
    } finally {
      setStarting(false)
    }
  }

  const handleDelete = async (interviewId) => {
    if (deletingId) return
    if (!window.confirm('Delete this mock interview?')) return
    setDeletingId(interviewId)
    setError(null)
    try {
      await deleteMockInterview(interviewId)
      setHistory((prev) => prev.filter((h) => h.id !== interviewId))
      if (interview && interview.id === interviewId) setInterview(null)
    } catch (err) {
      const status = err.response?.status
      if (status === 401) {
        await logout()
        return
      }
      setError(getErrorMessage(err))
    } finally {
      setDeletingId(null)
    }
  }

  const refreshInterview = async (interviewData, forceLogout = false) => {
    if (forceLogout) {
      await logout()
      return
    }
    if (interviewData) {
      setInterview(interviewData)
      if (interviewData.status === 'COMPLETED') {
        navigate(`/mock-interview/${interviewData.id}/evaluation`)
        return
      }
    }
  }

  const handleComplete = (completedInterview) => {
    setInterview(completedInterview)
    navigate(`/mock-interview/${completedInterview.id}/evaluation`)
  }

  if (loadingPage || loadingInterview) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-500">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  if (error && !interview && routeId) {
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

  if (interview && routeId) {
    return (
      <div className="space-y-6">
        <div>
          <Link
            to="/mock-interview"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 transition hover:text-indigo-700"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Mock Interview
          </Link>
        </div>
        {error && (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            <span className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {error}
            </span>
            <button type="button" onClick={() => setError(null)} className="font-medium hover:opacity-80">
              Dismiss
            </button>
          </div>
        )}
        <InterviewSession
          interview={interview}
          onRefresh={refreshInterview}
          onComplete={handleComplete}
        />
      </div>
    )
  }

  const canStart = Boolean(
    selectedResume && selectedJd && selectedSet && availableSets.length > 0 && !starting
  )

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Mock Interview</h1>
        <p className="mt-1.5 text-sm text-slate-500 sm:text-base">
          Practice interview questions based on your resume and target job.
        </p>
      </div>

      {error && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <span className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {error}
          </span>
          <button type="button" onClick={() => setError(null)} className="font-medium hover:opacity-80">
            Dismiss
          </button>
        </div>
      )}

      {!interview && (
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-2.5 border-b border-slate-200 px-5 py-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50">
              <Mic className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900">New Mock Interview</h2>
              <p className="text-sm text-slate-500">
                Pick a resume, a job description and an AI-generated question set.
              </p>
            </div>
          </div>

          <div className="px-5 py-5">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div>
                <SelectField
                  label="Select Resume"
                  value={selectedResume}
                  onChange={(value) => {
                    setSelectedResume(value)
                    setSelectedSet('')
                  }}
                  placeholder="Select a resume..."
                >
                  {resumes.map((resume) => (
                    <option key={resume.id} value={resume.id}>
                      {resume.fileName} · {formatDate(resume.createdAt)}
                    </option>
                  ))}
                </SelectField>
                {resumes.length === 0 && (
                  <p className="mt-1.5 text-xs text-amber-600">
                    No resumes yet. Upload one in the Resume Analyzer first.
                  </p>
                )}
              </div>
              <div>
                <SelectField
                  label="Select Job Description"
                  value={selectedJd}
                  onChange={(value) => {
                    setSelectedJd(value)
                    setSelectedSet('')
                  }}
                  placeholder="Select a job description..."
                >
                  {jobDescriptions.map((jd) => (
                    <option key={jd.id} value={jd.id}>
                      {jd.title || 'Untitled'} · {jd.company || 'Unknown'}
                    </option>
                  ))}
                </SelectField>
                {jobDescriptions.length === 0 && (
                  <p className="mt-1.5 text-xs text-amber-600">
                    No job descriptions yet. Analyze one in the Job Analyzer first.
                  </p>
                )}
              </div>
              <div>
                <SelectField
                  label="Select Question Set"
                  value={selectedSet}
                  onChange={setSelectedSet}
                  placeholder={
                    availableSets.length === 0
                      ? 'No matching question sets...'
                      : 'Select a question set...'
                  }
                >
                  {availableSets.map((set) => (
                    <option key={set.id} value={set.id}>
                      {set.targetRole || set.jobTitle || 'Question set'} ·{set.totalQuestions}{' '}
                      questions · {set.difficulty}
                    </option>
                  ))}
                </SelectField>
                {questionSets.length === 0 && (
                  <p className="mt-1.5 text-xs text-amber-600">
                    No question sets yet. Generate one in AI Interview Questions first.
                  </p>
                )}
                {questionSets.length > 0 && availableSets.length === 0 && (
                  <p className="mt-1.5 text-xs text-amber-600">
                    Generate a question set for this resume and job description first.
                  </p>
                )}
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={handleStart}
                disabled={!canStart}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
              >
                {starting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Starting interview...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Start Mock Interview
                  </>
                )}
              </button>
            </div>
          </div>
        </section>
      )}

      {interview && (
        <InterviewSession
          interview={interview}
          onRefresh={refreshInterview}
          onComplete={handleComplete}
        />
      )}

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-4">
          <FileText className="h-5 w-5 text-indigo-600" />
          <h2 className="font-semibold text-slate-900">Interview History</h2>
        </div>
        <div className="px-5 py-4">
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Inbox className="h-10 w-10 text-slate-300" />
              <p className="mt-4 text-sm font-medium text-slate-700">No mock interviews yet.</p>
              <p className="mt-1 text-sm text-slate-500">
                Pick a resume, job description and question set above to start.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {history.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50">
                      <MessageCircleQuestion className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {item.targetRole || item.jobTitle || 'Mock interview'}
                      </p>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                        <span>
                          {item.difficulty} · {item.totalQuestions} questions
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                            item.status === 'COMPLETED'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {item.status === 'COMPLETED' ? 'Completed' : 'In Progress'}
                        </span>
                        {item.status === 'COMPLETED' && item.overallScore != null && (
                          <span className="font-semibold text-slate-700">
                            Score: {item.overallScore}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays className="h-3.5 w-3.5" />
                          {formatDate(item.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {item.status === 'COMPLETED' ? (
                      <Link
                        to={`/mock-interview/${item.id}/evaluation`}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-indigo-600 transition hover:border-indigo-300 hover:bg-indigo-50"
                      >
                        View Evaluation
                      </Link>
                    ) : (
                      <Link
                        to={`/mock-interview/${item.id}`}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-indigo-600 transition hover:border-indigo-300 hover:bg-indigo-50"
                      >
                        Continue
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      disabled={deletingId === item.id}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-500 transition hover:border-red-300 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                    >
                      {deletingId === item.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  )
}

export default MockInterview