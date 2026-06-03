export default function Spinner({ size = 24, className = '' }) {
  return (
    <span
      role="status"
      aria-label="Chargement"
      className={`inline-block animate-spin rounded-full border-2 border-gray-border border-t-teal ${className}`}
      style={{ width: size, height: size }}
    />
  )
}
