function range(start, end) {
  return Array.from({ length: end - start + 1 }, (_, i) => start + i)
}

// Construit une liste de pages avec ellipses, max ~7 visibles
function buildPages(current, total) {
  if (total <= 7) return range(1, total)
  if (current <= 4) return [...range(1, 5), '…', total]
  if (current >= total - 3) return [1, '…', ...range(total - 4, total)]
  return [1, '…', current - 1, current, current + 1, '…', total]
}

export default function Pagination({ page, total, perPage, onChange }) {
  const totalPages = Math.max(1, Math.ceil(total / perPage))
  if (totalPages <= 1) return null

  const pages = buildPages(page, totalPages)

  const go = (p) => {
    if (p < 1 || p > totalPages || p === page) return
    onChange(p)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const btn =
    'flex h-9 min-w-9 items-center justify-center rounded-md border px-2 text-sm transition-colors'

  return (
    <nav className="flex items-center justify-center gap-1.5" aria-label="Pagination">
      <button
        type="button"
        onClick={() => go(page - 1)}
        disabled={page === 1}
        className={`${btn} border-gray-border bg-white text-gray-text hover:border-teal-mid disabled:opacity-40 dark:border-navy-700 dark:bg-navy-800 dark:text-gray-200 dark:hover:border-teal-500/40`}
      >
        ‹
      </button>

      {pages.map((p, i) =>
        p === '…' ? (
          <span key={`e-${i}`} className="px-1 text-gray-muted">
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => go(p)}
            aria-current={p === page ? 'page' : undefined}
            className={`${btn} ${
              p === page
                ? 'border-teal bg-teal text-white'
                : 'border-gray-border bg-white text-gray-text hover:border-teal-mid dark:border-navy-700 dark:bg-navy-800 dark:text-gray-200 dark:hover:border-teal-500/40'
            }`}
          >
            {p}
          </button>
        ),
      )}

      <button
        type="button"
        onClick={() => go(page + 1)}
        disabled={page === totalPages}
        className={`${btn} border-gray-border bg-white text-gray-text hover:border-teal-mid disabled:opacity-40 dark:border-navy-700 dark:bg-navy-800 dark:text-gray-200 dark:hover:border-teal-500/40`}
      >
        ›
      </button>
    </nav>
  )
}
