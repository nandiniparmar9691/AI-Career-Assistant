import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Circle,
  Clock,
  ListChecks,
  Loader2,
  Map,
  Target,
  Wrench,
} from 'lucide-react'
import { getErrorMessage, getRoadmapById, updateRoadmapProgress } from '../services/api'
import { useAuth } from '../context/AuthContext'

const ProgressRing = ({ progress }) => {
  const radius = 40
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - Math.max(0, Math.min(100, progress)) / 100)
  const color = progress >= 100 ? '#059669' : progress >= 50 ? '#4f46e5' : '#d97706'
  return (
    <div className="relative h-28 w-28">
      <svg viewBox="0 0 100 100" className="h-full w-full">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="10" />
        <circle
          cx="50" cy="50" r={radius} fill="none" stroke={color} strokeWidth="10"
          strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
          transform="rotate(-90 50 50)"
        />
        <text x="50" y="48" textAnchor="middle" fontSize="22" fontWeight="700" fill="#0f172a">
          {progress}
        </text>
        <text x="50" y="64" textAnchor="middle" fontSize="10" fill="#94a3b8">%</text>
      </svg>
    </div>
  )
}

const Chip = ({ children, tone = 'indigo' }) => (
  <span
    className={`rounded-lg px-2.5 py-1 text-xs font-medium ${
      tone === 'emerald'
        ? 'bg-emerald-50 text-emerald-700'
        : tone === 'slate'
          ? 'bg-slate-100 text-slate-600'
          : 'bg-indigo-50 text-indigo-700'
    }`}
  >
    {children}
  </span>
)

const QuoteList = ({ items }) =>
  items && items.length ? (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2 text-sm leading-relaxed text-slate-600">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  ) : (
    <p className="text-sm text-slate-500">None</p>
  )

const RoadmapDetail = () => {
  const { id } = useParams()
  const { logout } = useAuth()
  const [roadmap, setRoadmap] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [updating, setUpdating] = useState(null)

  useEffect(() => {
    let active = true
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const { data } = await getRoadmapById(id)
        if (active) setRoadmap(data.roadmap || null)
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

  const handleTogglePhase = async (phase) => {
    if (updating != null) return
    setUpdating(phase.phaseNumber)
    setError(null)
    try {
      const { data } = await updateRoadmapProgress(id, {
        phaseNumber: phase.phaseNumber,
        completed: !phase.completed,
      })
      setRoadmap(data.roadmap)
    } catch (err) {
      if (err.response?.status === 401) {
        await logout()
        return
      }
      setError(err.response?.data?.message || getErrorMessage(err))
    } finally {
      setUpdating(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-500">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  if (!roadmap) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-red-50">
          <AlertTriangle className="h-5 w-5 text-red-600" />
        </div>
        <p className="mt-3 text-sm text-red-600">{error || 'Roadmap not found'}</p>
        <Link
          to="/roadmap"
          className="mt-4 inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-indigo-300 hover:text-indigo-700"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Roadmaps
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <Link
          to="/roadmap"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 transition hover:text-indigo-700"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Roadmaps
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
          {roadmap.title || 'Personalized Roadmap'}
        </h1>
        <p className="mt-1.5 text-sm text-slate-500">
          {roadmap.resumeName || 'Resume'} → {roadmap.jobTitle || 'Role'}
          {roadmap.company ? ` at ${roadmap.company}` : ''}
          {roadmap.totalDuration ? ` · ${roadmap.totalDuration}` : ''}
        </p>
      </div>

      {error && roadmap && (
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
        <div className="flex flex-col gap-6 px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-6">
            <ProgressRing progress={roadmap.progress || 0} />
            <div>
              <p className="text-sm font-semibold text-slate-900">Overall Progress</p>
              <p className="mt-1 max-w-lg text-sm leading-relaxed text-slate-500">{roadmap.summary}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <Map className="h-5 w-5 text-indigo-600" />
            <span>
              {roadmap.completedPhases ?? 0} of {roadmap.totalPhases ?? 0} phases completed
            </span>
          </div>
        </div>
      </section>

      <div className="space-y-6">
        {(roadmap.phases || []).map((phase) => (
          <section
            key={phase.phaseNumber}
            className={`rounded-2xl border bg-white shadow-sm ${
              phase.completed ? 'border-emerald-200' : 'border-slate-200'
            }`}
          >
            <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-sm font-bold text-indigo-700">
                  {phase.phaseNumber}
                </span>
                <div>
                  <h2 className="font-semibold text-slate-900">{phase.title}</h2>
                  {phase.duration && (
                    <p className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Clock className="h-3.5 w-3.5" /> {phase.duration}
                    </p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleTogglePhase(phase)}
                disabled={updating != null}
                className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${
                  phase.completed
                    ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    : 'border border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-700'
                }`}
              >
                {updating === phase.phaseNumber ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : phase.completed ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <Circle className="h-4 w-4" />
                )}
                {phase.completed ? 'Completed' : 'Mark complete'}
              </button>
            </div>

            <div className="grid grid-cols-1 gap-6 px-5 py-5 lg:grid-cols-2">
              <div>
                <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  <Target className="h-4 w-4" /> Goals
                </p>
                <div className="mt-2">
                  <QuoteList items={phase.goals} />
                </div>

                {phase.skills && phase.skills.length > 0 && (
                  <>
                    <p className="mt-5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      <Wrench className="h-4 w-4" /> Skills
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {phase.skills.map((s, i) => (
                        <Chip key={i} tone="emerald">{s}</Chip>
                      ))}
                    </div>
                  </>
                )}

                {phase.topics && phase.topics.length > 0 && (
                  <>
                    <p className="mt-5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      <ListChecks className="h-4 w-4" /> Topics
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {phase.topics.map((t, i) => (
                        <Chip key={i} tone="indigo">{t}</Chip>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div>
                {phase.projects && phase.projects.length > 0 && (
                  <>
                    <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      <Wrench className="h-4 w-4" /> Projects
                    </p>
                    <div className="mt-2">
                      <QuoteList items={phase.projects} />
                    </div>
                  </>
                )}

                {phase.resources && phase.resources.length > 0 && (
                  <>
                    <p className="mt-5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      <BookOpen className="h-4 w-4" /> Resources
                    </p>
                    <ul className="mt-2 space-y-2">
                      {phase.resources.map((r, i) => (
                        <li key={i} className="text-sm">
                          {r.url ? (
                            <a
                              href={r.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-medium text-indigo-600 transition hover:text-indigo-700"
                            >
                              {r.title || r.url}
                            </a>
                          ) : (
                            <span className="text-slate-600">{r.title || r.type || 'Resource'}</span>
                          )}
                          {r.type ? (
                            <span className="ml-2 text-xs text-slate-400">{r.type}</span>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}

export default RoadmapDetail