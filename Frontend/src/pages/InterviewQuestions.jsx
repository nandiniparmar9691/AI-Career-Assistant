import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  Briefcase,
  Building2,
  CalendarDays,
  FileText,
  Inbox,
  Layers,
  Loader2,
  MessageCircleQuestion,
  Sparkles,
  Trash2,
} from 'lucide-react'
import {
  deleteInterviewQuestionSet,
  generateInterviewQuestions,
  getErrorMessage,
  getInterviewQuestionSets,
  getJobDescriptions,
  getResumes,
} from '../services/api'
import { useAuth } from '../context/AuthContext'
import QuestionCard from '../components/InterviewQuestionCard'
import { CATEGORY_FILTERS, CATEGORY_LABELS, DIFFICULTY_FILTERS } from '../constants/interviewCategories'

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

const QUESTION_COUNTS = [10, 15, 20, 25]
const DIFFICULTY_OPTIONS = ['EASY', 'MEDIUM', 'HARD']

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

const SegmentButton = ({ active, onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    className={`rounded-lg px-3.5 py-2 text-sm font-medium transition ${
      active
        ? 'bg-indigo-600 text-white shadow-sm'
        : 'border border-slate-200 text-slate-600 hover:border-indigo-300 hover:bg-indigo-50'
    }`}
  >
    {children}
  </button>
)

const InterviewQuestions = () => {
  const { logout } = useAuth()
  const [resumes, setResumes] = useState([])
  const [jobDescriptions, setJobDescriptions] = useState([])
  const [questionSets, setQuestionSets] = useState([])
  const [selectedResume, setSelectedResume] = useState('')
  const [selectedJd, setSelectedJd] = useState('')
  const [difficulty, setDifficulty] = useState('MEDIUM')
  const [count, setCount] = useState(15)
  const [generating, setGenerating] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [loadingPage, setLoadingPage] = useState(true)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [difficultyFilter, setDifficultyFilter] = useState('ALL')

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

  const filteredQuestions = (result?.questions || []).filter((q) => {
    if (categoryFilter !== 'ALL' && q.category !== categoryFilter) return false
    if (difficultyFilter !== 'ALL' && q.difficulty !== difficultyFilter) return false
    return true
  })

  const handleGenerate = async () => {
    if (generating || !selectedResume || !selectedJd) return
    setGenerating(true)
    setError(null)
    setResult(null)
    try {
      const { data } = await generateInterviewQuestions({
        resumeId: selectedResume,
        jobDescriptionId: selectedJd,
        difficulty,
        questionCount: count,
      })
      setResult(data.questionSet)
      const refresh = await getInterviewQuestionSets()
      setQuestionSets(refresh.data.questionSets || [])
    } catch (err) {
      const status = err.response?.status
      if (status === 401) {
        await logout()
        return
      }
      setError(err.response?.data?.message || getErrorMessage(err))
    } finally {
      setGenerating(false)
    }
  }

  const handleDelete = async (id) => {
    if (deletingId) return
    if (!window.confirm('Delete this question set?')) return
    setDeletingId(id)
    setError(null)
    try {
      await deleteInterviewQuestionSet(id)
      setQuestionSets((prev) => prev.filter((s) => s.id !== id))
      if (result && result.id === id) setResult(null)
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

  const canGenerate = Boolean(selectedResume && selectedJd && !generating)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">AI Interview Questions</h1>
        <p className="mt-1.5 text-sm text-slate-500 sm:text-base">
          Generate personalized interview questions based on your resume and target job.
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

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-2.5 border-b border-slate-200 px-5 py-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50">
            <MessageCircleQuestion className="h-6 w-6 text-indigo-600" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-900">New Question Set</h2>
            <p className="text-sm text-slate-500">
              Pick a resume and a job description. A matching skill gap is used automatically if available.
            </p>
          </div>
        </div>

        <div className="px-5 py-5">
          {loadingPage ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div>
                  <SelectField
                    label="Select Resume"
                    value={selectedResume}
                    onChange={(value) => {
                      setSelectedResume(value)
                      setResult(null)
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
                      setResult(null)
                    }}
                    placeholder="Select a job description..."
                  >
                    {jobDescriptions.map((jd) => (
                      <option key={jd.id} value={jd.id}>
                        {jd.title || 'Untitled'} · {jd.company || 'Unknown'} {formatDate(jd.createdAt)}
                      </option>
                    ))}
                  </SelectField>
                  {jobDescriptions.length === 0 && (
                    <p className="mt-1.5 text-xs text-amber-600">
                      No job descriptions yet. Analyze one in the Job Analyzer first.
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <p className="mb-1.5 text-sm font-medium text-slate-700">Difficulty</p>
                  <div className="flex flex-wrap gap-2">
                    {DIFFICULTY_OPTIONS.map((d) => (
                      <SegmentButton
                        key={d}
                        active={difficulty === d}
                        onClick={() => {
                          setDifficulty(d)
                          setResult(null)
                        }}
                      >
                        {d.charAt(0) + d.slice(1).toLowerCase()}
                      </SegmentButton>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-1.5 text-sm font-medium text-slate-700">Number of Questions</p>
                  <div className="flex flex-wrap gap-2">
                    {QUESTION_COUNTS.map((n) => (
                      <SegmentButton
                        key={n}
                        active={count === n}
                        onClick={() => {
                          setCount(n)
                          setResult(null)
                        }}
                      >
                        {n}
                      </SegmentButton>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-5 flex justify-end">
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={!canGenerate}
                  className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
                >
                  {generating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generating questions...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Generate Questions
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </section>

      {generating && (
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100">
              <Loader2 className="h-7 w-7 animate-spin text-indigo-600" />
            </div>
            <p className="mt-5 text-sm font-semibold text-slate-900">Generating personalized questions...</p>
            <p className="mt-1.5 max-w-md text-sm text-slate-500">
              Using your resume, the job description and any available skill gap data.
            </p>
          </div>
        </section>
      )}

      {result && !generating && (
        <section>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50">
                  <MessageCircleQuestion className="h-6 w-6 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    {result.targetRole ? `Questions for ${result.targetRole}` : 'Question Set'}
                  </h2>
                  <p className="text-sm text-slate-500">
                    {result.totalQuestions} question{result.totalQuestions === 1 ? '' : 's'} ·{' '}
                    {result.difficulty} difficulty
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2">
                  <Layers className="h-4 w-4 text-slate-400" />
                  <span className="text-xs font-medium text-slate-600">Category</span>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
                  >
                    {CATEGORY_FILTERS.map((c) => (
                      <option key={c} value={c}>
                        {c === 'ALL' ? 'All' : CATEGORY_LABELS[c]}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2">
                  <span className="text-xs font-medium text-slate-600">Difficulty</span>
                  <select
                    value={difficultyFilter}
                    onChange={(e) => setDifficultyFilter(e.target.value)}
                    className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
                  >
                    {DIFFICULTY_FILTERS.map((d) => (
                      <option key={d} value={d}>
                        {d === 'ALL' ? 'All' : d.charAt(0) + d.slice(1).toLowerCase()}
                      </option>
                    ))}
                  </select>
                </div>
                <Link
                  to={`/interview-questions/${result.id}`}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-indigo-600 transition hover:border-indigo-300 hover:bg-indigo-50"
                >
                  Open details
                </Link>
              </div>
            </div>
          </div>

          {filteredQuestions.length === 0 ? (
            <div className="mt-4 flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
              <Inbox className="h-10 w-10 text-slate-300" />
              <p className="mt-4 text-sm font-medium text-slate-700">No questions match these filters.</p>
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
              {filteredQuestions.map((q, idx) => (
                <QuestionCard key={`${q.question}-${idx}`} index={idx} q={q} />
              ))}
            </div>
          )}
        </section>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-4">
          <FileText className="h-5 w-5 text-indigo-600" />
          <h2 className="font-semibold text-slate-900">Question Set History</h2>
        </div>
        <div className="px-5 py-4">
          {loadingPage ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
            </div>
          ) : questionSets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Inbox className="h-10 w-10 text-slate-300" />
              <p className="mt-4 text-sm font-medium text-slate-700">No question sets yet.</p>
              <p className="mt-1 text-sm text-slate-500">
                Pick a resume and a job description above, then click Generate Questions.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {questionSets.map((set) => (
                <li key={set.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50">
                      <MessageCircleQuestion className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {set.targetRole || set.jobTitle || 'Interview questions'}
                      </p>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1">
                          <Briefcase className="h-3.5 w-3.5" />
                          {set.resumeName || 'Resume'}
                        </span>
                        {set.jobTitle && (
                          <span className="inline-flex items-center gap-1">
                            <Building2 className="h-3.5 w-3.5" />
                            {set.company || set.jobTitle}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays className="h-3.5 w-3.5" />
                          {formatDate(set.createdAt)}
                        </span>
                        <span className="text-slate-600">
                          {set.totalQuestions} questions · {set.difficulty}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Link
                      to={`/interview-questions/${set.id}`}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-indigo-600 transition hover:border-indigo-300 hover:bg-indigo-50"
                    >
                      View
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDelete(set.id)}
                      disabled={deletingId === set.id}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-500 transition hover:border-red-300 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                    >
                      {deletingId === set.id ? (
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

export default InterviewQuestions