import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, Loader2, Rocket, Trash2 } from 'lucide-react'
import { getErrorMessage, getSkillGapById, createRoadmap, deleteSkillGap, getRoadmaps } from '../services/api'
import { useAuth } from '../context/AuthContext'
import SkillGapResultView from '../components/SkillGapResultView'

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

const SkillGapDetails = () => {
  const { id } = useParams()
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [skillGap, setSkillGap] = useState(null)
  const [existingRoadmapId, setExistingRoadmapId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const [gapRes, roadmapsRes] = await Promise.all([
          getSkillGapById(id),
          getRoadmaps(),
        ])
        if (!active) return
        setSkillGap(gapRes.data.skillGap || null)
        const found = (roadmapsRes.data.roadmaps || []).find(
          (r) => String(r.skillGapId) === String(id) || String(r.id) === String(id)
        )
        setExistingRoadmapId(found ? found.id : null)
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

  const handleGenerateRoadmap = async () => {
    if (generating || !skillGap) return
    setGenerating(true)
    setError(null)
    try {
      const { data } = await createRoadmap(skillGap.id)
      setExistingRoadmapId(data.roadmap.id)
      navigate(`/roadmap/${data.roadmap.id}`)
    } catch (err) {
      const status = err.response?.status
      if (status === 401) {
        await logout()
        return
      }
      setError(err.response?.data?.message || 'Unable to generate the roadmap right now.')
    } finally {
      setGenerating(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Delete this skill gap analysis?')) return
    setError(null)
    try {
      await deleteSkillGap(skillGap.id)
      navigate('/skill-gap')
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

  if (error && !skillGap) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-red-50">
          <AlertTriangle className="h-5 w-5 text-red-600" />
        </div>
        <p className="mt-3 text-sm text-red-600">{error || 'Skill gap not found'}</p>
        <Link
          to="/skill-gap"
          className="mt-4 inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-indigo-300 hover:text-indigo-700"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Skill Gap Analyzer
        </Link>
      </div>
    )
  }

  const summary = skillGap

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/skill-gap"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 transition hover:text-indigo-700"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Skill Gap Analyzer
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
          Skill Gap Analysis
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {summary.resumeName || 'Resume'} vs {summary.jobTitle || 'Role'}
          {summary.company ? ` at ${summary.company}` : ''}
          {summary.matchPercentage != null ? ` · ${summary.matchPercentage}%` : ''}
          {summary.createdAt ? ` · ${formatDate(summary.createdAt)}` : ''}
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

      <SkillGapResultView skillGap={skillGap} />

      <section className="rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Personalized Roadmap</h2>
            {existingRoadmapId ? (
              <p className="mt-1 text-sm text-slate-500">
                You already have a roadmap generated for this analysis.
              </p>
            ) : (
              <p className="mt-1 text-sm text-slate-500">
                Generate a step-by-step learning roadmap based on these gaps.
              </p>
            )}
          </div>
          <div className="flex shrink-0 gap-3">
            <button
              type="button"
              onClick={handleDelete}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:border-red-300 hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
            {existingRoadmapId ? (
              <Link
                to={`/roadmap/${existingRoadmapId}`}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700"
              >
                <Rocket className="h-4 w-4" />
                Open Roadmap
              </Link>
            ) : (
              <button
                type="button"
                onClick={handleGenerateRoadmap}
                disabled={generating}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
              >
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating roadmap...
                  </>
                ) : (
                  <>
                    <Rocket className="h-4 w-4" />
                    Generate Roadmap
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}

export default SkillGapDetails