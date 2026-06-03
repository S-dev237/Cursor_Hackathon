import { DOC_TYPE_COLORS, DOC_TYPE_LABELS } from '../../constants/colors.js'

export default function TypeBadge({ type }) {
  const colors = DOC_TYPE_COLORS[type] || DOC_TYPE_COLORS.report
  const label = DOC_TYPE_LABELS[type] || type

  return (
    <span
      className="badge-pill font-mono text-[10px] font-medium uppercase tracking-wider"
      style={{ backgroundColor: colors.bg, color: colors.text }}
    >
      {label}
    </span>
  )
}
