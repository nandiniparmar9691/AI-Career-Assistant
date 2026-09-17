import { STATUS_LABELS, STATUS_STYLES } from '../constants/applicationStatus'

const StatusBadge = ({ status }) => {
  const label = STATUS_LABELS[status] || status
  const style = STATUS_STYLES[status] || 'bg-slate-100 text-slate-700'
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${style}`}
    >
      {label}
    </span>
  )
}

export default StatusBadge