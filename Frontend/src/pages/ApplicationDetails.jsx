import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowLeft,
  Briefcase,
  Building2,
  CalendarDays,
  ExternalLink,
  FileSearch,
  Globe,
  Inbox,
  Loader2,
  MapPin,
  Pencil,
  Save,
  Trash2,
} from 'lucide-react'
import {
  deleteApplication,
  getApplicationById,
  getErrorMessage,
  updateApplication,
  updateApplicationStatus,
} from '../services/api'
import { useAuth } from '../context/AuthContext'
import { APPLICATION_STATUSES, STATUS_LABELS } from '../constants/applicationStatus'
import StatusBadge from '../components/StatusBadge'
import ApplicationForm from '../components/ApplicationForm'

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

const safeJobUrl = (value) => {
  if (!value) return null
  try {
    const url = new URL(value)
    if (url.protocol === 'http:' || url.protocol === 'https:') return url.href
    return null
  } catch {
    return null
  }
}

const DetailRow = ({ label, value }) => (
  <div className="flex flex-col gap-0.5">
    <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</dt>
    <dd className="text-sm text-slate-900">{value || '—'}</dd>
  </div>
)

const ApplicationDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { logout } = useAuth()

  const [application, setApplication] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [notFound, setNotFound] = useState(false)

  const [draftStatus, setDraftStatus] = useState('')
  const [savingStatus, setSavingStatus] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [savingEdit, setSavingEdit] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [editError, setEditError] = useState(null)

  useEffect(() => {
    let active = true
    const loadApp = async () => {
      setLoading(true)
      setError(null)
      setNotFound(false)
      try {
        const { data } = await getApplicationById(id)
        if (!active) return
        setApplication(data.application)
        setDraftStatus(data.application.status)
      } catch (err) {
        if (err.response?.status === 401) {
          await logout()
          return
        }
        if (active) {
          if (err.response?.status === 404) {
            setNotFound(true)
          } else {
            setError(getErrorMessage(err))
          }
        }
      } finally {
        if (active) setLoading(false)
      }
    }
    loadApp()
    return () => {
      active = false
    }
  }, [id, logout])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-7 w-7 animate-spin text-indigo-600" />
      </div>
    )
  }

  if (notFound || (!application && !error)) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
        <Inbox className="h-10 w-10 text-slate-300" />
        <p className="mt-4 text-sm font-semibold text-slate-900">Application not found.</p>
        <p className="mt-1 text-sm text-slate-500">
          It may have been deleted, or you do not have access to it.
        </p>
        <Link
          to="/applications"
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to applications
        </Link>
      </div>
    )
  }

  const app = application
  const jobUrl = safeJobUrl(app.jobUrl)

  const handleStatusSave = async () => {
    if (savingStatus || draftStatus === app.status) return
    setSavingStatus(true)
    setError(null)
    try {
      const { data } = await updateApplicationStatus(app.id, draftStatus)
      setApplication(data.application)
    } catch (err) {
      if (err.response?.status === 401) {
        await logout()
        return
      }
      setError(getErrorMessage(err))
    } finally {
      setSavingStatus(false)
    }
  }

  const handleSubmit = async (payload) => {
    if (savingEdit) return
    setSavingEdit(true)
    setEditError(null)
    try {
      const { data } = await updateApplication(app.id, payload)
      setApplication(data.application)
      setDraftStatus(data.application.status)
      setModalOpen(false)
      setError(null)
    } catch (err) {
      if (err.response?.status === 401) {
        await logout()
        return
      }
      setEditError(getErrorMessage(err))
    } finally {
      setSavingEdit(false)
    }
  }

  const handleDelete = async () => {
    if (deleting) return
    if (!window.confirm('Delete this job application?')) return
    setDeleting(true)
    setError(null)
    try {
      await deleteApplication(app.id)
      navigate('/applications')
    } catch (err) {
      if (err.response?.status === 401) {
        await logout()
        return
      }
      setError(getErrorMessage(err))
      setDeleting(false)
    }
  }

  const timelineEvents = [
    { label: 'Created', date: app.createdAt },
    { label: 'Applied', date: app.appliedDate },
    { label: 'Interview', date: app.interviewDate },
    { label: 'Follow-up', date: app.followUpDate },
    { label: 'Offer', date: app.offerDate },
  ].filter((event) => event.date)

  const statusChanged = draftStatus !== app.status

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link
          to="/applications"
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Applications
        </Link>
      </div>

      {error && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <span className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {error}
          </span>
          <button
            type="button"
            onClick={() => setError(null)}
            className="font-medium hover:opacity-80"
          >
            Dismiss
          </button>
        </div>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                {app.company}
              </h1>
              <StatusBadge status={app.status} />
            </div>
            <p className="mt-1.5 flex items-center gap-1.5 text-sm text-slate-600 sm:text-base">
              <Briefcase className="h-4 w-4 text-slate-400" />
              {app.jobTitle}
            </p>
            {app.location && (
              <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
                <MapPin className="h-4 w-4 text-slate-400" />
                {app.location}
              </p>
            )}
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {jobUrl && (
              <a
                href={jobUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-indigo-600 transition hover:border-indigo-300 hover:bg-indigo-50"
              >
                <ExternalLink className="h-4 w-4" />
                View Job
              </a>
            )}
            <button
              type="button"
              onClick={() => {
                setEditError(null)
                setModalOpen(true)
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
            >
              <Pencil className="h-4 w-4" />
              Edit
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-500 transition hover:border-red-300 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
            >
              {deleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Delete
            </button>
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-slate-200 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900">Update status</p>
              <p className="text-xs text-slate-500">
                Current status: {STATUS_LABELS[app.status] || app.status}
              </p>
            </div>
            <div className="flex gap-2">
              <select
                value={draftStatus}
                onChange={(e) => setDraftStatus(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 sm:w-auto"
              >
                {APPLICATION_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {STATUS_LABELS[status]}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleStatusSave}
                disabled={savingStatus || !statusChanged}
                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
              >
                {savingStatus ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm lg:col-span-2">
          <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-4">
            <Building2 className="h-5 w-5 text-indigo-600" />
            <h2 className="font-semibold text-slate-900">Application details</h2>
          </div>
          <div className="grid grid-cols-1 gap-x-6 gap-y-5 px-5 py-5 sm:grid-cols-2">
            <DetailRow label="Company" value={app.company} />
            <DetailRow label="Job Title" value={app.jobTitle} />
            <DetailRow label="Location" value={app.location} />
            <DetailRow label="Employment Type" value={app.employmentType} />
            <DetailRow label="Source" value={app.source} />
            <DetailRow label="Salary" value={app.salary} />
            <DetailRow label="Applied Date" value={formatDate(app.appliedDate)} />
            <DetailRow label="Interview Date" value={formatDate(app.interviewDate)} />
            <DetailRow label="Follow-up Date" value={formatDate(app.followUpDate)} />
            <DetailRow label="Offer Date" value={formatDate(app.offerDate)} />
          </div>

          <div className="grid grid-cols-1 gap-x-6 gap-y-5 border-t border-slate-100 px-5 py-5 sm:grid-cols-2">
            <DetailRow label="Linked Resume" value={app.resumeName} />
            <DetailRow
              label="Linked Job Description"
              value={
                app.jobDescriptionTitle
                  ? `${app.jobDescriptionTitle}${app.jobDescriptionCompany ? ` · ${app.jobDescriptionCompany}` : ''}`
                  : ''
              }
            />
          </div>

          {app.tags.length > 0 && (
            <div className="border-t border-slate-100 px-5 py-5">
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Tags</dt>
              <dd className="mt-2 flex flex-wrap gap-2">
                {app.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700"
                  >
                    {tag}
                  </span>
                ))}
              </dd>
            </div>
          )}

          <div className="border-t border-slate-100 px-5 py-5">
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Notes</dt>
            <dd className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-800">
              {app.notes || 'No notes yet.'}
            </dd>
          </div>
        </section>

        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-4">
              <CalendarDays className="h-5 w-5 text-indigo-600" />
              <h2 className="font-semibold text-slate-900">Timeline</h2>
            </div>
            <div className="px-5 py-5">
              {timelineEvents.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No dated events yet. Add dates to see a timeline.
                </p>
              ) : (
                <ol className="space-y-0">
                  {timelineEvents.map((event, index) => (
                    <li key={event.label} className="flex gap-3 pb-5 last:pb-0">
                      <div className="flex flex-col items-center">
                        <span
                          className={`mt-1 h-2.5 w-2.5 rounded-full ${
                            index === timelineEvents.length - 1
                              ? 'bg-slate-400'
                              : 'ring-2 ring-indigo-100'
                          } ${index === timelineEvents.length - 1 ? '' : 'bg-indigo-500'}`}
                        />
                        {index < timelineEvents.length - 1 && (
                          <span className="w-px flex-1 bg-slate-200" />
                        )}
                      </div>
                      <div className="pb-1">
                        <p className="text-sm font-medium text-slate-900">{event.label}</p>
                        <p className="text-sm text-slate-500">{formatDate(event.date)}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-4">
              <FileSearch className="h-5 w-5 text-indigo-600" />
              <h2 className="font-semibold text-slate-900">Links</h2>
            </div>
            <div className="space-y-3 px-5 py-5">
              {jobUrl ? (
                <a
                  href={jobUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm font-medium text-indigo-600 transition hover:text-indigo-700"
                >
                  <Globe className="h-4 w-4 shrink-0" />
                  View original job posting
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              ) : (
                <p className="text-sm text-slate-500">No job URL provided.</p>
              )}
              {app.resumeName && (
                <Link
                  to={`/resume/${app.resumeId}`}
                  className="flex items-center gap-2 text-sm font-medium text-indigo-600 transition hover:text-indigo-700"
                >
                  <FileSearch className="h-4 w-4 shrink-0" />
                  View linked resume
                </Link>
              )}
              {!app.resumeName && !app.jobDescriptionId && !jobUrl && (
                <p className="text-sm text-slate-500">Nothing linked yet.</p>
              )}
            </div>
          </section>
        </div>
      </div>

      {modalOpen && (
        <ApplicationForm
          initial={app}
          onClose={() => setModalOpen(false)}
          onSubmit={handleSubmit}
          isSubmitting={savingEdit}
          error={editError}
          onUnauthorized={logout}
        />
      )}
    </div>
  )
}

export default ApplicationDetails