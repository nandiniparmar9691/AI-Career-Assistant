import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowRight,
  Briefcase,
  Building2,
  CalendarDays,
  ClipboardList,
  FileText,
  Inbox,
  Loader2,
  Rocket,
  Target,
  Trash2,
} from 'lucide-react'
import {
  createRoadmap,
  createSkillGap,
  deleteSkillGap,
  getErrorMessage,
  getJobDescriptions,
  getMatches,
  getResumes,
  getSkillGaps,
} from '../services/api'
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

const ErrorBanner = ({ message, onDismiss }) =>
  message ? (
    <div className="mb-5 flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
      <span className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        {message}
      </span>
      <button type="button" onClick={onDismiss} className="font-medium hover:opacity-80">
        Dismiss
      </button>
    </div>
  ) : null

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

const SkillGapAnalyzer = () => {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [resumes, setResumes] = useState([])
  const [jobDescriptions, setJobDescriptions] = useState([])
  const [matches, setMatches] = useState([])
  const [selectedResume, setSelectedResume] = useState('')
  const [selectedJd, setSelectedJd] = useState('')
  const [selectedMatchId, setSelectedMatchId] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)
  const [skillGaps, setSkillGaps] = useState([])
  const [loadingPage, setLoadingPage] = useState(true)
  const [deletingId, setDeletingId] = useState(null)

  useEffect(() => {
    let active = true
    const load = async () => {
      setLoadingPage(true)
      setError(null)
      try {
        const [resumesRes, jdsRes, matchesRes, gapsRes] = await Promise.all([
          getResumes(),
          getJobDescriptions(),
          getMatches(),
          getSkillGaps(),
        ])
        if (!active) return
        setResumes(resumesRes.data.resumes || [])
        setJobDescriptions(jdsRes.data.jobDescriptions || [])
        setMatches(matchesRes.data.matches || [])
        setSkillGaps(gapsRes.data.skillGaps || [])
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

  const filteredMatches = matches.filter(
    (m) =>
      String(m.resumeId) === selectedResume &&
      String(m.jobDescriptionId) === selectedJd
  )
  const hasMatchForSelection =
    Boolean(selectedResume) && Boolean(selectedJd) && filteredMatches.length > 0
  const selectedMatchIsValid =
    hasMatchForSelection && filteredMatches.some((m) => String(m.id) === selectedMatchId)

  const handleAnalyze = async () => {
    if (analyzing || !selectedMatchIsValid) return
    setAnalyzing(true)
    setError(null)
    try {
      const { data } = await createSkillGap({
        resumeId: selectedResume,
        jobDescriptionId: selectedJd,
        resumeMatchId: selectedMatchId,
      })
      setResult(data.skillGap)
      const refresh = await getSkillGaps()
      setSkillGaps(refresh.data.skillGaps || [])
    } catch (err) {
      const status = err.response?.status
      if (status === 401) {
        await logout()
        return
      }
      setError(err.response?.data?.message || getErrorMessage(err))
    } finally {
      setAnalyzing(false)
    }
  }

  const handleGenerateRoadmap = async () => {
    if (generating || !result) return
    setGenerating(true)
    setError(null)
    try {
      const { data } = await createRoadmap(result.id)
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

  const handleDelete = async (id) => {
    if (deletingId) return
    if (!window.confirm('Delete this skill gap analysis?')) return
    setDeletingId(id)
    setError(null)
    try {
      await deleteSkillGap(id)
      setSkillGaps((prev) => prev.filter((g) => g.id !== id))
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

  const canAnalyze = Boolean(selectedMatchIsValid && !analyzing)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Skill Gap Analyzer</h1>
        <p className="mt-1.5 text-sm text-slate-500 sm:text-base">
          Find the skills and technologies this role expects but your resume does not yet show.
        </p>
      </div>

      <ErrorBanner message={error} onDismiss={() => setError(null)} />

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-2.5 border-b border-slate-200 px-5 py-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50">
            <Target className="h-6 w-6 text-indigo-600" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-900">New Skill Gap Analysis</h2>
            <p className="text-sm text-slate-500">
              Pick a resume, a job description and one of its match results.
            </p>
          </div>
        </div>

        <div className="px-5 py-5">
          {loadingPage ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div>
                <SelectField
                  label="Select Resume"
                  value={selectedResume}
                  onChange={(value) => {
                    setSelectedResume(value)
                    setSelectedMatchId('')
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
                    setSelectedMatchId('')
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
              <div>
                <SelectField
                  label="Select Match Result"
                  value={selectedMatchIsValid ? selectedMatchId : ''}
                  onChange={setSelectedMatchId}
                  placeholder={
                    selectedResume && selectedJd
                      ? hasMatchForSelection
                        ? 'Select a match result...'
                        : 'No match found for this pair'
                      : 'Select a resume and job description first...'
                  }
                >
                  {filteredMatches.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.resumeName || 'Resume'} ↔ {m.jobTitle || 'Role'} ·{' '}
                      {m.matchPercentage}%
                    </option>
                  ))}
                </SelectField>
                {!hasMatchForSelection && selectedResume && selectedJd && (
                  <p className="mt-1.5 text-xs text-amber-600">
                    No match result yet. Run the Resume-JD Matcher for this pair first.
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="mt-5 flex flex-wrap items-center justify-end gap-3">
            {result && (
              <button
                type="button"
                onClick={handleGenerateRoadmap}
                disabled={generating}
                className="inline-flex items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-5 py-2.5 text-sm font-medium text-indigo-700 transition hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-60"
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
            <button
              type="button"
              onClick={handleAnalyze}
              disabled={!canAnalyze}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
            >
              {analyzing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing skill gaps...
                </>
              ) : (
                <>
                  <Target className="h-4 w-4" />
                  Analyze Skill Gap
                </>
              )}
            </button>
          </div>
        </div>
      </section>

      {analyzing && (
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100">
              <Loader2 className="h-7 w-7 animate-spin text-indigo-600" />
            </div>
            <p className="mt-5 text-sm font-semibold text-slate-900">Analyzing skill gaps...</p>
            <p className="mt-1.5 max-w-md text-sm text-slate-500">
              Comparing the match result with the job description to prioritize what to learn.
            </p>
          </div>
        </section>
      )}

      {result && !analyzing && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Analysis Result</h2>
            <Link
              to={`/skill-gap/${result.id}`}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700"
            >
              Open full details <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <SkillGapResultView skillGap={result} />
        </section>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-4">
          <ClipboardList className="h-5 w-5 text-indigo-600" />
          <h2 className="font-semibold text-slate-900">My Skill Gaps</h2>
        </div>
        <div className="px-5 py-4">
          {loadingPage ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
            </div>
          ) : skillGaps.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Inbox className="h-10 w-10 text-slate-300" />
              <p className="mt-4 text-sm font-medium text-slate-700">No skill gap analyses yet.</p>
              <p className="mt-1 text-sm text-slate-500">
                Pick a match above and click Analyze Skill Gap to get started.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {skillGaps.map((gap) => (
                <li key={gap.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50">
                      <FileText className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {gap.resumeName || 'Untitled resume'}
                      </p>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1">
                          <Briefcase className="h-3.5 w-3.5" />
                          {gap.jobTitle || 'Untitled role'}
                        </span>
                        {gap.company && (
                          <span className="inline-flex items-center gap-1">
                            <Building2 className="h-3.5 w-3.5" />
                            {gap.company}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays className="h-3.5 w-3.5" />
                          {formatDate(gap.createdAt)}
                        </span>
                        {gap.missingCount != null && (
                          <span className="text-slate-600">
                            {gap.missingCount} gap{gap.missingCount === 1 ? '' : 's'} ·{' '}
                            {gap.strengthsCount || 0} strength{gap.strengthsCount === 1 ? '' : 's'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="rounded-lg bg-indigo-50 px-3 py-1 text-sm font-bold text-indigo-700">
                      {gap.matchPercentage != null ? `${gap.matchPercentage}%` : '--'}
                    </span>
                    <Link
                      to={`/skill-gap/${gap.id}`}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-indigo-600 transition hover:border-indigo-300 hover:bg-indigo-50"
                    >
                      View
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDelete(gap.id)}
                      disabled={deletingId === gap.id}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-500 transition hover:border-red-300 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                    >
                      {deletingId === gap.id ? (
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

export default SkillGapAnalyzer