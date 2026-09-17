import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, Loader2 } from 'lucide-react'
import { getErrorMessage, getMatchById } from '../services/api'
import { useAuth } from '../context/AuthContext'
import MatchResultView from '../components/MatchResultView'

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

const MatchDetails = () => {
  const { id } = useParams()
  const { logout } = useAuth()
  const [match, setMatch] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const { data } = await getMatchById(id)
        if (active) setMatch(data.match)
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

  if (error || !match) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-red-50">
          <AlertTriangle className="h-5 w-5 text-red-600" />
        </div>
        <p className="mt-3 text-sm text-red-600">{error || 'Match not found'}</p>
        <Link
          to="/resume-jd-matcher"
          className="mt-4 inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-indigo-300 hover:text-indigo-700"
        >
          <ArrowLeft className="h-4 w-4" /> Back to matcher
        </Link>
      </div>
    )
  }

  const analysis = match.analysis || {}

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/resume-jd-matcher"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 transition hover:text-indigo-700"
        >
          <ArrowLeft className="h-4 w-4" /> Back to matcher
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
          Resume-JD Match
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {analysis.resumeName || match.resumeName} vs {analysis.jobTitle || match.jobTitle || 'Untitled role'}
          {analysis.company || match.company ? ` at ${analysis.company || match.company}` : ''}
          {' · '}
          {formatDate(match.createdAt)}
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Match Percentage</p>
            <p className="mt-1 text-3xl font-bold text-slate-900">{match.matchPercentage}%</p>
          </div>
          <div className="h-10 w-px bg-slate-200" />
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Resume</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">{match.resumeName || 'Untitled resume'}</p>
          </div>
          <div className="h-10 w-px bg-slate-200" />
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Job / Company</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              {match.jobTitle || 'Untitled role'}
              {match.company ? ` — ${match.company}` : ''}
            </p>
          </div>
        </div>
      </div>

      <MatchResultView analysis={analysis} />
    </div>
  )
}

export default MatchDetails