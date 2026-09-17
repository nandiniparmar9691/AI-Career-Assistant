import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowLeft,
  Inbox,
  Layers,
  Loader2,
  Trash2,
} from 'lucide-react'
import { deleteInterviewQuestionSet, getErrorMessage, getInterviewQuestionSetById } from '../services/api'
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

const InterviewQuestionDetails = () => {
  const { id } = useParams()
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [questionSet, setQuestionSet] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [difficultyFilter, setDifficultyFilter] = useState('ALL')

  useEffect(() => {
    let active = true
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const { data } = await getInterviewQuestionSetById(id)
        if (!active) return
        setQuestionSet(data.questionSet || null)
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

  const handleDelete = async () => {
    if (!questionSet) return
    if (!window.confirm('Delete this question set?')) return
    setError(null)
    try {
      await deleteInterviewQuestionSet(questionSet.id)
      navigate('/interview-questions')
    } catch (err) {
      const status = err.response?.status
      if (status === 401) {
        await logout()
        return
      }
      setError(getErrorMessage(err))
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-500">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  if (error && !questionSet) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-red-50">
          <AlertTriangle className="h-5 w-5 text-red-600" />
        </div>
        <p className="mt-3 text-sm text-red-600">{error || 'Question set not found'}</p>
        <Link
          to="/interview-questions"
          className="mt-4 inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-indigo-300 hover:text-indigo-700"
        >
          <ArrowLeft className="h-4 w-4" /> Back to AI Interview Questions
        </Link>
      </div>
    )
  }

  const filteredQuestions = (questionSet?.questions || []).filter((q) => {
    if (categoryFilter !== 'ALL' && q.category !== categoryFilter) return false
    if (difficultyFilter !== 'ALL' && q.difficulty !== difficultyFilter) return false
    return true
  })

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/interview-questions"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 transition hover:text-indigo-700"
        >
          <ArrowLeft className="h-4 w-4" /> Back to AI Interview Questions
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
          {questionSet.targetRole ? `Questions for ${questionSet.targetRole}` : 'Interview Questions'}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {questionSet.resumeName || 'Resume'} vs {questionSet.jobTitle || 'Role'}
          {questionSet.company ? ` at ${questionSet.company}` : ''} · {questionSet.totalQuestions} questions ·{' '}
          {questionSet.difficulty} · {formatDate(questionSet.createdAt)}
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

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">All Questions</h2>
            <p className="text-sm text-slate-500">
              {filteredQuestions.length} of {questionSet.totalQuestions} shown
            </p>
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
            <button
              type="button"
              onClick={handleDelete}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-500 transition hover:border-red-300 hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          </div>
        </div>
      </section>

      {filteredQuestions.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
          <Inbox className="h-10 w-10 text-slate-300" />
          <p className="mt-4 text-sm font-medium text-slate-700">No questions match these filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {filteredQuestions.map((q, idx) => (
            <QuestionCard key={`${q.question}-${idx}`} index={idx} q={q} />
          ))}
        </div>
      )}
    </div>
  )
}

export default InterviewQuestionDetails