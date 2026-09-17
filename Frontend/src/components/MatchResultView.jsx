import { CheckCircle2, FileText, Lightbulb, ListChecks, Target, Wrench, XCircle } from 'lucide-react'

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

const BadgeList = ({ items, variant = 'indigo' }) =>
  Array.isArray(items) && items.length ? (
    <div className="flex flex-wrap gap-2">
      {items.map((item, i) => (
        <span
          key={i}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
            variant === 'green'
              ? 'bg-emerald-50 text-emerald-700'
              : variant === 'red'
                ? 'bg-red-50 text-red-700'
                : 'bg-indigo-50 text-indigo-700'
          }`}
        >
          {item}
        </span>
      ))}
    </div>
  ) : (
    <p className="text-sm text-slate-500">None</p>
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
    <p className="text-sm text-slate-500">None</p>
  )

const SummaryText = ({ text }) =>
  text ? (
    <p className="text-sm leading-relaxed text-slate-700">{text}</p>
  ) : (
    <p className="text-sm text-slate-500">Not specified</p>
  )

const matchMeta = (score) => {
  if (score >= 90)
    return { label: 'Excellent Match', text: 'text-emerald-700', bg: 'bg-emerald-50', ring: '#059669', bar: 'bg-emerald-500' }
  if (score >= 75)
    return { label: 'Strong Match', text: 'text-indigo-700', bg: 'bg-indigo-50', ring: '#4f46e5', bar: 'bg-indigo-500' }
  if (score >= 60)
    return { label: 'Moderate Match', text: 'text-amber-700', bg: 'bg-amber-50', ring: '#d97706', bar: 'bg-amber-500' }
  if (score >= 40)
    return { label: 'Low Match', text: 'text-orange-700', bg: 'bg-orange-50', ring: '#ea580c', bar: 'bg-orange-500' }
  return { label: 'Poor Match', text: 'text-red-700', bg: 'bg-red-50', ring: '#dc2626', bar: 'bg-red-500' }
}

const ScoreRing = ({ score, label }) => {
  const meta = matchMeta(score)
  const radius = 56
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - score / 100)
  return (
    <div className="relative h-40 w-40">
      <svg viewBox="0 0 140 140" className="h-full w-full">
        <circle cx="70" cy="70" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="12" />
        <circle
          cx="70" cy="70" r={radius} fill="none" stroke={meta.ring} strokeWidth="12"
          strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
          transform="rotate(-90 70 70)"
        />
        <text x="70" y="66" textAnchor="middle" dominantBaseline="middle" fontSize="32" fontWeight="700" fill="#0f172a">
          {score}
        </text>
        <text x="70" y="84" textAnchor="middle" fontSize="12" fill="#94a3b8">%</text>
      </svg>
      {label && (
        <div className="absolute inset-x-0 bottom-0 flex justify-center pt-0.5">
          <span className={`text-[11px] font-bold ${meta.text}`}>{label}</span>
        </div>
      )}
    </div>
  )
}

const CategoryBar = ({ label, score, maxScore }) => {
  const pct = maxScore ? Math.max(0, Math.min(100, (score / maxScore) * 100)) : 0
  const color = pct >= 75 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500'
  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-slate-700">{label}</span>
        <span className="font-semibold text-slate-900">
          {score} / {maxScore}
        </span>
      </div>
      <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

const STATUS_LABEL = {
  strong: 'Strong Match',
  partial: 'Partial Match',
  gap: 'Experience Gap',
  not_specified: 'Not Specified',
  match: 'Match',
  no_match: 'No Match',
}

const STATUS_STYLES = {
  strong: 'bg-emerald-50 text-emerald-700',
  match: 'bg-emerald-50 text-emerald-700',
  partial: 'bg-amber-50 text-amber-700',
  gap: 'bg-red-50 text-red-700',
  no_match: 'bg-red-50 text-red-700',
  not_specified: 'bg-slate-100 text-slate-600',
}

const MatchResultView = ({ analysis }) => {
  if (!analysis) return null

  const meta = matchMeta(analysis.matchPercentage || 0)

  const categories = [
    { key: 'skillsMatch', label: 'Skills Match (30 pts)' },
    { key: 'keywordMatch', label: 'Keyword Match (20 pts)' },
    { key: 'technologyMatch', label: 'Technology Match (20 pts)' },
    { key: 'experienceMatch', label: 'Experience Match (20 pts)' },
    { key: 'educationMatch', label: 'Education Match (10 pts)' },
  ]

  const exp = analysis.experienceMatch || {}
  const edu = analysis.educationMatch || {}

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-4">
          <Target className="h-5 w-5 text-indigo-600" />
          <h4 className="text-sm font-semibold text-slate-900">Overall Match</h4>
        </div>
        <div className="flex flex-col items-center gap-6 rounded-b-2xl bg-slate-50/60 px-6 py-8 sm:flex-row sm:justify-center sm:gap-10">
          <ScoreRing score={analysis.matchPercentage || 0} label={meta.label} />
          <div className="max-w-sm text-center sm:text-left">
            <p className="text-sm font-semibold text-slate-900">
              Resume-JD Match: {analysis.matchPercentage}%
            </p>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              {analysis.jobTitle
                ? `${analysis.resumeName || 'Resume'} evaluated against "${analysis.jobTitle}"${analysis.company ? ` at ${analysis.company}` : ''}.`
                : `${analysis.resumeName || 'Resume'} evaluated against the job description.`}
            </p>
            {Array.isArray(analysis.overallFeedback) && analysis.overallFeedback.length > 0 && (
              <ul className="mt-4 space-y-1.5 text-left text-xs text-slate-500">
                {analysis.overallFeedback.slice(0, 6).map((fb, i) => (
                  <li key={i} className="flex gap-2 leading-relaxed">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-slate-400" />
                    <span>{fb}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-4">
          <ListChecks className="h-5 w-5 text-indigo-600" />
          <h4 className="text-sm font-semibold text-slate-900">Score Breakdown</h4>
        </div>
        <div className="grid grid-cols-1 gap-4 px-5 py-5 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => {
            const item = analysis[cat.key] || {}
            return (
              <CategoryBar key={cat.key} label={cat.label} score={item.score ?? 0} maxScore={item.maxScore ?? 0} />
            )
          })}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <SectionCard icon={CheckCircle2} title="Matched Skills" headerRight={analysis.matchedSkills?.length ? <span className="text-xs text-emerald-600">{analysis.matchedSkills.length} matched</span> : null}>
          <BadgeList items={analysis.matchedSkills} variant="green" />
          {analysis.requiredSkillsMatched?.length > 0 && analysis.requiredSkillsMissing?.length > 0 && (
            <p className="mt-3 text-xs text-slate-400">
              Includes {analysis.requiredSkillsMatched.length} required and {analysis.preferredSkillsMatched?.length || 0} preferred skills.
            </p>
          )}
        </SectionCard>
        <SectionCard icon={XCircle} title="Missing Skills" headerRight={analysis.missingSkills?.length ? <span className="text-xs text-red-600">{analysis.missingSkills.length} missing</span> : null}>
          {analysis.missingSkills?.length ? (
            <>
              <BadgeList items={analysis.missingSkills} variant="red" />
              <p className="mt-3 text-xs text-slate-500">
                Skills to consider learning or gaining experience in.
              </p>
            </>
          ) : (
            <p className="text-sm text-slate-500">All listed skills are covered.</p>
          )}
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <SectionCard icon={FileText} title="Matched Keywords" headerRight={analysis.matchedKeywords?.length ? <span className="text-xs text-emerald-600">{analysis.matchedKeywords.length} matched</span> : null}>
          <BadgeList items={analysis.matchedKeywords} variant="green" />
        </SectionCard>
        <SectionCard icon={FileText} title="Missing Keywords" headerRight={analysis.missingKeywords?.length ? <span className="text-xs text-red-600">{analysis.missingKeywords.length} missing</span> : null}>
          {analysis.missingKeywords?.length ? (
            <>
              <BadgeList items={analysis.missingKeywords} variant="red" />
              <p className="mt-3 text-xs text-slate-500">
                Mention these only if you genuinely have related experience.
              </p>
            </>
          ) : (
            <p className="text-sm text-slate-500">All listed keywords are covered.</p>
          )}
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <SectionCard icon={Wrench} title="Matched Technologies" headerRight={analysis.matchedTechnologies?.length ? <span className="text-xs text-emerald-600">{analysis.matchedTechnologies.length} matched</span> : null}>
          <BadgeList items={analysis.matchedTechnologies} variant="green" />
        </SectionCard>
        <SectionCard icon={Wrench} title="Missing Technologies" headerRight={analysis.missingTechnologies?.length ? <span className="text-xs text-red-600">{analysis.missingTechnologies.length} missing</span> : null}>
          {analysis.missingTechnologies?.length ? (
            <>
              <BadgeList items={analysis.missingTechnologies} variant="red" />
              <p className="mt-3 text-xs text-slate-500">
                Technologies to consider learning or gaining practical exposure to.
              </p>
            </>
          ) : (
            <p className="text-sm text-slate-500">All listed technologies are covered.</p>
          )}
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <SectionCard icon={Target} title="Experience Match">
          {exp.status && (
            <div className="mb-3">
              <span className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${STATUS_STYLES[exp.status] || 'bg-slate-100 text-slate-600'}`}>
                {STATUS_LABEL[exp.status] || exp.status}
              </span>
            </div>
          )}
          {exp.jdRequirement && (
            <div className="mb-2">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Requirement</p>
              <p className="text-sm text-slate-700">{exp.jdRequirement}</p>
            </div>
          )}
          {exp.resumeSummary && (
            <div className="mb-3">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Resume estimate</p>
              <p className="text-sm text-slate-700">{exp.resumeSummary}</p>
            </div>
          )}
          <BulletList items={exp.feedback} />
        </SectionCard>
        <SectionCard icon={Target} title="Education Match">
          {edu.status && (
            <div className="mb-3">
              <span className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${STATUS_STYLES[edu.status] || 'bg-slate-100 text-slate-600'}`}>
                {STATUS_LABEL[edu.status] || edu.status}
              </span>
            </div>
          )}
          {edu.jdRequirement && (
            <div className="mb-2">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Requirement</p>
              <SummaryText text={edu.jdRequirement} />
            </div>
          )}
          {edu.resumeSummary && (
            <div className="mb-3">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Resume degree detected</p>
              <p className="text-sm text-slate-700 capitalize">{edu.resumeSummary}</p>
            </div>
          )}
          <BulletList items={edu.feedback} />
        </SectionCard>
      </div>

      <SectionCard icon={Lightbulb} title="How to Improve Your Match">
        {analysis.recommendations?.length ? (
          <ul className="space-y-3">
            {analysis.recommendations.map((item, i) => (
              <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-slate-700">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[11px] font-bold text-indigo-700">
                  {i + 1}
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-500">No recommendations at this time.</p>
        )}
      </SectionCard>
    </div>
  )
}

export default MatchResultView