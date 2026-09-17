import { HelpCircle, Layers } from 'lucide-react'
import { CATEGORY_LABELS } from '../constants/interviewCategories'

const CATEGORY_STYLES = {
  TECHNICAL: 'bg-indigo-50 text-indigo-700',
  CODING: 'bg-violet-50 text-violet-700',
  PROJECT: 'bg-sky-50 text-sky-700',
  RESUME: 'bg-teal-50 text-teal-700',
  BEHAVIORAL: 'bg-orange-50 text-orange-700',
  JOB_SPECIFIC: 'bg-fuchsia-50 text-fuchsia-700',
  SKILL_GAP: 'bg-rose-50 text-rose-700',
}

const DIFFICULTY_STYLES = {
  EASY: 'bg-emerald-50 text-emerald-700',
  MEDIUM: 'bg-amber-50 text-amber-700',
  HARD: 'bg-red-50 text-red-700',
}

const QuestionCard = ({ index, q }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex flex-wrap items-center gap-2">
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-50 text-xs font-bold text-indigo-700">
        {index + 1}
      </span>
      <span
        className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
          CATEGORY_STYLES[q.category] || 'bg-slate-100 text-slate-600'
        }`}
      >
        {CATEGORY_LABELS[q.category] || q.category}
      </span>
      <span
        className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
          DIFFICULTY_STYLES[q.difficulty] || 'bg-slate-100 text-slate-600'
        }`}
      >
        {q.difficulty}
      </span>
    </div>
    <p className="mt-3 text-sm font-medium leading-relaxed text-slate-900">{q.question}</p>
    {q.expectedTopics && q.expectedTopics.length > 0 && (
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <Layers className="h-3.5 w-3.5 text-slate-400" />
        {q.expectedTopics.map((topic) => (
          <span key={topic} className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
            {topic}
          </span>
        ))}
      </div>
    )}
    {q.whyAsked && (
      <p className="mt-3 flex items-start gap-1.5 text-xs leading-relaxed text-slate-500">
        <HelpCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
        {q.whyAsked}
      </p>
    )}
  </div>
)

export default QuestionCard