import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  Briefcase,
  Building2,
  CalendarDays,
  Compass,
  Inbox,
  Loader2,
  Map,
  Trash2,
} from 'lucide-react'
import { deleteRoadmap, getErrorMessage, getRoadmaps } from '../services/api'
import { useAuth } from '../context/AuthContext'

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

const ProgressBar = ({ progress }) => (
  <div className="h-2 w-40 overflow-hidden rounded-full bg-slate-100">
    <div
      className={`h-full rounded-full ${
        progress >= 100 ? 'bg-emerald-500' : progress >= 50 ? 'bg-indigo-500' : 'bg-amber-500'
      }`}
      style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
    />
  </div>
)

const Roadmap = () => {
  const { logout } = useAuth()
  const [roadmaps, setRoadmaps] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  useEffect(() => {
    let active = true
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const { data } = await getRoadmaps()
        if (active) setRoadmaps(data.roadmaps || [])
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
  }, [logout])

  const handleDelete = async (id) => {
    if (deletingId) return
    if (!window.confirm('Delete this roadmap?')) return
    setDeletingId(id)
    setError(null)
    try {
      await deleteRoadmap(id)
      setRoadmaps((prev) => prev.filter((r) => r.id !== id))
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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Personalized Roadmaps</h1>
        <p className="mt-1.5 text-sm text-slate-500 sm:text-base">
          Step-by-step learning plans generated from your actual skill gaps.
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
        <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-4">
          <Map className="h-5 w-5 text-indigo-600" />
          <h2 className="font-semibold text-slate-900">My Roadmaps</h2>
        </div>
        <div className="px-5 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
            </div>
          ) : roadmaps.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
                <Compass className="h-7 w-7 text-slate-400" />
              </div>
              <p className="mt-4 text-sm font-medium text-slate-700">No roadmaps yet.</p>
              <p className="mt-1 max-w-sm text-sm text-slate-500">
                Analyze a skill gap first, then generate a personalized roadmap from it.
              </p>
              <Link
                to="/skill-gap"
                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700"
              >
                Go to Skill Gap Analyzer
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {roadmaps.map((roadmap) => (
                <li key={roadmap.id} className="flex flex-col gap-4 py-5 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50">
                        <Map className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {roadmap.title || 'Personalized roadmap'}
                        </p>
                        {roadmap.summary && (
                          <p className="mt-0.5 line-clamp-1 text-sm text-slate-500">{roadmap.summary}</p>
                        )}
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                          <span className="inline-flex items-center gap-1">
                            <Briefcase className="h-3.5 w-3.5" />
                            {roadmap.jobTitle || 'Untitled role'}
                          </span>
                          {roadmap.company && (
                            <span className="inline-flex items-center gap-1">
                              <Building2 className="h-3.5 w-3.5" />
                              {roadmap.company}
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1">
                            <CalendarDays className="h-3.5 w-3.5" />
                            {formatDate(roadmap.createdAt)}
                          </span>
                          {roadmap.totalDuration && <span>{roadmap.totalDuration}</span>}
                          <span>
                            {roadmap.completedPhases ?? 0}/{roadmap.totalPhases ?? 0} phases done
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-3 lg:pl-0">
                    <ProgressBar progress={roadmap.progress || 0} />
                    <span className="w-10 text-right text-sm font-bold text-slate-900">
                      {roadmap.progress || 0}%
                    </span>
                    <Link
                      to={`/roadmap/${roadmap.id}`}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-indigo-600 transition hover:border-indigo-300 hover:bg-indigo-50"
                    >
                      View
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDelete(roadmap.id)}
                      disabled={deletingId === roadmap.id}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-500 transition hover:border-red-300 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                    >
                      {deletingId === roadmap.id ? (
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

      <div className="flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
        <Inbox className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
        <p className="text-xs leading-relaxed text-slate-500">
          Roadmaps only focus on skills that are actually missing from your resume. Skills you
          already demonstrated are not re-taught.
        </p>
      </div>
    </div>
  )
}

export default Roadmap