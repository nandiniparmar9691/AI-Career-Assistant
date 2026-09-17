export const APPLICATION_STATUSES = [
  'SAVED',
  'APPLIED',
  'SCREENING',
  'INTERVIEW',
  'TECHNICAL_ROUND',
  'FINAL_ROUND',
  'OFFER',
  'REJECTED',
  'WITHDRAWN',
]

export const STATUS_LABELS = {
  SAVED: 'Saved',
  APPLIED: 'Applied',
  SCREENING: 'Screening',
  INTERVIEW: 'Interview',
  TECHNICAL_ROUND: 'Technical Round',
  FINAL_ROUND: 'Final Round',
  OFFER: 'Offer',
  REJECTED: 'Rejected',
  WITHDRAWN: 'Withdrawn',
}

export const STATUS_SORT_OPTIONS = [
  { value: 'latest', label: 'Latest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'company', label: 'Company' },
  { value: 'status', label: 'Status' },
  { value: 'interviewDate', label: 'Interview Date' },
]

export const STATUS_STYLES = {
  SAVED: 'bg-slate-100 text-slate-700',
  APPLIED: 'bg-indigo-50 text-indigo-700',
  SCREENING: 'bg-sky-50 text-sky-700',
  INTERVIEW: 'bg-violet-50 text-violet-700',
  TECHNICAL_ROUND: 'bg-purple-50 text-purple-700',
  FINAL_ROUND: 'bg-fuchsia-50 text-fuchsia-700',
  OFFER: 'bg-emerald-50 text-emerald-700',
  REJECTED: 'bg-red-50 text-red-700',
  WITHDRAWN: 'bg-amber-50 text-amber-700',
}