import { useEffect, useRef, useState } from 'react'
import {
  AlertTriangle,
  Award,
  Briefcase,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Download,
  FolderGit2,
  GraduationCap,
  Loader2,
  Plus,
  Printer,
  Save,
  Sparkles,
  Trash2,
  User,
  X,
} from 'lucide-react'
import {
  createResumeDraft,
  deleteResumeDraft,
  downloadResumeDraftPdf,
  getErrorMessage,
  getResumeDraft,
  updateResumeDraft,
} from '../services/api'
import { useAuth } from '../context/AuthContext'

const inputClass =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20'

const labelClass = 'mb-1.5 block text-sm font-medium text-slate-700'

const Field = ({ label, required, className, children }) => (
  <div className={className}>
    <label className={labelClass}>
      {label}
      {required && <span className="text-red-500"> *</span>}
    </label>
    {children}
  </div>
)

const TEMPLATES = [
  { id: 'CLASSIC', label: 'Classic', description: 'Traditional sectioned layout' },
  { id: 'MINIMAL', label: 'Minimal', description: 'Clean and compact' },
  { id: 'MODERN', label: 'Modern', description: 'Bold header with color' },
]

const DEFAULT_CATEGORIES = [
  'Programming Languages',
  'Frontend',
  'Backend',
  'Databases',
  'DevOps & Tools',
  'Other',
]

const emptyDraft = () => ({
  template: 'CLASSIC',
  personal: {
    fullName: '',
    email: '',
    phone: '',
    location: '',
    linkedin: '',
    github: '',
    portfolio: '',
  },
  summary: '',
  skills: DEFAULT_CATEGORIES.map((category) => ({ category, items: [] })),
  education: [],
  experience: [],
  projects: [],
  certifications: [],
  achievements: [],
  additional: { languages: [], interests: [] },
})

const splitItems = (value) => {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean)
  return typeof value === 'string'
    ? value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
    : []
}

const joinItems = (value) => splitItems(value).join(', ')

const serializeDraft = (draft) => ({
  template: draft.template,
  personal: draft.personal || {},
  summary: draft.summary || '',
  skills: (draft.skills || []).map((group) => ({
    category: group.category || '',
    items: splitItems(group.items),
  })),
  education: (draft.education || []).map((entry) => ({
    degree: entry.degree || '',
    institution: entry.institution || '',
    location: entry.location || '',
    startDate: entry.startDate || '',
    endDate: entry.endDate || '',
    score: entry.score || '',
  })),
  experience: (draft.experience || []).map((entry) => ({
    jobTitle: entry.jobTitle || '',
    company: entry.company || '',
    location: entry.location || '',
    startDate: entry.startDate || '',
    endDate: entry.endDate || '',
    description: entry.description || '',
  })),
  projects: (draft.projects || []).map((entry) => ({
    name: entry.name || '',
    description: entry.description || '',
    technologies: splitItems(entry.technologies),
    githubUrl: entry.githubUrl || '',
    liveUrl: entry.liveUrl || '',
  })),
  certifications: (draft.certifications || []).map((entry) => ({
    name: entry.name || '',
    issuer: entry.issuer || '',
    date: entry.date || '',
    url: entry.url || '',
  })),
  achievements: splitItems(draft.achievements),
  additional: {
    languages: splitItems(draft.additional?.languages),
    interests: splitItems(draft.additional?.interests),
  },
})

const toDraft = (resume) => {
  const base = emptyDraft()
  if (!resume) return base
  return {
    template: resume.template || 'CLASSIC',
    personal: { ...base.personal, ...(resume.personal || {}) },
    summary: resume.summary || base.summary,
    skills:
      resume.skills && resume.skills.length ? resume.skills : base.skills,
    education: resume.education || [],
    experience: resume.experience || [],
    projects: (resume.projects || []).map((p) => ({
      ...p,
      technologies: joinItems(p.technologies),
    })),
    certifications: resume.certifications || [],
    achievements: resume.achievements || [],
    additional: { ...base.additional, ...(resume.additional || {}) },
  }
}

const emptySnapshot = JSON.stringify(serializeDraft(emptyDraft()))

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const URL_PATTERN = /^https?:\/\/\S+$/i

const validate = (draft) => {
  const personal = draft.personal || {}
  if (!personal.fullName.trim()) return 'Please enter your full name.'
  if (!personal.email.trim()) return 'Please enter your email address.'
  if (!EMAIL_PATTERN.test(personal.email.trim())) {
    return 'Please provide a valid email address.'
  }
  const urls = [
    ['LinkedIn', personal.linkedin],
    ['GitHub', personal.github],
    ['Portfolio', personal.portfolio],
  ]
  for (const [label, value] of urls) {
    const text = (value || '').trim()
    if (text && !URL_PATTERN.test(text)) {
      return `Please provide a valid URL for ${label}.`
    }
  }
  for (const project of draft.projects || []) {
    const github = (project.githubUrl || '').trim()
    if (github && !URL_PATTERN.test(github)) {
      return `Please provide a valid GitHub URL for the project "${project.name || 'Untitled'}".`
    }
    const live = (project.liveUrl || '').trim()
    if (live && !URL_PATTERN.test(live)) {
      return `Please provide a valid live URL for the project "${project.name || 'Untitled'}".`
    }
  }
  for (const cert of draft.certifications || []) {
    const url = (cert.url || '').trim()
    if (url && !URL_PATTERN.test(url)) {
      return `Please provide a valid credential URL for "${cert.name || 'Untitled'}".`
    }
  }
  return ''
}

const PREVIEW_STYLES = {
  CLASSIC: {
    name: 'text-2xl font-bold text-slate-900',
    contact: 'text-xs text-slate-600',
    heading: 'text-[11px] font-bold uppercase tracking-wide text-slate-900',
    headingWrap: 'border-b-2 border-slate-900 pb-1',
    entryTitle: 'text-sm font-semibold text-slate-900',
    entryMeta: 'text-[11px] text-slate-500',
    accentText: 'text-slate-900',
  },
  MINIMAL: {
    name: 'text-xl font-semibold text-slate-800',
    contact: 'text-[11px] text-slate-500',
    heading: 'text-[10px] font-semibold uppercase tracking-widest text-slate-500',
    headingWrap: 'border-b border-slate-200 pb-1',
    entryTitle: 'text-xs font-semibold text-slate-800',
    entryMeta: 'text-[10px] text-slate-400',
    accentText: 'text-slate-700',
  },
  MODERN: {
    name: 'text-2xl font-bold text-white',
    contact: 'text-[11px] text-indigo-100',
    heading: 'text-xs font-bold uppercase tracking-wide text-indigo-700',
    headingWrap: 'border-b-2 border-indigo-200 pb-1',
    entryTitle: 'text-sm font-semibold text-slate-900',
    entryMeta: 'text-[11px] text-slate-500',
    accentText: 'text-indigo-700',
  },
}

const hasAny = (...values) =>
  values.some((value) => {
    if (Array.isArray(value)) return value.length > 0
    return typeof value === 'string' ? value.trim().length > 0 : Boolean(value)
  })

const SectionHead = ({ wrapClass, titleClass, children }) => (
  <div className={`mb-2 mt-5 ${wrapClass}`}>
    <h3 className={titleClass}>{children}</h3>
  </div>
)

const ResumeDraftPreview = ({ draft }) => {
  const styles = PREVIEW_STYLES[draft.template] || PREVIEW_STYLES.CLASSIC
  const personal = draft.personal || {}
  const contact = [
    personal.email,
    personal.phone,
    personal.location,
    personal.linkedin,
    personal.github,
    personal.portfolio,
  ]
    .map((value) => (typeof value === 'string' ? value.trim() : ''))
    .filter(Boolean)

  const skills = (draft.skills || []).filter(
    (group) =>
      (group.category || '').trim() || splitItems(group.items).length
  )
  const education = draft.education || []
  const experience = draft.experience || []
  const projects = draft.projects || []
  const certifications = draft.certifications || []
  const achievements = splitItems(draft.achievements)
  const languages = splitItems(draft.additional?.languages)
  const interests = splitItems(draft.additional?.interests)

  const count = (list) =>
    list.filter((entry) =>
      Object.values(entry || {}).some((value) => {
        if (Array.isArray(value)) return value.length > 0
        return typeof value === 'string'
          ? value.trim().length > 0
          : Boolean(value)
      })
    ).length

  return (
    <div className="w-full overflow-hidden rounded-lg bg-white shadow-md ring-1 ring-slate-200 print:rounded-none print:shadow-none print:ring-0">
      {draft.template === 'MODERN' ? (
        <div className="bg-indigo-700 px-6 py-5">
          <p className={styles.name}>{personal.fullName || 'Your Name'}</p>
          {contact.length > 0 && (
            <p className={`mt-2 ${styles.contact}`}>{contact.join('  |  ')}</p>
          )}
        </div>
      ) : (
        <div className="border-b border-slate-200 px-6 py-5">
          <p className={styles.name}>{personal.fullName || 'Your Name'}</p>
          {contact.length > 0 && (
            <p className={`mt-1.5 ${styles.contact}`}>{contact.join('  |  ')}</p>
          )}
        </div>
      )}

      <div className="px-6 py-5">
        {hasAny(draft.summary) && (
          <>
            <SectionHead
                wrapClass={styles.headingWrap}
                titleClass={styles.heading}
              >Professional Summary</SectionHead>
            <p className="whitespace-pre-line text-xs leading-relaxed text-slate-700">
              {draft.summary}
            </p>
          </>
        )}

        {skills.length > 0 && (
          <>
            <SectionHead wrapClass={styles.headingWrap} titleClass={styles.heading}>
                Skills
              </SectionHead>
            <div className="space-y-1.5">
              {skills.map((group, index) => {
                const items = splitItems(group.items)
                if (!items.length) return null
                return (
                  <p key={index} className="text-xs text-slate-700">
                    <span className={`font-semibold ${styles.accentText}`}>
                      {group.category || 'Skills'}:
                    </span>{' '}
                    {items.join('  \u00b7  ')}
                  </p>
                )
              })}
            </div>
          </>
        )}

        {count(experience) > 0 && (
          <>
            <SectionHead wrapClass={styles.headingWrap} titleClass={styles.heading}>
                Experience
              </SectionHead>
            <div className="space-y-3">
              {experience.map((entry, index) => (
                <div key={index}>
                  <p className={styles.entryTitle}>
                    {[entry.jobTitle, entry.company]
                      .map((value) => (value || '').trim())
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                  {hasAny(entry.location, entry.startDate, entry.endDate) && (
                    <p className={`mt-0.5 ${styles.entryMeta}`}>
                      {[entry.location, [entry.startDate, entry.endDate].filter(Boolean).join(' - ')]
                        .filter(Boolean)
                        .join('  |  ')}
                    </p>
                  )}
                  {hasAny(entry.description) && (
                    <p className="mt-1 whitespace-pre-line text-xs leading-relaxed text-slate-700">
                      {entry.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {count(projects) > 0 && (
          <>
            <SectionHead wrapClass={styles.headingWrap} titleClass={styles.heading}>
                Projects
              </SectionHead>
            <div className="space-y-3">
              {projects.map((project, index) => {
                const technologies = splitItems(project.technologies)
                const links = [
                  project.githubUrl,
                  project.liveUrl,
                ]
                  .map((value) => (value || '').trim())
                  .filter(Boolean)
                return (
                  <div key={index}>
                    <p className={styles.entryTitle}>
                      {project.name || 'Untitled'}
                    </p>
                    {technologies.length > 0 && (
                      <p className={`mt-0.5 ${styles.entryMeta}`}>
                        Technologies: {technologies.join(', ')}
                      </p>
                    )}
                    {hasAny(project.description) && (
                      <p className="mt-1 whitespace-pre-line text-xs leading-relaxed text-slate-700">
                        {project.description}
                      </p>
                    )}
                    {links.length > 0 && (
                      <p className={`mt-0.5 ${styles.entryMeta}`}>
                        Links: {links.join('  |  ')}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}

        {count(education) > 0 && (
          <>
            <SectionHead wrapClass={styles.headingWrap} titleClass={styles.heading}>
                Education
              </SectionHead>
            <div className="space-y-3">
              {education.map((entry, index) => (
                <div key={index}>
                  <p className={styles.entryTitle}>
                    {[entry.degree, entry.institution]
                      .map((value) => (value || '').trim())
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                  {hasAny(entry.location, entry.startDate, entry.endDate) && (
                    <p className={`mt-0.5 ${styles.entryMeta}`}>
                      {[entry.location, [entry.startDate, entry.endDate].filter(Boolean).join(' - ')]
                        .filter(Boolean)
                        .join('  |  ')}
                    </p>
                  )}
                  {hasAny(entry.score) && (
                    <p className="mt-0.5 text-xs text-slate-700">
                      CGPA / Percentage: {entry.score}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {count(certifications) > 0 && (
          <>
            <SectionHead wrapClass={styles.headingWrap} titleClass={styles.heading}>
                Certifications
              </SectionHead>
            <div className="space-y-1.5">
              {certifications.map((cert, index) => (
                <p key={index} className="text-xs text-slate-700">
                  {[cert.name, cert.issuer, cert.date, cert.url]
                    .map((value) => (value || '').trim())
                    .filter(Boolean)
                    .join('  |  ')}
                </p>
              ))}
            </div>
          </>
        )}

        {achievements.length > 0 && (
          <>
            <SectionHead wrapClass={styles.headingWrap} titleClass={styles.heading}>
                Achievements
              </SectionHead>
            <ul className="list-disc space-y-1 pl-4 text-xs text-slate-700">
              {achievements.map((achievement, index) => (
                <li key={index}>{achievement}</li>
              ))}
            </ul>
          </>
        )}

        {(languages.length > 0 || interests.length > 0) && (
          <>
            <SectionHead wrapClass={styles.headingWrap} titleClass={styles.heading}>
                Additional Information
              </SectionHead>
            <div className="space-y-1.5">
              {languages.length > 0 && (
                <p className="text-xs text-slate-700">
                  <span className={`font-semibold ${styles.accentText}`}>
                    Languages:
                  </span>{' '}
                  {languages.join(', ')}
                </p>
              )}
              {interests.length > 0 && (
                <p className="text-xs text-slate-700">
                  <span className={`font-semibold ${styles.accentText}`}>
                    Interests:
                  </span>{' '}
                  {interests.join(', ')}
                </p>
              )}
            </div>
          </>
        )}

        {!hasAny(
          draft.summary,
          skills,
          education,
          experience,
          projects,
          certifications,
          achievements,
          languages,
          interests
        ) && (
          <p className="py-8 text-center text-xs text-slate-400">
            Start filling the form to see your resume preview here.
          </p>
        )}
      </div>
    </div>
  )
}

const Chip = ({ label, onRemove }) => (
  <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700">
    {label}
    <button
      type="button"
      onClick={onRemove}
      className="text-indigo-400 transition hover:text-indigo-700"
      aria-label={`Remove ${label}`}
    >
      <X className="h-3 w-3" />
    </button>
  </span>
)

const AddItemControl = ({ placeholder, value, onChange, onAdd }) => (
  <div className="mt-3 flex gap-2">
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault()
          onAdd()
        }
      }}
      placeholder={placeholder}
      className={inputClass}
    />
    <button
      type="button"
      onClick={onAdd}
      className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-700 transition hover:bg-indigo-100"
    >
      <Plus className="h-4 w-4" />
      Add
    </button>
  </div>
)

const SkillGroupEditor = ({
  group,
  index,
  onUpdateCategory,
  onAddItem,
  onRemoveItem,
  onRemoveGroup,
}) => {
  const [value, setValue] = useState('')
  const submit = () => {
    const item = value.trim()
    if (item) {
      onAddItem(index, item)
      setValue('')
    }
  }
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <div className="flex items-start gap-2">
        <input
          type="text"
          value={group.category || ''}
          onChange={(e) => onUpdateCategory(index, e.target.value)}
          placeholder="Category (e.g. JavaScript)"
          className={inputClass}
        />
        <button
          type="button"
          onClick={() => onRemoveGroup(index)}
          className="shrink-0 rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
          aria-label={`Remove ${group.category || 'skill category'}`}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      {splitItems(group.items).length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {splitItems(group.items).map((item, itemIndex) => (
            <Chip
              key={itemIndex}
              label={item}
              onRemove={() => onRemoveItem(index, itemIndex)}
            />
          ))}
        </div>
      ) : (
        <p className="mt-3 text-xs text-slate-400">No skills added yet.</p>
      )}
      <AddItemControl
        placeholder="Add a skill"
        value={value}
        onChange={setValue}
        onAdd={submit}
      />
    </div>
  )
}

const ENTRY_FIELDS = {
  education: [
    { key: 'degree', label: 'Degree', placeholder: 'B.Tech in Computer Science', col: 'sm:col-span-2' },
    { key: 'institution', label: 'Institution', placeholder: 'Example Institute', col: 'sm:col-span-2' },
    { key: 'location', label: 'Location', placeholder: 'Indore' },
    { key: 'startDate', label: 'Start (Month Year)', placeholder: 'Aug 2019' },
    { key: 'endDate', label: 'End (Month Year)', placeholder: 'May 2023' },
    { key: 'score', label: 'CGPA / Percentage', placeholder: '8.6 CGPA', col: 'sm:col-span-2' },
  ],
  experience: [
    { key: 'jobTitle', label: 'Job Title', placeholder: 'Frontend Developer' },
    { key: 'company', label: 'Company', placeholder: 'Example Corp' },
    { key: 'location', label: 'Location', placeholder: 'Remote' },
    { key: 'startDate', label: 'Start (Month Year)', placeholder: 'Jan 2023' },
    { key: 'endDate', label: 'End (Month Year)', placeholder: 'Present' },
    { key: 'description', label: 'Description', placeholder: 'Describe your responsibilities and achievements', textarea: true, col: 'sm:col-span-2' },
  ],
  projects: [
    { key: 'name', label: 'Project Name', placeholder: 'Task Manager', col: 'sm:col-span-2' },
    { key: 'githubUrl', label: 'GitHub URL', placeholder: 'https://github.com/username/repo' },
    { key: 'liveUrl', label: 'Live URL', placeholder: 'https://your-app.example.com' },
    { key: 'technologies', label: 'Technologies (comma separated)', placeholder: 'React, Node.js, MongoDB', col: 'sm:col-span-2' },
    { key: 'description', label: 'Description', placeholder: 'What problem it solves and what you built', textarea: true, col: 'sm:col-span-2' },
  ],
  certifications: [
    { key: 'name', label: 'Certification', placeholder: 'AWS Certified Developer', col: 'sm:col-span-2' },
    { key: 'issuer', label: 'Issuer', placeholder: 'Amazon Web Services' },
    { key: 'date', label: 'Date', placeholder: 'May 2024' },
    { key: 'url', label: 'Credential URL', placeholder: 'https://verify.example.com/12345', col: 'sm:col-span-2' },
  ],
}

const EMPTY_ENTRIES = {
  education: { degree: '', institution: '', location: '', startDate: '', endDate: '', score: '' },
  experience: { jobTitle: '', company: '', location: '', startDate: '', endDate: '', description: '' },
  projects: { name: '', description: '', technologies: '', githubUrl: '', liveUrl: '' },
  certifications: { name: '', issuer: '', date: '', url: '' },
}

const EntryEditor = ({
  kind,
  entry,
  index,
  onUpdate,
  onRemove,
  onMove,
  canMoveUp,
  canMoveDown,
}) => (
  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
    <div className="mb-3 flex items-center justify-between">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {index + 1}. {entry.name || entry.jobTitle || entry.degree || entry.title || 'New entry'}
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onMove(index, -1)}
          disabled={!canMoveUp}
          className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-200 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-30"
          aria-label="Move up"
        >
          <ChevronUp className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => onMove(index, 1)}
          disabled={!canMoveDown}
          className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-200 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-30"
          aria-label="Move down"
        >
          <ChevronDown className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => onRemove(index)}
          className="rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
          aria-label="Remove entry"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {ENTRY_FIELDS[kind].map((field) => (
        <Field key={field.key} label={field.label} className={field.col}>
          {field.textarea ? (
            <textarea
              rows={3}
              value={entry[field.key] || ''}
              onChange={(e) => onUpdate(index, field.key, e.target.value)}
              placeholder={field.placeholder}
              className={inputClass}
            />
          ) : (
            <input
              type="text"
              value={entry[field.key] || ''}
              onChange={(e) => onUpdate(index, field.key, e.target.value)}
              placeholder={field.placeholder}
              className={inputClass}
            />
          )}
        </Field>
      ))}
    </div>
  </div>
)

const SectionCard = ({ icon: Icon, title, subtitle, actions, children }) => (
  <section className="rounded-xl border border-slate-200 bg-white p-5">
    <div className="mb-4 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2.5">
        <Icon className="h-4.5 w-4.5 text-indigo-600" />
        <div>
          <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
          {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
        </div>
      </div>
      {actions}
    </div>
    {children}
  </section>
)

const ResumeDraftBuilder = () => {
  const { logout } = useAuth()
  const [draftId, setDraftId] = useState(null)
  const [draft, setDraft] = useState(() => emptyDraft())
  const [savedSnapshot, setSavedSnapshot] = useState(emptySnapshot)
  const [loadingPage, setLoadingPage] = useState(true)
  const [saving, setSaving] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState(null)
  const [validationError, setValidationError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [skillDraft, setSkillDraft] = useState('')
  const [newCategory, setNewCategory] = useState('')
  const [listDrafts, setListDrafts] = useState({ achievements: '', languages: '', interests: '' })

  const pdfAnchor = useRef(null)

  const dirty = savedSnapshot !== JSON.stringify(serializeDraft(draft))

  useEffect(() => {
    let active = true
    const load = async () => {
      setLoadingPage(true)
      setError(null)
      try {
        const { data } = await getResumeDraft()
        if (!active) return
        const loaded = toDraft(data.resume)
        setDraft(loaded)
        setDraftId(data.resume ? data.resume.id : null)
        setSavedSnapshot(JSON.stringify(serializeDraft(loaded)))
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

  const updatePersonalField = (key, value) =>
    setDraft((prev) => ({ ...prev, personal: { ...prev.personal, [key]: value } }))

  const updateEntry = (kind, index, key, value) =>
    setDraft((prev) => ({
      ...prev,
      [kind]: prev[kind].map((entry, i) =>
        i === index ? { ...entry, [key]: value } : entry
      ),
    }))

  const addEntry = (kind) =>
    setDraft((prev) => ({ ...prev, [kind]: [...prev[kind], { ...EMPTY_ENTRIES[kind] }] }))

  const removeEntry = (kind, index) =>
    setDraft((prev) => ({
      ...prev,
      [kind]: prev[kind].filter((_, i) => i !== index),
    }))

  const moveEntry = (kind, index, direction) =>
    setDraft((prev) => {
      const list = [...prev[kind]]
      const target = index + direction
      if (target < 0 || target >= list.length) return prev
      const [entry] = list.splice(index, 1)
      list.splice(target, 0, entry)
      return { ...prev, [kind]: list }
    })

  const updateSkillCategory = (index, value) =>
    setDraft((prev) => ({
      ...prev,
      skills: prev.skills.map((group, i) =>
        i === index ? { ...group, category: value } : group
      ),
    }))

  const addSkillItem = (index, value) =>
    setDraft((prev) => ({
      ...prev,
      skills: prev.skills.map((group, i) =>
        i === index ? { ...group, items: splitItems(group.items).concat([value]).slice(0, 60) } : group
      ),
    }))

  const removeSkillItem = (index, itemIndex) =>
    setDraft((prev) => ({
      ...prev,
      skills: prev.skills.map((group, i) =>
        i === index
          ? { ...group, items: splitItems(group.items).filter((_, j) => j !== itemIndex) }
          : group
      ),
    }))

  const addSkillGroup = () => {
    const category = newCategory.trim()
    if (!category) return
    setDraft((prev) => ({
      ...prev,
      skills: [...prev.skills, { category, items: [] }].slice(0, 30),
    }))
    setNewCategory('')
  }

  const removeSkillGroup = (index) =>
    setDraft((prev) => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index),
    }))

  const addSkillDraftItem = () => {
    const item = skillDraft.trim()
    if (!item) return
    setDraft((prev) => {
      const skills =
        prev.skills.length > 0
          ? prev.skills.map((group, i) =>
              i === 0 ? { ...group, items: splitItems(group.items).concat([item]).slice(0, 60) } : group
            )
          : [{ category: 'Skills', items: [item] }]
      return { ...prev, skills }
    })
    setSkillDraft('')
  }

  const updateListDraft = (kind, value) =>
    setListDrafts((prev) => ({ ...prev, [kind]: value }))

  const addToList = (kind) => {
    const value = listDrafts[kind].trim()
    if (!value) return
    if (kind === 'achievements') {
      setDraft((prev) => ({ ...prev, achievements: splitItems(prev.achievements).concat([value]).slice(0, 50) }))
    } else {
      setDraft((prev) => ({
        ...prev,
        additional: { ...prev.additional, [kind]: splitItems(prev.additional?.[kind]).concat([value]).slice(0, 20) },
      }))
    }
    updateListDraft(kind, '')
  }

  const removeFromList = (kind, index) => {
    if (kind === 'achievements') {
      setDraft((prev) => ({
        ...prev,
        achievements: splitItems(prev.achievements).filter((_, i) => i !== index),
      }))
    } else {
      setDraft((prev) => ({
        ...prev,
        additional: {
          ...prev.additional,
          [kind]: splitItems(prev.additional?.[kind]).filter((_, i) => i !== index),
        },
      }))
    }
  }

  const handleSave = async () => {
    if (saving) return
    const errorMessage = validate(draft)
    setValidationError(errorMessage)
    if (errorMessage) return
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const payload = serializeDraft(draft)
      const { data } = draftId
        ? await updateResumeDraft(draftId, payload)
        : await createResumeDraft(payload)
      setDraft(toDraft(data.resume))
      setDraftId(data.resume.id)
      setSavedSnapshot(JSON.stringify(serializeDraft(toDraft(data.resume))))
      setSuccess('Your resume has been saved successfully.')
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

  const triggerBlobDownload = (blob, filename) => {
    const url = window.URL.createObjectURL(blob)
    if (pdfAnchor.current) {
      pdfAnchor.current.href = url
      pdfAnchor.current.download = filename || 'resume.pdf'
      pdfAnchor.current.click()
    }
    window.URL.revokeObjectURL(url)
  }

  const handleDownload = async () => {
    if (downloading || !draftId) {
      if (!draftId) {
        setError('Please save your resume before downloading the PDF.')
      }
      return
    }
    setDownloading(true)
    setError(null)
    setSuccess(null)
    try {
      const res = await downloadResumeDraftPdf(draftId)
      const disposition = res.headers && res.headers['content-disposition']
      const match = disposition && disposition.match(/filename="?([^"]+)"?/)
      triggerBlobDownload(
        new Blob([res.data], { type: 'application/pdf' }),
        (match && match[1]) || 'resume.pdf'
      )
    } catch (err) {
      const status = err.response?.status
      if (status === 401) {
        await logout()
        return
      }
      setError(err.response?.data?.message || getErrorMessage(err))
    } finally {
      setDownloading(false)
    }
  }

  const handleDelete = async () => {
    if (deleting || !draftId) return
    const confirmDelete = window.confirm(
      'Delete your resume? This cannot be undone.'
    )
    if (!confirmDelete) return
    setDeleting(true)
    setError(null)
    setSuccess(null)
    try {
      await deleteResumeDraft(draftId)
      setDraft(emptyDraft())
      setDraftId(null)
      setSavedSnapshot(emptySnapshot)
      setSuccess('Your resume has been deleted.')
    } catch (err) {
      const status = err.response?.status
      if (status === 401) {
        await logout()
        return
      }
      setError(err.response?.data?.message || getErrorMessage(err))
    } finally {
      setDeleting(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  if (loadingPage) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  return (
    <div>
      <a ref={pdfAnchor} className="hidden" />

      <div className="print:hidden">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Resume Builder</h1>
            <p className="mt-1 text-sm text-slate-500">
              Build your professional resume with live preview, save it, and
              download a text-based PDF.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !dirty}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save Resume
            </button>
            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading || !draftId}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {downloading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Download PDF
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              <Printer className="h-4 w-4" />
              Print
            </button>
            {draftId && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                Delete
              </button>
            )}
          </div>
        </div>

        {(error || validationError) && (
          <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            <span className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {validationError || error}
            </span>
            <button
              type="button"
              onClick={() => {
                setError(null)
                setValidationError(null)
              }}
              className="font-medium hover:opacity-80"
            >
              Dismiss
            </button>
          </div>
        )}

        {success && (
          <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              {success}
            </span>
            <button
              type="button"
              onClick={() => setSuccess(null)}
              className="font-medium hover:opacity-80"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-indigo-600" />
            <h2 className="text-sm font-semibold text-slate-900">
              Choose a template
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {TEMPLATES.map((template) => (
              <button
                key={template.id}
                type="button"
                onClick={() =>
                  setDraft((prev) => ({ ...prev, template: template.id }))
                }
                className={`rounded-lg border p-3 text-left transition ${
                  draft.template === template.id
                    ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/40'
                }`}
              >
                <p className="text-sm font-semibold text-slate-900">
                  {template.label}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {template.description}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-start">
        <div className="w-full shrink-0 space-y-6 lg:w-[430px] print:hidden">
          <SectionCard icon={User} title="Personal Information" subtitle="Required for your resume header">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Full Name" required className="sm:col-span-2">
                <input
                  type="text"
                  value={draft.personal.fullName}
                  onChange={(e) => updatePersonalField('fullName', e.target.value)}
                  placeholder="John Doe"
                  className={inputClass}
                />
              </Field>
              <Field label="Email" required>
                <input
                  type="text"
                  value={draft.personal.email}
                  onChange={(e) => updatePersonalField('email', e.target.value)}
                  placeholder="john@example.com"
                  className={inputClass}
                />
              </Field>
              <Field label="Phone">
                <input
                  type="text"
                  value={draft.personal.phone}
                  onChange={(e) => updatePersonalField('phone', e.target.value)}
                  placeholder="+1 555 000 1234"
                  className={inputClass}
                />
              </Field>
              <Field label="Location" className="sm:col-span-2">
                <input
                  type="text"
                  value={draft.personal.location}
                  onChange={(e) => updatePersonalField('location', e.target.value)}
                  placeholder="Indore, India"
                  className={inputClass}
                />
              </Field>
              <Field label="LinkedIn URL">
                <input
                  type="text"
                  value={draft.personal.linkedin}
                  onChange={(e) => updatePersonalField('linkedin', e.target.value)}
                  placeholder="https://linkedin.com/in/johndoe"
                  className={inputClass}
                />
              </Field>
              <Field label="GitHub URL">
                <input
                  type="text"
                  value={draft.personal.github}
                  onChange={(e) => updatePersonalField('github', e.target.value)}
                  placeholder="https://github.com/johndoe"
                  className={inputClass}
                />
              </Field>
              <Field label="Portfolio URL">
                <input
                  type="text"
                  value={draft.personal.portfolio}
                  onChange={(e) => updatePersonalField('portfolio', e.target.value)}
                  placeholder="https://johndoe.dev"
                  className={inputClass}
                />
              </Field>
            </div>
          </SectionCard>

          <SectionCard icon={Sparkles} title="Professional Summary" subtitle="2-3 sentences about your career">
            <textarea
              rows={4}
              value={draft.summary}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, summary: e.target.value }))
              }
              placeholder="Detail-oriented developer with 5+ years of experience building scalable web applications..."
              className={inputClass}
            />
          </SectionCard>

          <SectionCard
            icon={Briefcase}
            title="Skills"
            subtitle="Grouped by category"
            actions={
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addSkillGroup()
                    }
                  }}
                  placeholder="Add category"
                  className="w-36 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={addSkillGroup}
                  className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-indigo-50 px-2.5 py-1.5 text-xs font-medium text-indigo-700 transition hover:bg-indigo-100"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add
                </button>
              </div>
            }
          >
            <div className="space-y-3">
              {draft.skills.map((group, index) => (
                <SkillGroupEditor
                  key={index}
                  group={group}
                  index={index}
                  onUpdateCategory={updateSkillCategory}
                  onAddItem={addSkillItem}
                  onRemoveItem={removeSkillItem}
                  onRemoveGroup={removeSkillGroup}
                />
              ))}
              {draft.skills.length === 0 && (
                <AddItemControl
                  placeholder="Add a skill"
                  value={skillDraft}
                  onChange={setSkillDraft}
                  onAdd={addSkillDraftItem}
                />
              )}
            </div>
          </SectionCard>

          <SectionCard
            icon={Briefcase}
            title="Work Experience"
            subtitle="Relevant roles and achievements"
            actions={
              <button
                type="button"
                onClick={() => addEntry('experience')}
                className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-2.5 py-1.5 text-xs font-medium text-indigo-700 transition hover:bg-indigo-100"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Experience
              </button>
            }
          >
            {draft.experience.length === 0 ? (
              <p className="text-sm text-slate-400">
                No work experience added yet.
              </p>
            ) : (
              <div className="space-y-3">
                {draft.experience.map((entry, index) => (
                  <EntryEditor
                    key={index}
                    kind="experience"
                    entry={entry}
                    index={index}
                    onUpdate={updateEntry}
                    onRemove={removeEntry}
                    onMove={moveEntry}
                    canMoveUp={index > 0}
                    canMoveDown={index < draft.experience.length - 1}
                  />
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard
            icon={FolderGit2}
            title="Projects"
            subtitle="Personal or professional projects"
            actions={
              <button
                type="button"
                onClick={() => addEntry('projects')}
                className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-2.5 py-1.5 text-xs font-medium text-indigo-700 transition hover:bg-indigo-100"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Project
              </button>
            }
          >
            {draft.projects.length === 0 ? (
              <p className="text-sm text-slate-400">No projects added yet.</p>
            ) : (
              <div className="space-y-3">
                {draft.projects.map((entry, index) => (
                  <EntryEditor
                    key={index}
                    kind="projects"
                    entry={entry}
                    index={index}
                    onUpdate={updateEntry}
                    onRemove={removeEntry}
                    onMove={moveEntry}
                    canMoveUp={index > 0}
                    canMoveDown={index < draft.projects.length - 1}
                  />
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard
            icon={GraduationCap}
            title="Education"
            subtitle="Degrees and academic background"
            actions={
              <button
                type="button"
                onClick={() => addEntry('education')}
                className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-2.5 py-1.5 text-xs font-medium text-indigo-700 transition hover:bg-indigo-100"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Education
              </button>
            }
          >
            {draft.education.length === 0 ? (
              <p className="text-sm text-slate-400">
                No education added yet.
              </p>
            ) : (
              <div className="space-y-3">
                {draft.education.map((entry, index) => (
                  <EntryEditor
                    key={index}
                    kind="education"
                    entry={entry}
                    index={index}
                    onUpdate={updateEntry}
                    onRemove={removeEntry}
                    onMove={moveEntry}
                    canMoveUp={index > 0}
                    canMoveDown={index < draft.education.length - 1}
                  />
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard
            icon={Award}
            title="Certifications"
            subtitle="Professional certifications"
            actions={
              <button
                type="button"
                onClick={() => addEntry('certifications')}
                className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-2.5 py-1.5 text-xs font-medium text-indigo-700 transition hover:bg-indigo-100"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Certification
              </button>
            }
          >
            {draft.certifications.length === 0 ? (
              <p className="text-sm text-slate-400">
                No certifications added yet.
              </p>
            ) : (
              <div className="space-y-3">
                {draft.certifications.map((entry, index) => (
                  <EntryEditor
                    key={index}
                    kind="certifications"
                    entry={entry}
                    index={index}
                    onUpdate={updateEntry}
                    onRemove={removeEntry}
                    onMove={moveEntry}
                    canMoveUp={index > 0}
                    canMoveDown={index < draft.certifications.length - 1}
                  />
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard
            icon={Award}
            title="Achievements"
            subtitle="Awards, recognitions, and key accomplishments"
          >
            {draft.achievements.length === 0 ? (
              <p className="text-sm text-slate-400">
                No achievements added yet.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {splitItems(draft.achievements).map((achievement, index) => (
                  <Chip
                    key={index}
                    label={achievement}
                    onRemove={() => removeFromList('achievements', index)}
                  />
                ))}
              </div>
            )}
            <AddItemControl
              placeholder="Add an achievement"
              value={listDrafts.achievements}
              onChange={(value) => updateListDraft('achievements', value)}
              onAdd={() => addToList('achievements')}
            />
          </SectionCard>

          <SectionCard
            icon={User}
            title="Additional Information"
            subtitle="Languages and interests"
          >
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Languages</label>
                {splitItems(draft.additional?.languages).length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {splitItems(draft.additional.languages).map((language, index) => (
                      <Chip
                        key={index}
                        label={language}
                        onRemove={() => removeFromList('languages', index)}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400">
                    No languages added yet.
                  </p>
                )}
                <AddItemControl
                  placeholder="Add a language"
                  value={listDrafts.languages}
                  onChange={(value) => updateListDraft('languages', value)}
                  onAdd={() => addToList('languages')}
                />
              </div>
              <div>
                <label className={labelClass}>Interests</label>
                {splitItems(draft.additional?.interests).length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {splitItems(draft.additional.interests).map((interest, index) => (
                      <Chip
                        key={index}
                        label={interest}
                        onRemove={() => removeFromList('interests', index)}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400">
                    No interests added yet.
                  </p>
                )}
                <AddItemControl
                  placeholder="Add an interest"
                  value={listDrafts.interests}
                  onChange={(value) => updateListDraft('interests', value)}
                  onAdd={() => addToList('interests')}
                />
              </div>
            </div>
          </SectionCard>
        </div>

        <div className="min-w-0 flex-1">
          <div className="lg:sticky lg:top-4">
            <div className="mb-3 hidden items-center gap-2 text-sm font-semibold text-slate-700 lg:flex">
              <Sparkles className="h-4 w-4 text-indigo-600" />
              Live preview
              {dirty && (
                <span className="ml-auto rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800">
                  Unsaved changes
                </span>
              )}
            </div>
            <ResumeDraftPreview draft={draft} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default ResumeDraftBuilder