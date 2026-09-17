import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowLeft,
  Award,
  Briefcase,
  CheckCircle2,
  ExternalLink,
  FileText,
  FolderGit2,
  Gauge,
  GraduationCap,
  ListChecks,
  Loader2,
  RefreshCw,
  Sparkles,
  Target,
  Users,
  Wrench,
} from 'lucide-react'
import {
  analyzeResume,
  calculateATSScore,
  getErrorMessage,
  getResumeById,
} from '../services/api'
import { useAuth } from '../context/AuthContext'

const formatBytes = (bytes) => {
  if (!bytes && bytes !== 0) return '—'
  const units = ['B', 'KB', 'MB', 'GB']
  let value = bytes
  let unit = 0
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit += 1
  }
  return `${value.toFixed(value >= 10 || unit === 0 ? 0 : 1)} ${units[unit]}`
}

const formatDate = (dateString) =>
  new Date(dateString).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

const SectionCard = ({ icon: Icon, title, children }) => (
  <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
    <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-4">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50">
        <Icon className="h-5 w-5 text-indigo-600" />
      </div>
      <h2 className="font-semibold text-slate-900">{title}</h2>
    </div>
    <div className="px-5 py-4">{children}</div>
  </section>
)

const BulletList = ({ items }) =>
  items.length ? (
    <ul className="space-y-2.5">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-slate-700">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  ) : (
    <p className="text-sm text-slate-500">Not mentioned in resume</p>
  )

const BadgeList = ({ items }) =>
  items.length ? (
    <div className="flex flex-wrap gap-2">
      {items.map((item, i) => (
        <span
          key={i}
          className="rounded-lg bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-700"
        >
          {item}
        </span>
      ))}
    </div>
  ) : (
    <p className="text-sm text-slate-500">Not mentioned in resume</p>
  )

const SummaryText = ({ text }) =>
  text ? (
    <p className="text-sm leading-relaxed text-slate-700">{text}</p>
  ) : (
    <p className="text-sm text-slate-500">Not mentioned in resume</p>
  )

const CATEGORY_LABELS = [
  { key: 'structure', label: 'Structure & Formatting' },
  { key: 'skills', label: 'Skills & Keywords' },
  { key: 'experience', label: 'Experience' },
  { key: 'projects', label: 'Projects' },
  { key: 'education', label: 'Education & Certifications' },
  { key: 'content', label: 'Content Quality' },
]

const atsMeta = (score) => {
  if (score >= 90) {
    return { label: 'Excellent', text: 'text-emerald-700', bg: 'bg-emerald-50', ring: '#059669', bar: 'bg-emerald-500' }
  }
  if (score >= 75) {
    return { label: 'Strong', text: 'text-indigo-700', bg: 'bg-indigo-50', ring: '#4f46e5', bar: 'bg-indigo-500' }
  }
  if (score >= 60) {
    return { label: 'Needs Improvement', text: 'text-amber-700', bg: 'bg-amber-50', ring: '#d97706', bar: 'bg-amber-500' }
  }
  if (score >= 40) {
    return { label: 'Weak', text: 'text-orange-700', bg: 'bg-orange-50', ring: '#ea580c', bar: 'bg-orange-500' }
  }
  return { label: 'Poor', text: 'text-red-700', bg: 'bg-red-50', ring: '#dc2626', bar: 'bg-red-500' }
}

const ScoreRing = ({ score }) => {
  const meta = atsMeta(score)
  const radius = 56
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - score / 100)
  return (
    <div className="relative h-40 w-40">
      <svg viewBox="0 0 140 140" className="h-full w-full">
        <circle cx="70" cy="70" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="12" />
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke={meta.ring}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 70 70)"
        />
        <text
          x="70"
          y="72"
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="30"
          fontWeight="700"
          fill="#0f172a"
        >
          {score}
        </text>
        <text x="70" y="102" textAnchor="middle" fontSize="12" fill="#94a3b8">
          of 100
        </text>
      </svg>
    </div>
  )
}

const ResumeDetails = () => {
  const { id } = useParams()
  const { logout } = useAuth()
  const [resume, setResume] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysisError, setAnalysisError] = useState(null)
  const [analysisMessage, setAnalysisMessage] = useState(null)
  const [scoring, setScoring] = useState(false)
  const [scoreError, setScoreError] = useState(null)
  const [scoreMessage, setScoreMessage] = useState(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const { data } = await getResumeById(id)
        setResume(data.resume)
      } catch (err) {
        setError(getErrorMessage(err))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const handleAnalyze = async () => {
    if (analyzing) return
    setAnalyzing(true)
    setAnalysisError(null)
    setAnalysisMessage(null)
    try {
      const { data } = await analyzeResume(resume.id)
      setResume((prev) => ({ ...prev, analysis: data.resume.analysis }))
      setAnalysisMessage(data.message || 'Resume analyzed successfully.')
    } catch (err) {
      const status = err.response?.status
      if (status === 401) {
        await logout()
        return
      }
      if (status === 403) {
        setAnalysisError('You are not allowed to analyze this resume.')
      } else if (status === 404) {
        setAnalysisError('Resume not found.')
      } else if (status >= 500) {
        setAnalysisError('Unable to analyze the resume right now. Please try again.')
      } else {
        setAnalysisError(getErrorMessage(err))
      }
    } finally {
      setAnalyzing(false)
    }
  }

  const handleCalculateATS = async () => {
    if (scoring) return
    setScoring(true)
    setScoreError(null)
    setScoreMessage(null)
    try {
      const { data } = await calculateATSScore(resume.id)
      setResume((prev) => ({ ...prev, atsScore: data.atsScore }))
      setScoreMessage(data.message || 'ATS score calculated successfully.')
    } catch (err) {
      const status = err.response?.status
      if (status === 401) {
        await logout()
        return
      }
      if (status === 403) {
        setScoreError('You are not allowed to score this resume.')
      } else if (status === 404) {
        setScoreError('Resume not found.')
      } else if (status >= 500) {
        setScoreError('Unable to calculate the ATS score right now. Please try again.')
      } else {
        setScoreError(getErrorMessage(err))
      }
    } finally {
      setScoring(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-500">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  if (error || !resume) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <p className="text-sm text-red-600">{error || 'Resume not found'}</p>
        <Link
          to="/resume-analyzer"
          className="mt-4 inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-indigo-300 hover:text-indigo-700"
        >
          <ArrowLeft className="h-4 w-4" /> Back to resumes
        </Link>
      </div>
    )
  }

  const hasAnalysis = Boolean(resume.analysis)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            to="/resume-analyzer"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 transition hover:text-indigo-700"
          >
            <ArrowLeft className="h-4 w-4" /> Back to resumes
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
            {resume.fileName}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Uploaded {formatDate(resume.createdAt)} · {formatBytes(resume.fileSize)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleAnalyze}
            disabled={analyzing}
            className="inline-flex items-center gap-2 self-start rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300 sm:self-auto"
          >
            {analyzing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {analyzing
              ? 'Analyzing...'
              : hasAnalysis
                ? 'Re-analyze Resume'
                : 'Analyze Resume'}
          </button>
          <a
            href={resume.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 self-start rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-indigo-300 hover:text-indigo-700 sm:self-auto"
          >
            <ExternalLink className="h-4 w-4" /> Open PDF
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">File type</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">
            {resume.fileType || 'application/pdf'}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Size</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">
            {formatBytes(resume.fileSize)}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Extracted text</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">
            {resume.textLength.toLocaleString()} characters
          </p>
        </div>
      </div>

      <div>
        {(analysisError || analysisMessage) && (
          <div
            className={`flex items-center justify-between gap-3 rounded-lg border px-4 py-3 text-sm ${
              analysisError
                ? 'border-red-200 bg-red-50 text-red-800'
                : 'border-emerald-200 bg-emerald-50 text-emerald-800'
            }`}
          >
            <span className="flex items-center gap-2">
              {analysisError ? (
                <AlertTriangle className="h-4 w-4 shrink-0" />
              ) : (
                <CheckCircle2 className="h-4 w-4 shrink-0" />
              )}
              {analysisError || analysisMessage}
            </span>
            <button
              type="button"
              onClick={() => {
                setAnalysisError(null)
                setAnalysisMessage(null)
              }}
              className="font-medium hover:opacity-80"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-4">
          <Sparkles className="h-5 w-5 text-indigo-600" />
          <h2 className="font-semibold text-slate-900">AI Resume Analysis</h2>
        </div>

        {analyzing ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="relative">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100">
                <Loader2 className="h-7 w-7 animate-spin text-indigo-600" />
              </div>
            </div>
            <p className="mt-5 text-sm font-semibold text-slate-900">
              Analyzing your resume...
            </p>
            <p className="mt-1.5 max-w-md text-sm text-slate-500">
              AI is reviewing your skills, experience, projects and career profile.
            </p>
          </div>
        ) : !hasAnalysis ? (
          <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100">
              <Sparkles className="h-7 w-7 text-indigo-600" />
            </div>
            <p className="mt-5 max-w-sm text-sm text-slate-600">
              Your resume has not been analyzed yet.
            </p>
            <button
              type="button"
              onClick={handleAnalyze}
              disabled={analyzing}
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
            >
              <Sparkles className="h-4 w-4" /> Analyze Resume
            </button>
          </div>
        ) : (
          <div className="space-y-6 px-5 py-5">
            <SectionCard icon={FileText} title="Resume Summary">
              <SummaryText text={resume.analysis.summary} />
            </SectionCard>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <SectionCard icon={Sparkles} title="Strengths">
                <BulletList items={resume.analysis.strengths} />
              </SectionCard>
              <SectionCard icon={AlertTriangle} title="Areas for Improvement">
                <BulletList items={resume.analysis.weaknesses} />
              </SectionCard>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <SectionCard icon={Wrench} title="Technical Skills">
                <BadgeList items={resume.analysis.skills?.technical} />
              </SectionCard>
              <SectionCard icon={Users} title="Soft Skills">
                <BadgeList items={resume.analysis.skills?.soft} />
              </SectionCard>
            </div>

            <SectionCard icon={Briefcase} title="Experience Review">
              <div className="space-y-3">
                <SummaryText text={resume.analysis.experience?.summary} />
                <BulletList items={resume.analysis.experience?.observations} />
              </div>
            </SectionCard>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <SectionCard icon={GraduationCap} title="Education Review">
                <div className="space-y-3">
                  <SummaryText text={resume.analysis.education?.summary} />
                  <BulletList items={resume.analysis.education?.observations} />
                </div>
              </SectionCard>
              <SectionCard icon={FolderGit2} title="Projects Review">
                <div className="space-y-3">
                  <SummaryText text={resume.analysis.projects?.summary} />
                  <BulletList items={resume.analysis.projects?.observations} />
                </div>
              </SectionCard>
            </div>

            <SectionCard icon={Award} title="Certifications">
              <BadgeList items={resume.analysis.certifications} />
            </SectionCard>

            <SectionCard icon={Target} title="Recommended Roles">
              <BadgeList items={resume.analysis.recommendedRoles} />
            </SectionCard>

            <SectionCard icon={ListChecks} title="Improvement Suggestions">
              {resume.analysis.improvementSuggestions?.length ? (
                <ul className="space-y-3">
                  {resume.analysis.improvementSuggestions.map((item, i) => (
                    <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-slate-700">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[11px] font-bold text-indigo-700">
                        {i + 1}
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-500">Not mentioned in resume</p>
              )}
            </SectionCard>

            <div className="flex items-center justify-center">
              <button
                type="button"
                onClick={handleAnalyze}
                disabled={analyzing}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
              >
                {analyzing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                Re-analyze Resume
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Gauge className="h-5 w-5 text-indigo-600" />
            <h2 className="font-semibold text-slate-900">ATS Resume Score</h2>
          </div>
          <span className="text-xs text-slate-400">
            General resume check · no job description used
          </span>
        </div>

        {(scoreError || scoreMessage) && (
          <div
            className={`mx-5 mt-4 flex items-center justify-between gap-3 rounded-lg border px-4 py-3 text-sm ${
              scoreError
                ? 'border-red-200 bg-red-50 text-red-800'
                : 'border-emerald-200 bg-emerald-50 text-emerald-800'
            }`}
          >
            <span className="flex items-center gap-2">
              {scoreError ? (
                <AlertTriangle className="h-4 w-4 shrink-0" />
              ) : (
                <CheckCircle2 className="h-4 w-4 shrink-0" />
              )}
              {scoreError || scoreMessage}
            </span>
            <button
              type="button"
              onClick={() => {
                setScoreError(null)
                setScoreMessage(null)
              }}
              className="font-medium hover:opacity-80"
            >
              Dismiss
            </button>
          </div>
        )}

        {scoring ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100">
              <Loader2 className="h-7 w-7 animate-spin text-indigo-600" />
            </div>
            <p className="mt-5 text-sm font-semibold text-slate-900">
              Calculating ATS score...
            </p>
            <p className="mt-1.5 max-w-md text-sm text-slate-500">
              Checking structure, skills, experience, projects, education and content quality.
            </p>
          </div>
        ) : !resume.atsScore ? (
          <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100">
              <Gauge className="h-7 w-7 text-indigo-600" />
            </div>
            <p className="mt-5 max-w-sm text-sm text-slate-600">
              Your resume hasn't been scored yet.
            </p>
            <button
              type="button"
              onClick={handleCalculateATS}
              disabled={scoring}
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
            >
              <Gauge className="h-4 w-4" /> Check ATS Score
            </button>
          </div>
        ) : (
          <div className="space-y-8 px-5 py-6">
            <div className="flex flex-col items-center gap-6 rounded-2xl border border-slate-200 bg-slate-50/60 p-6 sm:flex-row sm:justify-center sm:gap-10">
              <ScoreRing score={resume.atsScore.overallScore} />
              <div className="text-center sm:text-left">
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${atsMeta(resume.atsScore.overallScore).bg} ${atsMeta(resume.atsScore.overallScore).text}`}
                >
                  {atsMeta(resume.atsScore.overallScore).label}
                </span>
                <p className="mt-3 max-w-sm text-sm text-slate-600">
                  Your resume scored {resume.atsScore.overallScore}/100 against general ATS criteria. Use the breakdown below to improve it.
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-base font-semibold text-slate-900">ATS Score Breakdown</h3>
              <div className="mt-4 grid grid-cols-1 gap-5 xl:grid-cols-2">
                {CATEGORY_LABELS.map((category) => {
                  const item = resume.atsScore.categories?.[category.key] || {}
                  const pct = item.maxScore
                    ? Math.max(0, Math.min(100, (item.score / item.maxScore) * 100))
                    : 0
                  return (
                    <div key={category.key} className="rounded-xl border border-slate-200 p-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-slate-700">{category.label}</span>
                        <span className="font-semibold text-slate-900">
                          {item.score ?? 0} / {item.maxScore ?? 0}
                        </span>
                      </div>
                      <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={`h-full rounded-full ${atsMeta(resume.atsScore.overallScore).bar}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      {Array.isArray(item.feedback) && item.feedback.length > 0 ? (
                        <ul className="mt-3 space-y-1.5">
                          {item.feedback.map((fb, i) => (
                            <li key={i} className="flex gap-2 text-xs text-slate-500">
                              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-slate-400" />
                              <span>{fb}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-3 text-xs text-slate-400">No issues detected.</p>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <SectionCard icon={CheckCircle2} title="Detected Resume Sections">
                {resume.atsScore.detectedSections?.length ? (
                  <div className="flex flex-wrap gap-2">
                    {resume.atsScore.detectedSections.map((section) => (
                      <span
                        key={section}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700"
                      >
                        <CheckCircle2 className="h-4 w-4" /> {section}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">No recognizable sections detected.</p>
                )}
              </SectionCard>
              <SectionCard icon={AlertTriangle} title="Missing / Recommended Sections">
                {resume.atsScore.missingSections?.length ? (
                  <BulletList items={resume.atsScore.missingSections} />
                ) : (
                  <p className="text-sm text-slate-500">All recommended sections detected.</p>
                )}
              </SectionCard>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <SectionCard icon={Wrench} title="Detected Keywords">
                <BadgeList items={resume.atsScore.detectedKeywords || []} />
              </SectionCard>
              <SectionCard icon={ListChecks} title="Suggested Keywords">
                {resume.atsScore.suggestedKeywords?.length ? (
                  <BadgeList items={resume.atsScore.suggestedKeywords} />
                ) : (
                  <p className="text-sm text-slate-500">No additional keywords suggested.</p>
                )}
              </SectionCard>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <SectionCard icon={FileText} title="Formatting Issues">
                {resume.atsScore.formattingIssues?.length ? (
                  <BulletList items={resume.atsScore.formattingIssues} />
                ) : (
                  <p className="text-sm text-slate-500">
                    No formatting issues detected (text-based approximation).
                  </p>
                )}
              </SectionCard>
              <SectionCard icon={AlertTriangle} title="Content Issues">
                {resume.atsScore.contentIssues?.length ? (
                  <BulletList items={resume.atsScore.contentIssues} />
                ) : (
                  <p className="text-sm text-slate-500">No content issues detected.</p>
                )}
              </SectionCard>
            </div>

            <SectionCard icon={ListChecks} title="Recommendations">
              {resume.atsScore.recommendations?.length ? (
                <ul className="space-y-3">
                  {resume.atsScore.recommendations.map((item, i) => (
                    <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-slate-700">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[11px] font-bold text-indigo-700">
                        {i + 1}
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-500">No recommendations for now.</p>
              )}
            </SectionCard>

            <div className="flex flex-col items-center gap-3">
              <button
                type="button"
                onClick={handleCalculateATS}
                disabled={scoring}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
              >
                {scoring ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Recalculate ATS Score
              </button>
              <p className="text-xs text-slate-400">
                ATS scoring is a text-based approximation of how resume parsers may read your document.
              </p>
            </div>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-4">
          <FileText className="h-5 w-5 text-indigo-600" />
          <h2 className="font-semibold text-slate-900">Extracted Text Preview</h2>
        </div>
        <pre className="max-h-[28rem] overflow-y-auto whitespace-pre-wrap break-words px-5 py-4 text-sm leading-relaxed text-slate-700">
          {resume.extractedText || 'No text was extracted from this PDF.'}
        </pre>
      </section>

      <p className="text-center text-xs text-slate-400">
        AI analysis provided by Google Gemini. Review suggestions before relying on them.
      </p>
    </div>
  )
}

export default ResumeDetails