import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { getAnalytics, getErrorMessage } from '../services/api'
import { STATUS_LABELS } from '../constants/applicationStatus'
import {
  AlertTriangle,
  BarChart3,
  Briefcase,
  FileSearch,
  Loader2,
  Mic,
  Sparkles,
  Trophy,
  XCircle,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const STATUS_COLORS = {
  SAVED: '#94a3b8',
  APPLIED: '#6366f1',
  SCREENING: '#0ea5e9',
  INTERVIEW: '#8b5cf6',
  TECHNICAL_ROUND: '#a855f7',
  FINAL_ROUND: '#d946ef',
  OFFER: '#10b981',
  REJECTED: '#ef4444',
  WITHDRAWN: '#f59e0b',
}

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

const StatCard = ({ icon: Icon, label, value, sub, accent = 'text-indigo-600' }) => (
  <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
    <div className="flex items-center gap-2">
      <Icon className={`h-4 w-4 ${accent}`} />
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
    </div>
    <p className="mt-1.5 text-2xl font-bold text-slate-900">{value}</p>
    {sub ? <p className="mt-0.5 text-xs text-slate-500">{sub}</p> : null}
  </div>
)

const SectionCard = ({ title, subtitle, children }) => (
  <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="mb-4">
      <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      {subtitle ? <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p> : null}
    </div>
    {children}
  </section>
)

const ChartEmpty = ({ message }) => (
  <div className="flex min-h-[220px] items-center justify-center rounded-xl border border-dashed border-slate-200 text-sm text-slate-400">
    {message}
  </div>
)

const SkillChips = ({ items }) =>
  items && items.length > 0 ? (
    <div className="flex flex-wrap gap-2">
      {items.map((skill) => (
        <span
          key={skill}
          className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700"
        >
          {skill}
        </span>
      ))}
    </div>
  ) : (
    <p className="text-sm text-slate-400">No data yet.</p>
  )

const CareerAnalytics = () => {
  const { logout } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true
    const load = async () => {
      setError(null)
      try {
        const { data: response } = await getAnalytics()
        if (!active) return
        setData(response.data)
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
  }, [logout])

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
        <AlertTriangle className="h-8 w-8 text-red-600" />
        <p className="text-sm font-medium text-red-700">{error}</p>
      </div>
    )
  }

  const applications = data?.applications || {}
  const interviews = data?.interviews || {}
  const resume = data?.resume || {}
  const skills = data?.skills || {}
  const timeline = data?.timeline || []

  const isEmpty =
    (applications.total || 0) === 0 &&
    (interviews.total || 0) === 0 &&
    (resume.analyzed || 0) === 0 &&
    (skills.userSkills || []).length === 0 &&
    (skills.requiredSkills || []).length === 0 &&
    (skills.missingSkills || []).length === 0

  if (isEmpty) {
    return (
      <div className="mx-auto max-w-xl text-center">
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-slate-200 bg-white p-10 shadow-sm">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50">
            <BarChart3 className="h-7 w-7 text-indigo-600" />
          </div>
          <h1 className="text-lg font-semibold text-slate-900">Career Analytics</h1>
          <p className="text-sm text-slate-500">
            Your analytics will appear here as you start using the platform. Upload and
            analyze a resume, save job applications, run skill-gap analysis, or complete a
            mock interview to see your progress.
          </p>
        </div>
      </div>
    )
  }

  const statusData = (applications.statusCounts || []).map((item) => ({
    ...item,
    label: STATUS_LABELS[item.status] || item.status,
  }))

  const timelineData = timeline.map((item) => ({
    ...item,
    monthLabel: item.month || '',
  }))

  const atsTrendData = (resume.atsTrend || []).map((item) => ({
    ...item,
    dateLabel: formatDate(item.date),
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Career Analytics</h1>
          <p className="mt-1 text-sm text-slate-600">
            Track your job search, interviews, resume ATS scores, and skill progress.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Briefcase}
          label="Total Applications"
          value={applications.total || 0}
          sub={`${applications.applied || 0} applied`}
        />
        <StatCard
          icon={Mic}
          label="Interviews"
          value={`${interviews.completed || 0}/${interviews.total || 0}`}
          sub={`${interviews.inProgress || 0} in progress`}
          accent="text-violet-600"
        />
        <StatCard
          icon={Trophy}
          label="Offers"
          value={applications.offer || 0}
          sub={`${applications.conversionRate || 0}% conversion`}
          accent="text-emerald-600"
        />
        <StatCard
          icon={FileSearch}
          label="Average ATS Score"
          value={resume.averageAtsScore || 0}
          sub={`${resume.analyzed || 0} resume${(resume.analyzed || 0) === 1 ? '' : 's'} analyzed`}
          accent="text-sky-600"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <SectionCard
          title="Application Status"
          subtitle="Distribution of your job applications by current status"
        >
          {statusData.length > 0 ? (
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    dataKey="count"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                  >
                    {statusData.map((item) => (
                      <Cell
                        key={item.status}
                        fill={STATUS_COLORS[item.status] || '#94a3b8'}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <ChartEmpty message="No applications yet." />
          )}
        </SectionCard>

        <SectionCard
          title="Response & Conversion"
          subtitle="How employers are responding to your applications"
        >
          <div className="space-y-4 py-2">
            {[
              { label: 'Response rate', value: applications.responseRate || 0 },
              { label: 'Interview rate', value: applications.interviewRate || 0 },
              { label: 'Conversion rate', value: applications.conversionRate || 0 },
            ].map((item) => (
              <div key={item.label}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="text-slate-600">{item.label}</span>
                  <span className="font-semibold text-slate-900">{item.value}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-indigo-600"
                    style={{ width: `${Math.min(item.value, 100)}%` }}
                  />
                </div>
              </div>
            ))}
            <div className="grid grid-cols-2 gap-3 pt-2 sm:grid-cols-4">
              <div className="rounded-xl bg-slate-50 p-3 text-center">
                <p className="text-xl font-bold text-slate-900">{applications.inReview || 0}</p>
                <p className="text-xs text-slate-500">In review</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3 text-center">
                <p className="text-xl font-bold text-slate-900">{applications.interview || 0}</p>
                <p className="text-xs text-slate-500">Interviews</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3 text-center">
                <p className="text-xl font-bold text-slate-900">{applications.offer || 0}</p>
                <p className="text-xs text-slate-500">Offers</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3 text-center">
                <p className="text-xl font-bold text-slate-900">{applications.rejected || 0}</p>
                <p className="text-xs text-slate-500">Rejected</p>
              </div>
            </div>
          </div>
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <SectionCard
          title="Applications Over Time"
          subtitle="Monthly application count"
        >
          {timelineData.length > 0 ? (
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="monthLabel" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="total" name="Applications" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="applied" name="Applied" fill="#a5b4fc" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <ChartEmpty message="No applications yet." />
          )}
        </SectionCard>

        <SectionCard
          title="ATS Score Trend"
          subtitle="Resume ATS scores over time"
        >
          {atsTrendData.length > 0 ? (
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={atsTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="dateLabel" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="score"
                    name="ATS Score"
                    stroke="#0ea5e9"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <ChartEmpty message="No ATS scores yet." />
          )}
          {atsTrendData.length > 1 ? (
            <div className="mt-3 grid grid-cols-3 gap-3">
              <div className="rounded-xl bg-slate-50 p-3 text-center">
                <p className="text-xl font-bold text-slate-900">{resume.highestAtsScore || 0}</p>
                <p className="text-xs text-slate-500">Highest</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3 text-center">
                <p className="text-xl font-bold text-slate-900">{resume.latestAtsScore || 0}</p>
                <p className="text-xs text-slate-500">Latest</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3 text-center">
                <p className="text-xl font-bold text-slate-900">{resume.averageAtsScore || 0}</p>
                <p className="text-xs text-slate-500">Average</p>
              </div>
            </div>
          ) : null}
        </SectionCard>
      </div>

      <SectionCard
        title="Interview Analytics"
        subtitle="Mock interview performance summary"
      >
        {interviews.total > 0 ? (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl bg-slate-50 p-3 text-center">
                <p className="text-xl font-bold text-slate-900">{interviews.total}</p>
                <p className="text-xs text-slate-500">Total</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3 text-center">
                <p className="text-xl font-bold text-slate-900">{interviews.completed || 0}</p>
                <p className="text-xs text-slate-500">Completed</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3 text-center">
                <p className="text-xl font-bold text-slate-900">{interviews.inProgress || 0}</p>
                <p className="text-xs text-slate-500">In progress</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3 text-center">
                <p className="text-xl font-bold text-slate-900">{interviews.averageScore || 0}</p>
                <p className="text-xs text-slate-500">Avg score</p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3">
                <Sparkles className="h-5 w-5 shrink-0 text-emerald-600" />
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-emerald-600">
                    Strongest area
                  </p>
                  <p className="text-sm font-semibold text-slate-900">
                    {interviews.strongestCategory
                      ? `${interviews.strongestCategory.name} (${interviews.strongestCategory.averageScore})`
                      : 'Not enough data'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3">
                <XCircle className="h-5 w-5 shrink-0 text-red-600" />
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-red-600">
                    Weakest area
                  </p>
                  <p className="text-sm font-semibold text-slate-900">
                    {interviews.weakestCategory
                      ? `${interviews.weakestCategory.name} (${interviews.weakestCategory.averageScore})`
                      : 'Not enough data'}
                  </p>
                </div>
              </div>
            </div>

            {(interviews.recent || []).length > 0 ? (
              <div className="mt-4">
                <p className="mb-2 text-sm font-medium text-slate-700">Recent performance</p>
                <div className="divide-y divide-slate-100 rounded-xl border border-slate-100">
                  {(interviews.recent || []).map((item) => (
                    <div key={item.id} className="flex items-center justify-between px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {item.targetRole || 'Mock interview'}
                        </p>
                        <p className="text-xs text-slate-500">{formatDate(item.completedAt)}</p>
                      </div>
                      <span className="rounded-full bg-indigo-50 px-3 py-1 text-sm font-semibold text-indigo-700">
                        {item.score}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </>
        ) : (
          <p className="text-sm text-slate-400">
            Complete a mock interview to see your performance analytics here.
          </p>
        )}
      </SectionCard>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <SectionCard title="Your Skills" subtitle="Identified from your analyzed resumes">
          <SkillChips items={skills.userSkills} />
        </SectionCard>
        <SectionCard title="Frequently Required" subtitle="Skills requested across your saved job descriptions">
          <SkillChips items={skills.requiredSkills} />
        </SectionCard>
        <SectionCard title="Missing Skills" subtitle="Skills to close from your skill-gap analysis">
          <SkillChips items={skills.missingSkills} />
        </SectionCard>
      </div>
    </div>
  )
}

export default CareerAnalytics