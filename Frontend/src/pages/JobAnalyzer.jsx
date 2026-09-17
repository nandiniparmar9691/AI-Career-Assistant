import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowRight,
  Briefcase,
  Building2,
  CalendarDays,
  CheckCircle2,
  Cloud,
  ClipboardList,
  Code,
  Database,
  ExternalLink,
  FileText,
  GraduationCap,
  Inbox,
  LayoutGrid,
  Layers,
  Loader2,
  LoaderCircle,
  Sparkles,
  Tags,
  Trash2,
  Users,
  Wrench,
} from 'lucide-react'
import {
  createJobDescription,
  deleteJobDescription,
  getErrorMessage,
  getJobDescriptions,
} from '../services/api'
import { useAuth } from '../context/AuthContext'

const MIN_DESCRIPTION_LENGTH = 100
const MAX_DESCRIPTION_LENGTH = 20000

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

const SectionCard = ({ icon: Icon, title, children }) => (
  <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
    <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-4">
      <Icon className="h-5 w-5 text-indigo-600" />
      <h4 className="text-sm font-semibold text-slate-900">{title}</h4>
    </div>
    <div className="px-5 py-4">{children}</div>
  </section>
)

const BadgeList = ({ items }) =>
  Array.isArray(items) && items.length ? (
    <div className="flex flex-wrap gap-2">
      {items.map((item, i) => (
        <span key={i} className="rounded-lg bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-700">
          {item}
        </span>
      ))}
    </div>
  ) : (
    <p className="text-sm text-slate-500">Not mentioned</p>
  )

const BulletList = ({ items }) =>
  Array.isArray(items) && items.length ? (
    <ul className="space-y-2.5">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-slate-700">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  ) : (
    <p className="text-sm text-slate-500">Not mentioned</p>
  )

const SummaryText = ({ text }) =>
  text ? (
    <p className="text-sm leading-relaxed text-slate-700">{text}</p>
  ) : (
    <p className="text-sm text-slate-500">Not specified</p>
  )

const ResultView = ({ jd }) => {
  const a = jd.analysis || {}

  return (
    <div className="space-y-4">
      <SectionCard icon={Briefcase} title="Job Overview">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Job Title</p>
            <p className="text-sm font-semibold text-slate-900">{a.jobTitle || jd.title || 'Not specified'}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Company</p>
            <p className="text-sm font-semibold text-slate-900">{a.company || jd.company || 'Not specified'}</p>
          </div>
          {a.jobType && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Job Type</p>
              <p className="text-sm text-slate-700">{a.jobType}</p>
            </div>
          )}
          {a.location && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Location</p>
              <p className="text-sm text-slate-700">{a.location}</p>
            </div>
          )}
          {a.experience && (
            <div className="sm:col-span-2">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Experience</p>
              <p className="text-sm text-slate-700">
                {renderExperience(a.experience)}
              </p>
            </div>
          )}
        </div>
      </SectionCard>

      <SectionCard icon={FileText} title="AI Job Summary">
        <SummaryText text={a.summary} />
      </SectionCard>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionCard icon={CheckCircle2} title="Required Skills">
          <BadgeList items={a.requiredSkills} />
        </SectionCard>
        <SectionCard icon={Sparkles} title="Preferred Skills">
          <BadgeList items={a.preferredSkills} />
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionCard icon={Code} title="Programming Languages">
          <BadgeList items={a.programmingLanguages} />
        </SectionCard>
        <SectionCard icon={LayoutGrid} title="Frameworks">
          <BadgeList items={a.frameworks} />
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <SectionCard icon={Database} title="Databases">
          <BadgeList items={a.databases} />
        </SectionCard>
        <SectionCard icon={Wrench} title="Tools">
          <BadgeList items={a.tools} />
        </SectionCard>
        <SectionCard icon={Cloud} title="Cloud Technologies">
          <BadgeList items={a.cloudTechnologies} />
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionCard icon={Users} title="Soft Skills">
          <BadgeList items={a.softSkills} />
        </SectionCard>
        <SectionCard icon={GraduationCap} title="Education & Certifications">
          {a.education?.length ? (
            <BadgeList items={a.education} />
          ) : (
            <p className="text-sm text-slate-500">Not specified</p>
          )}
          {a.certifications?.length ? (
            <div className="mt-4">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">Certifications</p>
              <BadgeList items={a.certifications} />
            </div>
          ) : null}
        </SectionCard>
      </div>

      <SectionCard icon={ClipboardList} title="Responsibilities">
        <BulletList items={a.responsibilities} />
      </SectionCard>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionCard icon={Tags} title="Important Keywords">
          <BadgeList items={a.keywords} />
        </SectionCard>
        <SectionCard icon={Layers} title="Technologies">
          <BadgeList items={a.technologies} />
        </SectionCard>
      </div>
    </div>
  )
}

const renderExperience = (exp) => {
  if (!exp) return 'Not specified'
  const parts = []
  if (exp.minimumYears) parts.push(`${exp.minimumYears}+ years`)
  if (exp.description) parts.push(exp.description.toLowerCase())
  return parts.length ? parts.join(' · ') : 'Not specified'
}

const JobAnalyzer = () => {
  const { logout } = useAuth()
  const [title, setTitle] = useState('')
  const [company, setCompany] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [result, setResult] = useState(null)
  const [jobDescriptions, setJobDescriptions] = useState([])
  const [loadingList, setLoadingList] = useState(true)
  const [listError, setListError] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [, setDeleteError] = useState(null)

  const loadJobDescriptions = useCallback(async (options = {}) => {
    const { reset = true } = options
    if (reset) {
      setLoadingList(true)
      setListError(null)
    }
    try {
      const { data } = await getJobDescriptions()
      setJobDescriptions(data.jobDescriptions || [])
    } catch (err) {
      const status = err.response?.status
      if (status === 401) {
        await logout()
        return
      }
      setListError(getErrorMessage(err))
    } finally {
      setLoadingList(false)
    }
  }, [logout])

  useEffect(() => {
    loadJobDescriptions({ reset: false })
  }, [loadJobDescriptions])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (submitting) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      const { data } = await createJobDescription({ title, company, description })
      setResult(data.jobDescription)
      setDescription('')
      await loadJobDescriptions()
    } catch (err) {
      const status = err.response?.status
      if (status === 401) {
        await logout()
        return
      }
      if (status === 429) {
        setSubmitError('You are analyzing too many job descriptions right now. Please wait a moment and try again.')
      } else if (status >= 500) {
        setSubmitError('The analysis service is temporarily unavailable. Please try again.')
      } else {
        setSubmitError(getErrorMessage(err))
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    if (deletingId) return
    setDeletingId(id)
    setDeleteError(null)
    try {
      await deleteJobDescription(id)
      setJobDescriptions((prev) => prev.filter((jd) => jd.id !== id))
      if (result && result.id === id) setResult(null)
    } catch (err) {
      const status = err.response?.status
      if (status === 401) {
        await logout()
        return
      }
      if (status === 403) {
        setDeleteError('You are not allowed to delete this job description.')
      } else if (status === 404) {
        setDeleteError('This job description no longer exists.')
        await loadJobDescriptions()
      } else if (status >= 500) {
        setDeleteError('Unable to delete right now. Please try again.')
      } else {
        setDeleteError(getErrorMessage(err))
      }
    } finally {
      setDeletingId(null)
    }
  }

  const trimmedDescription = description.trim()

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Job Description Analyzer</h1>
        <p className="mt-1.5 text-sm text-slate-500 sm:text-base">
          Analyze a job description to understand its skills, requirements and key responsibilities.
        </p>
      </div>

      <section className="mb-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-2.5 border-b border-slate-200 px-5 py-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50">
            <Briefcase className="h-6 w-6 text-indigo-600" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-900">New Job Description</h2>
            <p className="text-sm text-slate-500">Paste a job posting and let AI extract what matters most.</p>
          </div>
        </div>

        <form className="space-y-5 px-5 py-5" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="jd-title" className="mb-1.5 block text-sm font-medium text-slate-700">
                Job Title
              </label>
              <input
                id="jd-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
                placeholder="e.g. Senior Software Engineer"
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
              <p className="mt-1 text-xs text-slate-400">Optional</p>
            </div>
            <div>
              <label htmlFor="jd-company" className="mb-1.5 block text-sm font-medium text-slate-700">
                Company Name
              </label>
              <input
                id="jd-company"
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                maxLength={200}
                placeholder="e.g. Acme Corp (optional)"
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
              <p className="mt-1 text-xs text-slate-400">Optional</p>
            </div>
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label htmlFor="jd-description" className="block text-sm font-medium text-slate-700">
                Job Description
              </label>
              <span className="text-sm font-medium text-slate-400">
                {trimmedDescription.length.toLocaleString()}{' '}
                <span className="text-slate-300">/ {MAX_DESCRIPTION_LENGTH.toLocaleString()}</span>
              </span>
            </div>
            <textarea
              id="jd-description"
              rows={12}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Paste the complete job description here..."
              className="w-full resize-y rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
            {trimmedDescription.length > 0 && trimmedDescription.length < MIN_DESCRIPTION_LENGTH && (
              <p className="mt-1.5 text-xs text-amber-600">
                Job descriptions must be at least {MIN_DESCRIPTION_LENGTH} characters. Currently{' '}
                {trimmedDescription.length.toLocaleString()} characters.
              </p>
            )}
            {trimmedDescription.length > MAX_DESCRIPTION_LENGTH && (
              <p className="mt-1.5 text-xs text-red-600">
                Job description is too long. Maximum is {MAX_DESCRIPTION_LENGTH.toLocaleString()} characters.
              </p>
            )}
          </div>

          {submitError && <ErrorBanner message={submitError} onDismiss={() => setSubmitError(null)} />}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="submit"
              disabled={submitting || !trimmedDescription}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing Job Description...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Analyze Job Description
                </>
              )}
            </button>
          </div>
        </form>
      </section>

      {result && (
        <div className="mb-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Analysis Result</h2>
            <Link
              to={`/job-description/${result.id}`}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700"
            >
              View full details <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <ResultView jd={result} />
        </div>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-4">
          <ClipboardList className="h-5 w-5 text-indigo-600" />
          <h2 className="font-semibold text-slate-900">My Job Descriptions</h2>
        </div>
        <div className="px-5 py-4">
          {loadingList ? (
            <div className="flex items-center justify-center py-10">
              <LoaderCircle className="h-6 w-6 animate-spin text-indigo-600" />
            </div>
          ) : listError ? (
            <p className="text-sm text-red-600">{listError}</p>
          ) : jobDescriptions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Inbox className="h-10 w-10 text-slate-300" />
              <p className="mt-4 text-sm font-medium text-slate-700">No job descriptions analyzed yet.</p>
              <p className="mt-1 text-sm text-slate-500">
                Paste a job description above and click "Analyze Job Description" to get started.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {jobDescriptions.map((jd) => (
                <li key={jd.id} className="flex items-start gap-3 py-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50">
                    <FileText className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {jd.title || 'Untitled'}
                    </p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                      {jd.company && (
                        <span className="inline-flex items-center gap-1">
                          <Building2 className="h-3.5 w-3.5" />
                          {jd.company}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {formatDate(jd.createdAt)}
                      </span>
                    </div>
                    {jd.descriptionPreview && (
                      <p className="mt-1 line-clamp-2 text-sm text-slate-500">{jd.descriptionPreview}</p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Link
                      to={`/job-description/${jd.id}`}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-indigo-600 transition hover:border-indigo-300 hover:bg-indigo-50"
                    >
                      <ExternalLink className="h-4 w-4" />
                      View
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDelete(jd.id)}
                      disabled={deletingId === jd.id}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-500 transition hover:border-red-300 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />
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

export default JobAnalyzer