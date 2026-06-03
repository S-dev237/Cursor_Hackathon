function SparkleIcon({ className = '' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 2l1.6 5.6L19 9.2l-5.4 1.6L12 16l-1.6-5.2L5 9.2l5.4-1.6L12 2zm6 11l.8 2.7L21.5 16l-2.7.8L18 19.5l-.8-2.7L14.5 16l2.7-.8L18 13z" />
    </svg>
  )
}

export default function AiBadge({ confidence, label = 'IA' }) {
  const pct =
    typeof confidence === 'number' ? Math.round(confidence * 100) : null

  return (
    <span className="badge-ai relative overflow-hidden">
      <SparkleIcon className="h-3 w-3" />
      {label}
      {pct !== null && <span className="opacity-70">{pct}%</span>}
    </span>
  )
}
