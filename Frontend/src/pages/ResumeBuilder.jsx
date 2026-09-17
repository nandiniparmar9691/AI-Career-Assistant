import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowLeft,
  Briefcase,
  CalendarDays,
  Download,
  FileText,
  Inbox,
  Loader2,
  Plus,
  Save,
  Sparkles,
  Trash2,
  Wand2,
} from 'lucide-react'
import {
  deleteResumeBuilderResume,
  downloadResumePdf,
  generateResume,
  getErrorMessage,
  getJobDescriptions,
  getResumeBuilderResumeById,
  getResumeBuilderResumes,
  getResumes,
  updateResumeBuilderResume,
} from '../services/api'
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

const TextInput = ({ label, value, onChange, placeholder, type = 'text' }) => (
  <div>
    <label className="mb-1 block text-xs font-medium text-slate-600">{label}</label>
    <input
      type={type}
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
    />
  </div>
)

const TextAreaField = ({ label, value, onChange, placeholder, rows = 3 }) => (
  <div>
    <label className="mb-1 block text-xs font-medium text-slate-600">{label}</label>
    <textarea
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
    />
  </div>
)

const LinesField = ({ label, value, onChange, placeholder, rows = 4 }) => (
  <div>
    <label className="mb-1 block text-xs font-medium text-slate-600">{label}</label>
    <textarea
      value={(value || []).join('\n')}
      onChange={(e) =>
        onChange(
          e.target.value
            .split('\n')
            .map((line) => line.trim())
            .filter(Boolean)
        )
      }
      placeholder={placeholder}
      rows={rows}
      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
    />
  </div>
)

const SectionCard = ({ title, icon: Icon, onAdd, disabled, children }) => (
  <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
    <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-3.5">
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5 text-indigo-600" />
        <h3 className="font-semibold text-slate-900">{title}</h3>
      </div>
      {onAdd && (
        <button
          type="button"
          onClick={onAdd}
          disabled={disabled}
          className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 transition hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus className="h-3.5 w-3.5" /> Add
        </button>
      )}
    </div>
    <div className="px-5 py-4">{children}</div>
  </div>
)

const emptyExperience = () => ({
  company: '',
  role: '',
  location: '',
  startDate: '',
  endDate: '',
  bullets: [],
})
const emptyProject = () => ({
  name: '',
  technologies: [],
  description: '',
  bullets: [],
  link: '',
})
const emptyEducation = () => ({
  institution: '',
  degree: '',
  field: '',
  location: '',
  startDate: '',
  endDate: '',
  details: [],
})
const emptyCertification = () => ({ name: '', issuer: '', date: '', link: '' })

// ---- ATS_CLASSIC preview ----
const PreviewSection = ({ title, children }) =>
  children ? (
    <div className="mb-3">
      <h4 className="border-b border-slate-300 text-[11px] font-bold uppercase tracking-widest text-slate-900">
        {title}
      </h4>
      <div className="mt-1.5 text-[13px] leading-relaxed text-slate-800">{children}</div>
    </div>
  ) : null

const ResumePreview = ({ resume }) => {
  const content = resume && resume.content ? resume.content : {}
  const contact = content.contact || {}
  const contactParts = [
    contact.email,
    contact.phone,
    contact.location,
    contact.linkedin,
    contact.github,
    contact.portfolio,
  ].filter(Boolean)
  const name = contact.name || resume?.targetRole || 'ATS Resume'
  const skills = Array.isArray(content.skills) ? content.skills : []
  const experience = Array.isArray(content.experience) ? content.experience : []
  const projects = Array.isArray(content.projects) ? content.projects : []
  const education = Array.isArray(content.education) ? content.education : []
  const certifications = Array.isArray(content.certifications) ? content.certifications : []
  const additional = content.additional || {}

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-5 py-3.5">
        <h3 className="font-semibold text-slate-900">Live Preview</h3>
        <p className="text-xs text-slate-500">ATS_CLASSIC · clean text layout</p>
      </div>
      <div className="px-5 py-5 sm:px-8">
        <div className="mx-auto max-w-2xl rounded-lg border border-slate-200 bg-white p-6 font-sans">
          <h2 className="text-center text-xl font-bold text-slate-900">{name}</h2>
          {resume?.targetRole && (
            <p className="mt-0.5 text-center text-sm font-medium text-slate-600">
              {resume.targetRole}
            </p>
          )}
          {contactParts.length > 0 && (
            <p className="mt-1.5 text-center text-xs text-slate-600">
              {contactParts.join('  |  ')}
            </p>
          )}

          <div className="mt-4">
            {content.summary ? (
              <PreviewSection title="Professional Summary">
                <p>{content.summary}</p>
              </PreviewSection>
            ) : null}

            {skills.length > 0 ? (
              <PreviewSection title="Technical Skills">
                <div className="space-y-1">
                  {skills.map((group, i) =>
                    group.items && group.items.length ? (
                      <p key={i}>
                        {group.category ? `${group.category}: ` : ''}
                        {group.items.join(', ')}
                      </p>
                    ) : null
                  )}
                </div>
              </PreviewSection>
            ) : null}

            {experience.length > 0 ? (
              <PreviewSection title="Work Experience">
                <div className="space-y-3">
                  {experience.map((entry, i) => {
                    const heading = [entry.role, entry.company].filter(Boolean).join(', ')
                    const meta = [entry.location, entry.startDate, entry.endDate]
                      .filter(Boolean)
                      .join('  |  ')
                    return (
                      <div key={i}>
                        {heading && <p className="font-semibold text-slate-900">{heading}</p>}
                        {meta && <p className="text-xs text-slate-500">{meta}</p>}
                        {(entry.bullets || []).length > 0 && (
                          <ul className="mt-1 list-disc space-y-0.5 pl-4">
                            {entry.bullets.map((b, j) => (
                              <li key={j}>{b}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )
                  })}
                </div>
              </PreviewSection>
            ) : null}

            {projects.length > 0 ? (
              <PreviewSection title="Projects">
                <div className="space-y-3">
                  {projects.map((project, i) => {
                    const heading = [project.name, project.link].filter(Boolean).join('  -  ')
                    return (
                      <div key={i}>
                        {heading && <p className="font-semibold text-slate-900">{heading}</p>}
                        {project.technologies && project.technologies.length > 0 && (
                          <p className="text-xs text-slate-500">
                            Technologies: {project.technologies.join(', ')}
                          </p>
                        )}
                        {project.description && <p>{project.description}</p>}
                        {(project.bullets || []).length > 0 && (
                          <ul className="mt-1 list-disc space-y-0.5 pl-4">
                            {project.bullets.map((b, j) => (
                              <li key={j}>{b}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )
                  })}
                </div>
              </PreviewSection>
            ) : null}

            {education.length > 0 ? (
              <PreviewSection title="Education">
                <div className="space-y-2">
                  {education.map((entry, i) => {
                    const heading = [entry.degree, entry.field, entry.institution]
                      .filter(Boolean)
                      .join(', ')
                    const meta = [entry.location, entry.startDate, entry.endDate]
                      .filter(Boolean)
                      .join('  |  ')
                    return (
                      <div key={i}>
                        {heading && <p className="font-semibold text-slate-900">{heading}</p>}
                        {meta && <p className="text-xs text-slate-500">{meta}</p>}
                        {(entry.details || []).length > 0 && (
                          <ul className="mt-1 list-disc space-y-0.5 pl-4">
                            {entry.details.map((d, j) => (
                              <li key={j}>{d}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )
                  })}
                </div>
              </PreviewSection>
            ) : null}

            {certifications.length > 0 ? (
              <PreviewSection title="Certifications">
                <div className="space-y-1">
                  {certifications.map((cert, i) => (
                    <p key={i}>
                      {[cert.name, cert.issuer, cert.date, cert.link].filter(Boolean).join('  |  ')}
                    </p>
                  ))}
                </div>
              </PreviewSection>
            ) : null}

            {(additional.languages?.length ||
              additional.achievements?.length ||
              additional.interests?.length) ? (
              <PreviewSection title="Additional Information">
                <div className="space-y-1">
                  {additional.languages?.length ? (
                    <p>Languages: {additional.languages.join(', ')}</p>
                  ) : null}
                  {additional.achievements?.length ? (
                    <p>Achievements: {additional.achievements.join(', ')}</p>
                  ) : null}
                  {additional.interests?.length ? (
                    <p>Interests: {additional.interests.join(', ')}</p>
                  ) : null}
                </div>
              </PreviewSection>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}

// ---- ATS Optimization info panel ----
const AtsOptimizationPanel = ({ atsMetadata }) => {
  const metadata = atsMetadata || {}
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-3.5">
        <Sparkles className="h-5 w-5 text-indigo-600" />
        <h3 className="font-semibold text-slate-900">ATS Optimization</h3>
      </div>
      <div className="space-y-4 px-5 py-4 text-sm">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Keywords used
          </p>
          {metadata.keywordsUsed?.length ? (
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {metadata.keywordsUsed.map((keyword, i) => (
                <span
                  key={i}
                  className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700"
                >
                  {keyword}
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-1 text-slate-500">No keywords recorded.</p>
          )}
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Not added
          </p>
          {metadata.keywordsNotUsed?.length ? (
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {metadata.keywordsNotUsed.map((keyword, i) => (
                <span
                  key={i}
                  className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700"
                >
                  {keyword}
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-1 text-slate-500">
              None. Only demonstrated skills are added to the resume.
            </p>
          )}
          {(metadata.keywordsNotUsed?.length ?? 0) > 0 && (
            <p className="mt-1.5 text-xs text-slate-500">
              Reason: not demonstrated in the source resume. Not added as your skills.
            </p>
          )}
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Optimization notes
          </p>
          {metadata.optimizationNotes?.length ? (
            <ul className="mt-1.5 list-disc space-y-1 pl-4 text-slate-700">
              {metadata.optimizationNotes.map((note, i) => (
                <li key={i}>{note}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 text-slate-500">No notes recorded.</p>
          )}
        </div>
      </div>
    </div>
  )
}

const ResumeBuilder = () => {
  const { id: routeId } = useParams()
  const { logout } = useAuth()

  const [resumes, setResumes] = useState([])
  const [jobDescriptions, setJobDescriptions] = useState([])
  const [history, setHistory] = useState([])
  const [selectedResume, setSelectedResume] = useState('')
  const [selectedJd, setSelectedJd] = useState('')
  const [targetRoleInput, setTargetRoleInput] = useState('')
  const [loadingPage, setLoadingPage] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [error, setError] = useState(null)
  const [resume, setResume] = useState(null)
  const [savedSnapshot, setSavedSnapshot] = useState(null)
  const [loadingResume, setLoadingResume] = useState(false)

  const pdfAnchor = useRef(null)

  const triggerBlobDownload = (blob, filename) => {
    const url = window.URL.createObjectURL(blob)
    if (pdfAnchor.current) {
      pdfAnchor.current.href = url
      pdfAnchor.current.download = filename || 'ATS_Resume.pdf'
      pdfAnchor.current.click()
    }
    window.URL.revokeObjectURL(url)
  }

  const handleDownloadResumeItem = async (id) => {
    if (downloading) return
    setDownloading(true)
    setError(null)
    try {
      const res = await downloadResumePdf(id)
      const disposition = res.headers && res.headers['content-disposition']
      const match = disposition && disposition.match(/filename="?([^"]+)"?/)
      triggerBlobDownload(
        new Blob([res.data]),
        (match && match[1]) || 'ATS_Resume.pdf'
      )
    } catch (err) {
      const status = err.response?.status
      if (status === 401) {
        await logout()
        return
      }
      setError(
        err.response?.data?.message ||
          'Unable to download the PDF right now. Please try again.'
      )
    } finally {
      setDownloading(false)
    }
  }

  useEffect(() => {
    let active = true
    const load = async () => {
      setLoadingPage(true)
      setError(null)
      try {
        const [resumesRes, jdsRes, builderRes] = await Promise.all([
          getResumes(),
          getJobDescriptions(),
          getResumeBuilderResumes(),
        ])
        if (!active) return
        setResumes(resumesRes.data.resumes || [])
        setJobDescriptions(jdsRes.data.jobDescriptions || [])
        setHistory(builderRes.data.resumes || [])
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

  useEffect(() => {
    if (!routeId) return
    let active = true
    const load = async () => {
      setLoadingResume(true)
      setError(null)
      try {
        const { data } = await getResumeBuilderResumeById(routeId)
        if (!active) return
        setResume(data.resume || null)
        setSavedSnapshot(JSON.stringify(data.resume || null))
      } catch (err) {
        if (err.response?.status === 401) {
          await logout()
          return
        }
        if (active) setError(getErrorMessage(err))
      } finally {
        if (active) setLoadingResume(false)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [routeId, logout])

  const refreshHistory = async () => {
    try {
      const { data } = await getResumeBuilderResumes()
      setHistory(data.resumes || [])
    } catch (err) {
      if (err.response?.status === 401) {
        await logout()
      }
    }
  }

  const handleGenerate = async () => {
    if (generating || !selectedResume) return
    setGenerating(true)
    setError(null)
    try {
      const { data } = await generateResume({
        sourceResumeId: selectedResume,
        jobDescriptionId: selectedJd || undefined,
        targetRole: targetRoleInput,
      })
      setResume(data.resume)
      setSavedSnapshot(JSON.stringify(data.resume))
      await refreshHistory()
    } catch (err) {
      const status = err.response?.status
      if (status === 401) {
        await logout()
        return
      }
      setError(err.response?.data?.message || getErrorMessage(err))
    } finally {
      setGenerating(false)
    }
  }

  const dirty = resume && savedSnapshot !== JSON.stringify(resume)

  const handleSave = async () => {
    if (saving || !resume || !resume.id) return
    setSaving(true)
    setError(null)
    try {
      const { data } = await updateResumeBuilderResume(resume.id, {
        title: resume.title,
        targetRole: resume.targetRole,
        template: resume.template,
        content: resume.content,
        atsMetadata: resume.atsMetadata,
      })
      setResume(data.resume)
      setSavedSnapshot(JSON.stringify(data.resume))
      await refreshHistory()
    } catch (err) {
      const status = err.response?.status
      if (status === 401) {
        await logout()
        return
      }
      setError(err.response?.data?.message || getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const handleDownload = async () => {
    if (!resume || !resume.id || downloading) return
    setDownloading(true)
    setError(null)
    try {
      if (dirty) {
        const { data } = await updateResumeBuilderResume(resume.id, {
          title: resume.title,
          targetRole: resume.targetRole,
          template: resume.template,
          content: resume.content,
          atsMetadata: resume.atsMetadata,
        })
        setResume(data.resume)
        setSavedSnapshot(JSON.stringify(data.resume))
      }
      const res = await downloadResumePdf(resume.id)
      const disposition = res.headers && res.headers['content-disposition']
      const match = disposition && disposition.match(/filename="?([^"]+)"?/)
      const blob = new Blob([res.data])
      const url = window.URL.createObjectURL(blob)
      if (pdfAnchor.current) {
        pdfAnchor.current.href = url
        pdfAnchor.current.download = (match && match[1]) || 'ATS_Resume.pdf'
        pdfAnchor.current.click()
      }
      window.URL.revokeObjectURL(url)
    } catch (err) {
      const status = err.response?.status
      if (status === 401) {
        await logout()
        return
      }
      setError(
        err.response?.data?.message ||
          'Unable to download the PDF right now. Please try again.'
      )
    } finally {
      setDownloading(false)
    }
  }

  const handleDelete = async (id) => {
    if (deletingId) return
    if (!window.confirm('Delete this generated resume?')) return
    setDeletingId(id)
    setError(null)
    try {
      await deleteResumeBuilderResume(id)
      setHistory((prev) => prev.filter((h) => h.id !== id))
      if (resume && resume.id === id) {
        setResume(null)
        setSavedSnapshot(null)
      }
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

  // ---- immutable content updates ----
  const patchContent = (updater) => {
    setResume((prev) => {
      if (!prev) return prev
      return { ...prev, content: updater(prev.content || {}) }
    })
  }

  const setContactField = (field, value) =>
    patchContent((c) => ({ ...c, contact: { ...(c.contact || {}), [field]: value } }))
  const setSummary = (value) => patchContent((c) => ({ ...c, summary: value }))
  const setAdditional = (field, value) =>
    patchContent((c) => ({
      ...c,
      additional: { ...(c.additional || {}), [field]: value },
    }))

  const setSkills = (skills) => patchContent((c) => ({ ...c, skills }))
  const setExperience = (experience) => patchContent((c) => ({ ...c, experience }))
  const setProjects = (projects) => patchContent((c) => ({ ...c, projects }))
  const setEducation = (education) => patchContent((c) => ({ ...c, education }))
  const setCertifications = (certifications) =>
    patchContent((c) => ({ ...c, certifications }))

  const setTargetRole = (value) => setResume((prev) => (prev ? { ...prev, targetRole: value } : prev))

  if (loadingPage || loadingResume) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-500">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  if (error && !resume) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <Link
          to="/resume-builder"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 transition hover:text-indigo-700"
        >
          <ArrowLeft className="h-4 w-4" /> Back to ATS Resume Builder
        </Link>
        <div className="mx-auto mt-4 flex h-11 w-11 items-center justify-center rounded-full bg-red-50">
          <AlertTriangle className="h-5 w-5 text-red-600" />
        </div>
        <p className="mt-3 text-sm text-red-600">{error}</p>
      </div>
    )
  }

  const content = resume ? resume.content || {} : {}
  const contact = content.contact || {}
  const skills = Array.isArray(content.skills) ? content.skills : []
  const experience = Array.isArray(content.experience) ? content.experience : []
  const projects = Array.isArray(content.projects) ? content.projects : []
  const education = Array.isArray(content.education) ? content.education : []
  const certifications = Array.isArray(content.certifications) ? content.certifications : []
  const additional = content.additional || {}

  // Setup screen (no resume loaded yet)
  if (!resume) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">ATS Resume Builder</h1>
          <p className="mt-1.5 text-sm text-slate-500 sm:text-base">
            Create a clean, ATS-friendly resume using your existing experience and skills.
          </p>
        </div>

        <ErrorBanner message={error} onDismiss={() => setError(null)} />

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-2.5 border-b border-slate-200 px-5 py-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50">
              <Wand2 className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900">Generate an ATS Resume</h2>
              <p className="text-sm text-slate-500">
                Pick a resume and optionally a job description to optimize for.
              </p>
            </div>
          </div>

          <div className="px-5 py-5">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div>
                <SelectField
                  label="Source Resume"
                  value={selectedResume}
                  onChange={setSelectedResume}
                  placeholder="Select a resume..."
                >
                  {resumes.map((resumeItem) => (
                    <option key={resumeItem.id} value={resumeItem.id}>
                      {resumeItem.fileName} · {formatDate(resumeItem.createdAt)}
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
                  label="Job Description (Optional)"
                  value={selectedJd}
                  onChange={setSelectedJd}
                  placeholder="Optional - select a job description..."
                >
                  {jobDescriptions.map((jd) => (
                    <option key={jd.id} value={jd.id}>
                      {jd.title || 'Untitled'} · {jd.company || 'Unknown'}
                    </option>
                  ))}
                </SelectField>
                {jobDescriptions.length === 0 && (
                  <p className="mt-1.5 text-xs text-amber-600">
                    No job descriptions yet. Analyze one in the Job Analyzer first (optional).
                  </p>
                )}
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Target Role (Optional)
                </label>
                <input
                  type="text"
                  value={targetRoleInput}
                  onChange={(e) => setTargetRoleInput(e.target.value)}
                  placeholder="e.g. Full Stack Developer"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={handleGenerate}
                disabled={!selectedResume || generating}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
              >
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating resume...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Generate Resume
                  </>
                )}
              </button>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-4">
            <FileText className="h-5 w-5 text-indigo-600" />
            <h2 className="font-semibold text-slate-900">My Generated Resumes</h2>
          </div>
          <div className="px-5 py-4">
            {history.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Inbox className="h-10 w-10 text-slate-300" />
                <p className="mt-4 text-sm font-medium text-slate-700">
                  No generated resumes yet.
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Select a resume above and click Generate Resume to get started.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {history.map((item) => (
                  <li
                    key={item.id}
                    className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50">
                        <FileText className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {item.contactName || item.targetRole || 'ATS Resume'}
                        </p>
                        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                          <span className="inline-flex items-center gap-1">
                            <FileText className="h-3.5 w-3.5" />
                            {item.sourceResumeName || 'Source resume'}
                          </span>
                          {item.jobTitle && (
                            <span className="inline-flex items-center gap-1">
                              <Briefcase className="h-3.5 w-3.5" />
                              {item.jobTitle}
                              {item.company ? ` · ${item.company}` : ''}
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1">
                            <CalendarDays className="h-3.5 w-3.5" />
                            {formatDate(item.createdAt)}
                          </span>
                          {item.matchPercentage != null && (
                            <span className="rounded-full bg-indigo-50 px-2 py-0.5 font-semibold text-indigo-700">
                              {item.matchPercentage}% match
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Link
                        to={`/resume-builder/${item.id}`}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-indigo-600 transition hover:border-indigo-300 hover:bg-indigo-50"
                      >
                        Edit
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDownloadResumeItem(item.id)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-indigo-300 hover:bg-indigo-50"
                      >
                        <Download className="h-4 w-4" /> PDF
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        disabled={deletingId === item.id}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-500 transition hover:border-red-300 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                      >
                        {deletingId === item.id ? (
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

  // Editor + preview (resume loaded)
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            to="/resume-builder"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 transition hover:text-indigo-700"
          >
            <ArrowLeft className="h-4 w-4" /> All generated resumes
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
            {resume.title || 'ATS Resume'}
          </h1>
          {resume.jobTitle ? (
            <p className="mt-1 text-sm text-slate-500">
              Optimized for: <span className="font-medium text-slate-700">{resume.jobTitle}</span>
              {resume.matchPercentage != null && (
                <span className="ml-2 rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700">
                  {resume.matchPercentage}% match
                </span>
              )}
            </p>
          ) : (
            <p className="mt-1 text-sm text-slate-500">General ATS-friendly resume.</p>
          )}
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !dirty}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" /> {dirty ? 'Save Changes' : 'Saved'}
              </>
            )}
          </button>
          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-indigo-300 hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {downloading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Preparing PDF...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" /> Download PDF
              </>
            )}
          </button>
        </div>
      </div>

      {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />
      }

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="space-y-6">
          <SectionCard title="Contact Information" icon={FileText}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <TextInput label="Full Name" value={contact.name} onChange={(v) => setContactField('name', v)} placeholder="Jane Doe" />
              <TextInput label="Email" type="email" value={contact.email} onChange={(v) => setContactField('email', v)} placeholder="jane@example.com" />
              <TextInput label="Phone" value={contact.phone} onChange={(v) => setContactField('phone', v)} placeholder="+91 98765 43210" />
              <TextInput label="Location" value={contact.location} onChange={(v) => setContactField('location', v)} placeholder="City, Country" />
              <TextInput label="LinkedIn" value={contact.linkedin} onChange={(v) => setContactField('linkedin', v)} placeholder="https://linkedin.com/in/janedoe" />
              <TextInput label="GitHub" value={contact.github} onChange={(v) => setContactField('github', v)} placeholder="https://github.com/janedoe" />
              <TextInput label="Portfolio" value={contact.portfolio} onChange={(v) => setContactField('portfolio', v)} placeholder="https://janedoe.dev" />
            </div>
          </SectionCard>

          <SectionCard title="Professional Summary" icon={FileText}>
            <TextAreaField label="Summary" value={content.summary} onChange={setSummary} rows={4} placeholder="Professional summary..." />
          </SectionCard>

          <SectionCard
            title="Technical Skills"
            icon={FileText}
            onAdd={() => setSkills([...skills, { category: '', items: [] }])}
          >
            <div className="space-y-4">
              {skills.map((group, i) => (
                <div key={i} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <TextInput
                        label="Category"
                        value={group.category}
                        onChange={(v) => {
                          const next = [...skills]
                          next[i] = { ...next[i], category: v }
                          setSkills(next)
                        }}
                        placeholder="e.g. Frontend, Backend, Tools"
                      />
                      <div className="mt-2">
                        <LinesField
                          label="Skills (one per line)"
                          value={group.items}
                          onChange={(v) => {
                            const next = [...skills]
                            next[i] = { ...next[i], items: v }
                            setSkills(next)
                          }}
                          placeholder={'React\nNode.js\nMongoDB'}
                          rows={4}
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSkills(skills.filter((_, j) => j !== i))}
                      className="mt-6 inline-flex shrink-0 items-center gap-1 rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 transition hover:bg-red-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard
            title="Experience"
            icon={FileText}
            onAdd={() => setExperience([...experience, emptyExperience()])}
          >
            <div className="space-y-4">
              {experience.map((entry, i) => (
                <div key={i} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
                      <TextInput label="Company" value={entry.company} onChange={(v) => { const next = [...experience]; next[i] = { ...next[i], company: v }; setExperience(next) }} placeholder="Company" />
                      <TextInput label="Role" value={entry.role} onChange={(v) => { const next = [...experience]; next[i] = { ...next[i], role: v }; setExperience(next) }} placeholder="Job title" />
                      <TextInput label="Location" value={entry.location} onChange={(v) => { const next = [...experience]; next[i] = { ...next[i], location: v }; setExperience(next) }} placeholder="City" />
                      <div className="grid grid-cols-2 gap-2">
                        <TextInput label="Start Date" value={entry.startDate} onChange={(v) => { const next = [...experience]; next[i] = { ...next[i], startDate: v }; setExperience(next) }} placeholder="e.g. Jun 2024" />
                        <TextInput label="End Date" value={entry.endDate} onChange={(v) => { const next = [...experience]; next[i] = { ...next[i], endDate: v }; setExperience(next) }} placeholder="e.g. Present" />
                      </div>
                      <div className="sm:col-span-2">
                        <LinesField
                          label="Bullet points (one per line)"
                          value={entry.bullets}
                          onChange={(v) => { const next = [...experience]; next[i] = { ...next[i], bullets: v }; setExperience(next) }}
                          rows={5}
                          placeholder={'Built REST APIs...\nCollaborated with...'}
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setExperience(experience.filter((_, j) => j !== i))}
                      className="mt-6 inline-flex shrink-0 items-center gap-1 rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 transition hover:bg-red-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard
            title="Projects"
            icon={FileText}
            onAdd={() => setProjects([...projects, emptyProject()])}
          >
            <div className="space-y-4">
              {projects.map((project, i) => (
                <div key={i} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 space-y-3">
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <TextInput label="Project Name" value={project.name} onChange={(v) => { const next = [...projects]; next[i] = { ...next[i], name: v }; setProjects(next) }} placeholder="Project name" />
                        <TextInput label="Link" value={project.link} onChange={(v) => { const next = [...projects]; next[i] = { ...next[i], link: v }; setProjects(next) }} placeholder="https://..." />
                      </div>
                      <TextInput label="Technologies (comma separated)" value={(project.technologies || []).join(', ')} onChange={(v) => { const next = [...projects]; next[i] = { ...next[i], technologies: v.split(',').map((t) => t.trim()).filter(Boolean) }; setProjects(next) }} placeholder="React, Node.js" />
                      <TextAreaField label="Description" value={project.description} onChange={(v) => { const next = [...projects]; next[i] = { ...next[i], description: v }; setProjects(next) }} rows={2} placeholder="Short description..." />
                      <LinesField label="Bullet points (one per line)" value={project.bullets} onChange={(v) => { const next = [...projects]; next[i] = { ...next[i], bullets: v }; setProjects(next) }} rows={4} placeholder={'Built a chat app...'} />
                    </div>
                    <button
                      type="button"
                      onClick={() => setProjects(projects.filter((_, j) => j !== i))}
                      className="mt-2 inline-flex shrink-0 items-center gap-1 rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 transition hover:bg-red-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard
            title="Education"
            icon={FileText}
            onAdd={() => setEducation([...education, emptyEducation()])}
          >
            <div className="space-y-4">
              {education.map((entry, i) => (
                <div key={i} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
                      <TextInput label="Institution" value={entry.institution} onChange={(v) => { const next = [...education]; next[i] = { ...next[i], institution: v }; setEducation(next) }} placeholder="University" />
                      <TextInput label="Degree" value={entry.degree} onChange={(v) => { const next = [...education]; next[i] = { ...next[i], degree: v }; setEducation(next) }} placeholder="B.Tech" />
                      <TextInput label="Field" value={entry.field} onChange={(v) => { const next = [...education]; next[i] = { ...next[i], field: v }; setEducation(next) }} placeholder="Computer Science" />
                      <TextInput label="Location" value={entry.location} onChange={(v) => { const next = [...education]; next[i] = { ...next[i], location: v }; setEducation(next) }} placeholder="City" />
                      <div className="grid grid-cols-2 gap-2">
                        <TextInput label="Start Date" value={entry.startDate} onChange={(v) => { const next = [...education]; next[i] = { ...next[i], startDate: v }; setEducation(next) }} placeholder="e.g. 2020" />
                        <TextInput label="End Date" value={entry.endDate} onChange={(v) => { const next = [...education]; next[i] = { ...next[i], endDate: v }; setEducation(next) }} placeholder="e.g. 2024" />
                      </div>
                      <div className="sm:col-span-2">
                        <LinesField label="Details (one per line)" value={entry.details} onChange={(v) => { const next = [...education]; next[i] = { ...next[i], details: v }; setEducation(next) }} rows={3} placeholder={'Relevant coursework...'} />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEducation(education.filter((_, j) => j !== i))}
                      className="mt-6 inline-flex shrink-0 items-center gap-1 rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 transition hover:bg-red-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard
            title="Certifications"
            icon={FileText}
            onAdd={() => setCertifications([...certifications, emptyCertification()])}
          >
            <div className="space-y-4">
              {certifications.map((cert, i) => (
                <div key={i} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
                      <TextInput label="Name" value={cert.name} onChange={(v) => { const next = [...certifications]; next[i] = { ...next[i], name: v }; setCertifications(next) }} placeholder="Certification name" />
                      <TextInput label="Issuer" value={cert.issuer} onChange={(v) => { const next = [...certifications]; next[i] = { ...next[i], issuer: v }; setCertifications(next) }} placeholder="Issuing organization" />
                      <TextInput label="Date" value={cert.date} onChange={(v) => { const next = [...certifications]; next[i] = { ...next[i], date: v }; setCertifications(next) }} placeholder="e.g. 2024" />
                      <TextInput label="Link" value={cert.link} onChange={(v) => { const next = [...certifications]; next[i] = { ...next[i], link: v }; setCertifications(next) }} placeholder="https://..." />
                    </div>
                    <button
                      type="button"
                      onClick={() => setCertifications(certifications.filter((_, j) => j !== i))}
                      className="mt-2 inline-flex shrink-0 items-center gap-1 rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 transition hover:bg-red-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Additional Information" icon={FileText}>
            <div className="space-y-3">
              <LinesField label="Languages (one per line)" value={additional.languages} onChange={(v) => setAdditional('languages', v)} rows={2} placeholder={'English\nHindi'} />
              <LinesField label="Achievements (one per line)" value={additional.achievements} onChange={(v) => setAdditional('achievements', v)} rows={3} placeholder={'Won hackathon...'} />
              <LinesField label="Interests (one per line)" value={additional.interests} onChange={(v) => setAdditional('interests', v)} rows={2} placeholder={'Chess\nOpen source'} />
            </div>
          </SectionCard>

          <SectionCard title="Target Role" icon={FileText}>
            <TextInput
              label="Target Role"
              value={resume.targetRole}
              onChange={setTargetRole}
              placeholder="e.g. Full Stack Developer"
            />
          </SectionCard>
        </div>

        <div className="space-y-6">
          <ResumePreview resume={resume} />
          <AtsOptimizationPanel atsMetadata={resume.atsMetadata} />
        </div>
      </div>

      <a ref={pdfAnchor} className="hidden" download />
    </div>
  )
}

export default ResumeBuilder