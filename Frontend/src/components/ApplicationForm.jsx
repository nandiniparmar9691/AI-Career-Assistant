import { useEffect, useState } from 'react'
import {
  AlertTriangle,
  Building2,
  Loader2,
  X,
} from 'lucide-react'
import {
  getErrorMessage,
  getJobDescriptions,
  getResumes,
} from '../services/api'
import { APPLICATION_STATUSES, STATUS_LABELS } from '../constants/applicationStatus'

const toDateInputValue = (value) => {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}

const emptyForm = () => ({
  company: '',
  jobTitle: '',
  jobUrl: '',
  location: '',
  employmentType: '',
  source: '',
  salary: '',
  resumeId: '',
  jobDescriptionId: '',
  status: 'SAVED',
  appliedDate: '',
  interviewDate: '',
  followUpDate: '',
  offerDate: '',
  notes: '',
  tagsText: '',
})

const fromApplication = (app) => ({
  company: app.company || '',
  jobTitle: app.jobTitle || '',
  jobUrl: app.jobUrl || '',
  location: app.location || '',
  employmentType: app.employmentType || '',
  source: app.source || '',
  salary: app.salary || '',
  resumeId: app.resumeId || '',
  jobDescriptionId: app.jobDescriptionId || '',
  status: app.status || 'SAVED',
  appliedDate: toDateInputValue(app.appliedDate),
  interviewDate: toDateInputValue(app.interviewDate),
  followUpDate: toDateInputValue(app.followUpDate),
  offerDate: toDateInputValue(app.offerDate),
  notes: app.notes || '',
  tagsText: (app.tags || []).join(', '),
})

const isValidUrl = (value) => {
  if (!value) return true
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

const isValidDate = (value) => {
  if (!value) return true
  return !Number.isNaN(new Date(value).getTime())
}

const Field = ({ label, required, children, className }) => (
  <div className={className}>
    <label className="mb-1.5 block text-sm font-medium text-slate-700">
      {label}
      {required && <span className="text-red-500"> *</span>}
    </label>
    {children}
  </div>
)

const inputClass =
  'w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20'

const ApplicationForm = ({
  initial,
  onClose,
  onSubmit,
  isSubmitting,
  error,
  onUnauthorized,
}) => {
  const [form, setForm] = useState(() =>
    initial ? fromApplication(initial) : emptyForm()
  )
  const [resumes, setResumes] = useState([])
  const [jobDescriptions, setJobDescriptions] = useState([])
  const [loadingLinked, setLoadingLinked] = useState(true)
  const [validationError, setValidationError] = useState(null)

  useEffect(() => {
    let active = true
    Promise.all([getResumes(), getJobDescriptions()])
      .then(([resumesRes, jdsRes]) => {
        if (!active) return
        setResumes(resumesRes.data.resumes || [])
        setJobDescriptions(jdsRes.data.jobDescriptions || [])
      })
      .catch(async (err) => {
        if (err.response?.status === 401) {
          if (onUnauthorized) await onUnauthorized()
          return
        }
        if (active) setValidationError(getErrorMessage(err))
      })
      .finally(() => {
        if (active) setLoadingLinked(false)
      })
    return () => {
      active = false
    }
  }, [onUnauthorized])

  const update = (key) => (e) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.company.trim()) {
      setValidationError('Please enter the company.')
      return
    }
    if (!form.jobTitle.trim()) {
      setValidationError('Please enter the job title.')
      return
    }
    if (!isValidUrl(form.jobUrl)) {
      setValidationError('Please provide a valid job URL.')
      return
    }
    for (const [field, label] of [
      ['appliedDate', 'applied date'],
      ['interviewDate', 'interview date'],
      ['followUpDate', 'follow-up date'],
      ['offerDate', 'offer date'],
    ]) {
      if (!isValidDate(form[field])) {
        setValidationError(`Please provide a valid ${label}.`)
        return
      }
    }

    const payload = {
      company: form.company.trim(),
      jobTitle: form.jobTitle.trim(),
      jobUrl: form.jobUrl.trim(),
      location: form.location.trim(),
      employmentType: form.employmentType.trim(),
      source: form.source.trim(),
      salary: form.salary.trim(),
      resumeId: form.resumeId || null,
      jobDescriptionId: form.jobDescriptionId || null,
      status: form.status,
      appliedDate: form.appliedDate || null,
      interviewDate: form.interviewDate || null,
      followUpDate: form.followUpDate || null,
      offerDate: form.offerDate || null,
      notes: form.notes,
      tags: (form.tagsText || '')
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
    }
    setValidationError(null)
    onSubmit(payload)
  }

  const title = initial ? 'Edit Application' : 'Add Application'

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4 sm:p-6">
      <div className="my-8 w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50">
              <Building2 className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900">{title}</h2>
              <p className="text-sm text-slate-500">
                Track an application and its key dates.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-5">
          {(validationError || error) && (
            <div className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              <span className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                {validationError || error}
              </span>
              <button
                type="button"
                onClick={() => setValidationError(null)}
                className="font-medium hover:opacity-80"
              >
                Dismiss
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Company" required>
              <input
                type="text"
                value={form.company}
                onChange={update('company')}
                placeholder="Example Corp"
                className={inputClass}
              />
            </Field>
            <Field label="Job Title" required>
              <input
                type="text"
                value={form.jobTitle}
                onChange={update('jobTitle')}
                placeholder="Frontend Developer"
                className={inputClass}
              />
            </Field>
            <Field label="Job URL">
              <input
                type="text"
                value={form.jobUrl}
                onChange={update('jobUrl')}
                placeholder="https://example.com/job"
                className={inputClass}
              />
            </Field>
            <Field label="Location">
              <input
                type="text"
                value={form.location}
                onChange={update('location')}
                placeholder="Indore"
                className={inputClass}
              />
            </Field>
            <Field label="Employment Type">
              <input
                type="text"
                value={form.employmentType}
                onChange={update('employmentType')}
                placeholder="Full-time"
                className={inputClass}
              />
            </Field>
            <Field label="Source">
              <input
                type="text"
                value={form.source}
                onChange={update('source')}
                placeholder="LinkedIn"
                className={inputClass}
              />
            </Field>
            <Field label="Salary">
              <input
                type="text"
                value={form.salary}
                onChange={update('salary')}
                placeholder="₹12 LPA"
                className={inputClass}
              />
            </Field>
            <Field label="Status">
              <select
                value={form.status}
                onChange={update('status')}
                className={inputClass}
              >
                {APPLICATION_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {STATUS_LABELS[status]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Resume" className="sm:col-span-2">
              <select
                value={form.resumeId}
                onChange={update('resumeId')}
                className={inputClass}
                disabled={loadingLinked}
              >
                <option value="">No linked resume</option>
                {resumes.map((resume) => (
                  <option key={resume.id} value={resume.id}>
                    {resume.fileName}
                  </option>
                ))}
              </select>
              {resumes.length === 0 && (
                <p className="mt-1.5 text-xs text-amber-600">
                  No resumes yet. Upload one in the Resume Analyzer first.
                </p>
              )}
            </Field>
            <Field label="Job Description" className="sm:col-span-2">
              <select
                value={form.jobDescriptionId}
                onChange={update('jobDescriptionId')}
                className={inputClass}
                disabled={loadingLinked}
              >
                <option value="">No linked job description</option>
                {jobDescriptions.map((jd) => (
                  <option key={jd.id} value={jd.id}>
                    {jd.title || 'Untitled'} · {jd.company || 'Unknown'}
                  </option>
                ))}
              </select>
              {jobDescriptions.length === 0 && (
                <p className="mt-1.5 text-xs text-amber-600">
                  No job descriptions yet. Analyze one in the Job Analyzer first.
                </p>
              )}
            </Field>
            <Field label="Applied Date">
              <input
                type="date"
                value={form.appliedDate}
                onChange={update('appliedDate')}
                className={inputClass}
              />
            </Field>
            <Field label="Interview Date">
              <input
                type="date"
                value={form.interviewDate}
                onChange={update('interviewDate')}
                className={inputClass}
              />
            </Field>
            <Field label="Follow-up Date">
              <input
                type="date"
                value={form.followUpDate}
                onChange={update('followUpDate')}
                className={inputClass}
              />
            </Field>
            <Field label="Offer Date">
              <input
                type="date"
                value={form.offerDate}
                onChange={update('offerDate')}
                className={inputClass}
              />
            </Field>
            <Field label="Tags" className="sm:col-span-2">
              <input
                type="text"
                value={form.tagsText}
                onChange={update('tagsText')}
                placeholder="React, MERN, Remote"
                className={inputClass}
              />
              <p className="mt-1.5 text-xs text-slate-500">
                Separate tags with commas.
              </p>
            </Field>
            <Field label="Notes" className="sm:col-span-2">
              <textarea
                value={form.notes}
                onChange={update('notes')}
                rows={3}
                placeholder="Recruiter contact, interview prep notes, follow-up details..."
                className={inputClass}
              />
            </Field>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || loadingLinked}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Application'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ApplicationForm