import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  Briefcase,
  CalendarDays,
  ClipboardList,
  Eye,
  Inbox,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  Search,
  Trash2,
} from 'lucide-react'
import {
  createApplication,
  deleteApplication,
  getApplications,
  getErrorMessage,
  updateApplication,
} from '../services/api'
import { useAuth } from '../context/AuthContext'
import { APPLICATION_STATUSES, STATUS_LABELS, STATUS_SORT_OPTIONS } from '../constants/applicationStatus'
import StatusBadge from '../components/StatusBadge'
import ApplicationForm from '../components/ApplicationForm'

const PAGE_SIZE = 8

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

const OverviewCard = ({ label, value, accent }) => (
  <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
    <p className={`mt-1.5 text-2xl font-bold ${accent || 'text-slate-900'}`}>{value}</p>
  </div>
)

const JobApplicationTracker = () => {
  const { logout } = useAuth()

  const [applications, setApplications] = useState([])
  const [overview, setOverview] = useState({
    total: 0,
    applied: 0,
    interviews: 0,
    offers: 0,
    rejected: 0,
  })
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [status, setStatus] = useState('ALL')
  const [sort, setSort] = useState('latest')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const [modalOpen, setModalOpen] = useState(false)
  const [editingApp, setEditingApp] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let active = true
    const load = async () => {
      setError(null)
      try {
        const params = { page, limit: PAGE_SIZE, sort }
        if (status !== 'ALL') params.status = status
        if (search) params.search = search
        const { data } = await getApplications(params)
        if (!active) return
        setApplications(data.applications || [])
        setPagination(data.pagination || { page: 1, totalPages: 1 })
        if (data.overview) setOverview(data.overview)
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
  }, [page, status, search, sort, reloadKey, logout])

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim())
      setPage(1)
    }, 350)
    return () => clearTimeout(timer)
  }, [searchInput])

  const handleAdd = () => {
    setEditingApp(null)
    setModalOpen(true)
  }

  const handleEdit = (app) => {
    setEditingApp(app)
    setModalOpen(true)
  }

  const handleSubmit = async (payload) => {
    if (saving) return
    setSaving(true)
    setError(null)
    try {
      if (editingApp) {
        await updateApplication(editingApp.id, payload)
      } else {
        await createApplication(payload)
      }
      setModalOpen(false)
      setReloadKey((key) => key + 1)
    } catch (err) {
      if (err.response?.status === 401) {
        await logout()
        return
      }
      setError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (deletingId) return
    if (!window.confirm('Delete this job application?')) return
    setDeletingId(id)
    setError(null)
    try {
      await deleteApplication(id)
      setReloadKey((key) => key + 1)
    } catch (err) {
      if (err.response?.status === 401) {
        await logout()
        return
      }
      setError(getErrorMessage(err))
    } finally {
      setDeletingId(null)
    }
  }

  const setFilter = (setter) => (value) => {
    setter(value)
    setPage(1)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            Job Application Tracker
          </h1>
          <p className="mt-1.5 text-sm text-slate-500 sm:text-base">
            Track your job applications, interviews, follow-ups, and offers in one place.
          </p>
        </div>
        <button
          type="button"
          onClick={handleAdd}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" />
          Add Application
        </button>
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

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <OverviewCard label="Total Applications" value={overview.total} />
        <OverviewCard label="Applied" value={overview.applied} accent="text-indigo-600" />
        <OverviewCard label="Interviews" value={overview.interviews} accent="text-violet-600" />
        <OverviewCard label="Offers" value={overview.offers} accent="text-emerald-600" />
        <OverviewCard label="Rejected" value={overview.rejected} accent="text-red-600" />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Status</label>
            <select
              value={status}
              onChange={(e) => setFilter(setStatus)(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="ALL">All statuses</option>
              {APPLICATION_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Search</label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search company or job title..."
                className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Sort by</label>
            <select
              value={sort}
              onChange={(e) => setFilter(setSort)(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              {STATUS_SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-indigo-600" />
            <h2 className="font-semibold text-slate-900">Applications</h2>
          </div>
          <span className="text-sm text-slate-500">
            {pagination.total ?? 0} total
          </span>
        </div>

        <div className="px-5 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-14">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
            </div>
          ) : applications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-center">
              <Inbox className="h-10 w-10 text-slate-300" />
              <p className="mt-4 text-sm font-medium text-slate-700">
                {(status !== 'ALL' || search)
                  ? 'No applications match these filters.'
                  : 'No applications yet.'}
              </p>
              {status === 'ALL' && !search && (
                <p className="mt-1 text-sm text-slate-500">
                  Click "Add Application" to start tracking your job search.
                </p>
              )}
            </div>
          ) : (
            <ul className="space-y-3">
              {applications.map((app) => (
                <li
                  key={app.id}
                  className="flex flex-col gap-4 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between lg:p-5"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-base font-semibold text-slate-900">
                        {app.company}
                      </p>
                      <StatusBadge status={app.status} />
                    </div>
                    <p className="mt-0.5 flex items-center gap-1.5 text-sm text-slate-600">
                      <Briefcase className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      {app.jobTitle}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                      {app.location && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {app.location}
                        </span>
                      )}
                      {app.appliedDate && (
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays className="h-3.5 w-3.5" />
                          Applied {formatDate(app.appliedDate)}
                        </span>
                      )}
                      {app.interviewDate && (
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays className="h-3.5 w-3.5 text-violet-600" />
                          Interview {formatDate(app.interviewDate)}
                        </span>
                      )}
                      {app.followUpDate && (
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays className="h-3.5 w-3.5" />
                          Follow-up {formatDate(app.followUpDate)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <Link
                      to={`/applications/${app.id}`}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-indigo-600 transition hover:border-indigo-300 hover:bg-indigo-50"
                    >
                      <Eye className="h-4 w-4" />
                      View
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleEdit(app)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
                    >
                      <Pencil className="h-4 w-4" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(app.id)}
                      disabled={deletingId === app.id}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-500 transition hover:border-red-300 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                    >
                      {deletingId === app.id ? (
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

          {!loading && pagination.totalPages > 1 && (
            <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
              <button
                type="button"
                disabled={pagination.page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-lg border border-slate-200 px-3.5 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-sm text-slate-500">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                type="button"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border border-slate-200 px-3.5 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </section>

      {modalOpen && (
        <ApplicationForm
          initial={editingApp}
          onClose={() => setModalOpen(false)}
          onSubmit={handleSubmit}
          isSubmitting={saving}
          error={error}
          onUnauthorized={logout}
        />
      )}
    </div>
  )
}

export default JobApplicationTracker