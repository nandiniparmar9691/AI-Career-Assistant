import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Briefcase,
  ClipboardList,
  FileSearch,
  FileText,
  Map,
  MessageCircleQuestion,
  Mic,
  Rocket,
  Sparkles,
  Target,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import {
  getMatches,
  getMockInterviews,
  getResumes,
} from '../services/api'

const quickActions = [
  { label: 'Analyze Resume', icon: FileSearch, href: '/resume-analyzer' },
  { label: 'Analyze Job', icon: Briefcase, href: '/job-analyzer' },
  { label: 'Match Resume', icon: ClipboardList, href: '/resume-jd-matcher' },
  { label: 'Skill Gap Analyzer', icon: Target, href: '/skill-gap' },
  { label: 'View Roadmap', icon: Map, href: '/roadmap' },
  {
    label: 'AI Interview Questions',
    icon: Mic,
    href: '/interview-questions',
  },
  { label: 'Mock Interview', icon: MessageCircleQuestion, href: '/mock-interview' },
  { label: 'ATS Resume Builder', icon: FileText, href: '/resume-builder' },
  {
    label: 'Job Application Tracker',
    icon: ClipboardList,
    href: '/applications',
  },
]

const Dashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [notice, setNotice] = useState(null)
  const [resumeScore, setResumeScore] = useState(null)
  const [matchCount, setMatchCount] = useState(0)
  const [interviewCount, setInterviewCount] = useState(0)

  useEffect(() => {
    let active = true
    getResumes()
      .then(({ data }) => {
        if (!active) return
        const scored = (data.resumes || []).filter((r) => r.atsScore != null)
        if (scored.length) {
          const latest = scored.reduce((a, b) =>
            new Date(a.createdAt) > new Date(b.createdAt) ? a : b
          )
          setResumeScore(latest.atsScore)
        }
      })
      .catch(() => {})
    getMatches()
      .then(({ data }) => {
        if (active) setMatchCount((data.matches || []).length)
      })
      .catch(() => {})
    getMockInterviews()
      .then(({ data }) => {
        if (active) setInterviewCount((data.mockInterviews || []).length)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])

  const stats = [
    { label: 'Resume Score', value: resumeScore != null ? `${resumeScore}%` : '--', icon: FileSearch, tint: 'bg-indigo-50 text-indigo-600' },
    { label: 'Job Matches', value: matchCount, icon: Briefcase, tint: 'bg-emerald-50 text-emerald-600' },
    { label: 'Interviews', value: interviewCount, icon: Mic, tint: 'bg-amber-50 text-amber-600' },
    { label: 'Applications', value: '0', icon: ClipboardList, tint: 'bg-violet-50 text-violet-600' },
  ]

  const handleQuickAction = (action) => {
    if (action.href) {
      navigate(action.href)
    } else {
      setNotice(`${action.label} is coming soon.`)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
          Welcome back, {user?.name || 'there'} 👋
        </h1>
        <p className="mt-1.5 text-sm text-slate-500 sm:text-base">
          Track your career preparation and get job-ready with AI.
        </p>
      </div>

      {notice && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <span>{notice}</span>
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="font-medium hover:text-amber-900"
          >
            Dismiss
          </button>
        </div>
      )}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.tint}`}>
                <stat.icon className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-4 text-3xl font-bold text-slate-900">{stat.value}</p>
            <p className="mt-1 text-sm font-medium text-slate-500">{stat.label}</p>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Your Career Progress</h2>
        <div className="mt-6 flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100">
            <Sparkles className="h-6 w-6 text-indigo-600" />
          </div>
          <p className="mt-4 max-w-sm text-sm text-slate-600">
            Your career insights will appear here after you analyze your resume.
          </p>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-900">Quick Actions</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {quickActions.map((action) => (
            <button
              key={action.label}
              type="button"
              onClick={() => handleQuickAction(action)}
              className="group rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-indigo-300 hover:shadow-md"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition group-hover:bg-indigo-600 group-hover:text-white">
                <action.icon className="h-5 w-5" />
              </div>
              <p className="mt-4 text-sm font-semibold text-slate-900">{action.label}</p>
              <p className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-indigo-600">
                {action.href ? (
                  <>
                    <ArrowRight className="h-3.5 w-3.5" /> Open
                  </>
                ) : (
                  <>
                    <Rocket className="h-3.5 w-3.5" /> Coming soon
                  </>
                )}
              </p>
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}

export default Dashboard