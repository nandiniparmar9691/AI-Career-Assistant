import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  Lightbulb,
  ListChecks,
  Target,
  Wrench,
  XCircle,
} from 'lucide-react'

const PRIORITY_STYLES = {
  HIGH: 'bg-red-50 text-red-700 ring-red-200',
  MEDIUM: 'bg-amber-50 text-amber-700 ring-amber-200',
  LOW: 'bg-slate-100 text-slate-600 ring-slate-200',
}

const TYPE_LABELS = {
  SKILL: 'Skill',
  TECHNOLOGY: 'Technology',
  KEYWORD: 'Keyword',
  EXPERIENCE: 'Experience',
  EDUCATION: 'Education',
  GENERAL: 'General',
}

const SectionCard = ({ icon: Icon, title, children, headerRight }) => (
  <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
    <div className="flex items-center justify-between gap-2 border-b border-slate-200 px-5 py-4">
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5 text-indigo-600" />
        <h4 className="text-sm font-semibold text-slate-900">{title}</h4>
      </div>
      {headerRight || null}
    </div>
    <div className="px-5 py-4">{children}</div>
  </section>
)

const PriorityBadge = ({ priority }) => (
  <span
    className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold ring-1 ${
      PRIORITY_STYLES[priority] || PRIORITY_STYLES.LOW
    }`}
  >
    {priority || 'LOW'}
  </span>
)

const GapList = ({ items, emptyText }) =>
  items && items.length ? (
    <ul className="space-y-3">
      {items.map((item, i) => (
        <li key={i} className="flex flex-col gap-1.5 rounded-lg border border-slate-100 bg-slate-50/60 px-3.5 py-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900">{item.name}</p>
            {item.reason && (
              <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{item.reason}</p>
            )}
          </div>
          <PriorityBadge priority={item.priority} />
        </li>
      ))}
    </ul>
  ) : (
    <p className="text-sm text-slate-500">{emptyText || 'None identified.'}</p>
  )

const RecommendationList = ({ items }) =>
  items && items.length ? (
    <ul className="space-y-3">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[11px] font-bold text-indigo-700">
            {i + 1}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900">
              {item.title || (item.type ? TYPE_LABELS[item.type] || item.type : '')}
              {item.type ? (
                <span className="ml-2 inline-flex rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-indigo-600">
                  {TYPE_LABELS[item.type] || item.type}
                </span>
              ) : null}
            </p>
            {item.description && (
              <p className="mt-0.5 text-sm leading-relaxed text-slate-600">{item.description}</p>
            )}
          </div>
        </li>
      ))}
    </ul>
  ) : (
    <p className="text-sm text-slate-500">No recommendations at this time.</p>
  )

const countByPriority = (items) => {
  const counts = { HIGH: 0, MEDIUM: 0, LOW: 0 }
  for (const item of items || []) {
    if (item && counts[item.priority] != null) counts[item.priority] += 1
  }
  return counts
}

const SkillGapResultView = ({ skillGap }) => {
  if (!skillGap) return null

  const skills = skillGap.missingSkills || []
  const tech = skillGap.missingTechnologies || []
  const keywords = skillGap.missingKeywords || []
  const allGaps = [...skills, ...tech, ...keywords]
  const priorities = countByPriority(allGaps)

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-4">
          <Target className="h-5 w-5 text-indigo-600" />
          <h4 className="text-sm font-semibold text-slate-900">Skill Gap Summary</h4>
        </div>
        <div className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-6">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Match Percentage</p>
              <p className="mt-1 text-3xl font-bold text-slate-900">
                {skillGap.matchPercentage != null ? `${skillGap.matchPercentage}%` : '--'}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-sm font-semibold text-red-700">
                <AlertTriangle className="h-4 w-4" /> {priorities.HIGH} high
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-1.5 text-sm font-semibold text-amber-700">
                {priorities.MEDIUM} medium
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-600">
                {priorities.LOW} low
              </span>
            </div>
          </div>
          {skillGap.overallSummary && (
            <p className="max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-right">
              {skillGap.overallSummary}
            </p>
          )}
        </div>
      </section>

      <SectionCard
        icon={CheckCircle2}
        title="Current Strengths"
        headerRight={skillGap.strengths?.length ? (
          <span className="text-xs text-emerald-600">{skillGap.strengths.length} demonstrated</span>
        ) : null}
      >
        {skillGap.strengths && skillGap.strengths.length ? (
          <div className="flex flex-wrap gap-2">
            {skillGap.strengths.map((item, i) => (
              <span key={i} className="rounded-lg bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700">
                {item}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">No matches came back for this job description.</p>
        )}
        <p className="mt-3 text-xs text-slate-400">
          Already demonstrated — these are found in your resume, not assumed.
        </p>
      </SectionCard>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <SectionCard icon={XCircle} title="Missing Skills" headerRight={skills.length ? <span className="text-xs text-red-600">{skills.length} missing</span> : null}>
          <GapList items={skills} emptyText="No missing skills identified for this role." />
        </SectionCard>
        <SectionCard icon={Wrench} title="Missing Technologies" headerRight={tech.length ? <span className="text-xs text-red-600">{tech.length} missing</span> : null}>
          <GapList items={tech} emptyText="No missing technologies identified for this role." />
        </SectionCard>
      </div>

      <SectionCard icon={FileText} title="Missing Keywords" headerRight={keywords.length ? <span className="text-xs text-red-600">{keywords.length} missing</span> : null}>
        <GapList items={keywords} emptyText="No missing keywords identified for this role." />
      </SectionCard>

      <SectionCard icon={Lightbulb} title="Recommended to Learn">
        <RecommendationList items={skillGap.recommendations} />
      </SectionCard>

      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
        <p className="flex items-start gap-2 text-xs leading-relaxed text-slate-500">
          <ListChecks className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" />
          Missing items are gaps identified from the job description. They are never presented as
          skills you already have — treat each one as an area to learn and gain practical
          experience in.
        </p>
      </div>
    </div>
  )
}

export default SkillGapResultView