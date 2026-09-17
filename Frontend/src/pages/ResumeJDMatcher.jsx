import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  Briefcase,
  Building2,
  CalendarDays,
  ClipboardList,
  Eye,
  FileText,
  GitCompareArrows,
  Inbox,
  Loader2,
  Scale,
  Trash2,
} from 'lucide-react'
import {
  createResumeMatch,
  deleteMatch,
  getErrorMessage,
  getJobDescriptions,
  getMatches,
  getResumes,
} from '../services/api'
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

const ResumeJDMatcher = () => {
  const { logout } = useAuth()
  const [resumes, setResumes] = useState([])
  const [jobDescriptions, setJobDescriptions] = useState([])
  const [selectedResume, setSelectedResume] = useState('')
  const [selectedJd, setSelectedJd] = useState('')
  const [matching, setMatching] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)
  const [matches, setMatches] = useState([])
  const [loadingMatches, setLoadingMatches] = useState(true)
  const [deletingId, setDeletingId] = useState(null)
  const [loadingSelects, setLoadingSelects] = useState(true)

  const loadMatches = useCallback(async () => {
    try {
      const { data } = await getMatches()
      setMatches(data.matches || [])
    } catch (err) {
      if (err.response?.status === 401) {
        await logout()
        return
      }
    } finally {
      setLoadingMatches(false)
    }
  }, [logout])

  useEffect(() => {
    let active = true
    getResumes()
      .then(({ data }) => {
        if (active) setResumes(data.resumes || [])
      })
      .catch(async (err) => {
        if (err.response?.status === 401) {
          await logout()
          return
        }
        if (active) setError(getErrorMessage(err))
      })
      .finally(() => {
        if (active) setLoadingSelects(false)
      })
    getJobDescriptions()
      .then(({ data }) => {
        if (active) setJobDescriptions(data.jobDescriptions || [])
      })
      .catch(async (err) => {
        if (err.response?.status === 401) {
          await logout()
          return
        }
        if (active) setError(getErrorMessage(err))
      })
    getMatches()
      .then(({ data }) => {
        if (active) setMatches(data.matches || [])
      })
      .catch(async (err) => {
        if (err.response?.status === 401) {
          await logout()
        }
      })
      .finally(() => {
        if (active) setLoadingMatches(false)
      })
    return () => {
      active = false
    }
  }, [logout])

  const handleMatch = async () => {
    if (matching) return
    if (!selectedResume || !selectedJd) return
    setMatching(true)
    setError(null)
    setResult(null)
    try {
      const { data } = await createResumeMatch(selectedResume, selectedJd)
      setResult(data.match)
      await loadMatches()
    } catch (err) {
      const status = err.response?.status
      if (status === 401) {
        await logout()
        return
      }
      if (status === 400) {
        setError(err.response?.data?.message || 'Please select both a resume and a job description.')
      } else if (status === 403 || status === 404) {
        setError(err.response?.data?.message || 'The selected resume or job description was not found.')
      } else if (status >= 500) {
        setError('Unable to compare the documents right now. Please try again.')
      } else {
        setError(getErrorMessage(err))
      }
    } finally {
      setMatching(false)
    }
  }

  const handleDelete = async (id) => {
    if (deletingId) return
    if (!window.confirm('Delete this match result?')) return
    setDeletingId(id)
    setError(null)
    try {
      await deleteMatch(id)
      setMatches((prev) => prev.filter((m) => m.id !== id))
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

  const canMatch = Boolean(selectedResume && selectedJd && !matching)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Resume-JD Matcher</h1>
        <p className="mt-1.5 text-sm text-slate-500 sm:text-base">
          Compare your resume with a job description to understand your fit for the role.
        </p>
      </div>

      <ErrorBanner message={error} onDismiss={() => setError(null)} />

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-2.5 border-b border-slate-200 px-5 py-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50">
            <Scale className="h-6 w-6 text-indigo-600" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-900">New Match</h2>
            <p className="text-sm text-slate-500">Pick a resume and an analyzed job description.</p>
          </div>
        </div>

        <div className="px-5 py-5">
          {loadingSelects ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div>
                <SelectField
                  label="Select Resume"
                  value={selectedResume}
                  onChange={setSelectedResume}
                  placeholder="Select a resume..."
                >
                  {resumes.map((resume) => (
                    <option key={resume.id} value={resume.id}>
                      {resume.fileName} · {formatDate(resume.createdAt)}
                    </option>
                  ))}
                </SelectField>
                {resumes.length > 0 && selectedResume && (
                  <p className="mt-1.5 text-xs text-slate-500">
                    {resumes.find((r) => r.id === selectedResume)?.extractedTextLength
                      ? 'Resume text is prepared for comparison.'
                      : ''}
                  </p>
                )}
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
                  onChange={setSelectedJd}
                  placeholder="Select a job description..."
                >
                  {jobDescriptions.map((jd) => (
                    <option key={jd.id} value={jd.id}>
                      {jd.title || 'Untitled'} · {jd.company || 'Unknown'}{' '}
                      {formatDate(jd.createdAt)}
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
          )}

          <div className="mt-5 flex justify-end">
            <button
              type="button"
              onClick={handleMatch}
              disabled={!canMatch}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
            >
              {matching ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Comparing your resume with the job description...
                </>
              ) : (
                <>
                  <GitCompareArrows className="h-4 w-4" />
                  Match Resume
                </>
              )}
            </button>
          </div>
        </div>
      </section>

      {matching && (
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100">
              <Loader2 className="h-7 w-7 animate-spin text-indigo-600" />
            </div>
            <p className="mt-5 text-sm font-semibold text-slate-900">
              Comparing your resume with the job description...
            </p>
            <p className="mt-1.5 max-w-md text-sm text-slate-500">
              We are checking skills, keywords, technologies, experience and education.
            </p>
          </div>
        </section>
      )}

      {result && !matching && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Match Result</h2>
            <Link
              to={`/match/${result.id}`}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700"
            >
              Open full details <Eye className="h-4 w-4" />
            </Link>
          </div>
          <MatchResultView analysis={result.analysis} />
        </section>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-4">
          <ClipboardList className="h-5 w-5 text-indigo-600" />
          <h2 className="font-semibold text-slate-900">My Matches</h2>
        </div>
        <div className="px-5 py-4">
          {loadingMatches ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
            </div>
          ) : matches.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Inbox className="h-10 w-10 text-slate-300" />
              <p className="mt-4 text-sm font-medium text-slate-700">
                No match results yet.
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Select a resume and a job description above to get started.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {matches.map((match) => (
                <li key={match.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50">
                      <FileText className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {match.resumeName || 'Untitled resume'}
                      </p>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1">
                          <Briefcase className="h-3.5 w-3.5" />
                          {match.jobTitle || 'Untitled role'}
                        </span>
                        {match.company && (
                          <span className="inline-flex items-center gap-1">
                            <Building2 className="h-3.5 w-3.5" />
                            {match.company}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays className="h-3.5 w-3.5" />
                          {formatDate(match.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="rounded-lg bg-indigo-50 px-3 py-1 text-sm font-bold text-indigo-700">
                      {match.matchPercentage}%
                    </span>
                    <Link
                      to={`/match/${match.id}`}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-indigo-600 transition hover:border-indigo-300 hover:bg-indigo-50"
                    >
                      View
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDelete(match.id)}
                      disabled={deletingId === match.id}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-500 transition hover:border-red-300 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                    >
                      {deletingId === match.id ? (
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

      <p className="text-center text-xs text-slate-400">
        Matching compares only the supplied resume and job description. Missing skills are never
        assumed to be present.
      </p>
    </div>
  )
}

export default ResumeJDMatcher