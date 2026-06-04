import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/layout/Navbar.jsx'
import Spinner from '../components/ui/Spinner.jsx'
import { getDomains, searchDocuments } from '../api/documents.js'
import { DOMAIN_META } from '../constants/colors.js'

/** Glyphes par domaine (slug). Trait fin, hérite de currentColor. */
const DOMAIN_ICONS = {
  informatique: <path d="M8 9l-3 3 3 3M16 9l3 3-3 3M13.5 7l-3 10" />,
  mathematiques: <path d="M17 5H7l5 7-5 7h10" />,
  'genie-civil': <path d="M4 21V8l8-4 8 4v13M3 21h18M9 21v-5h6v5" />,
  'sciences-biologiques': (
    <path d="M6 20C6 11 13 5 20 5c0 9-6 15-14 15zM6 20c3.5-1 6.5-3.5 8.5-7" />
  ),
  'economie-gestion': <path d="M3 17l6-6 4 4 8-8M21 7v5h-5" />,
  droit: (
    <path d="M12 3v18M4 21h16M7 7l-3 6a3 3 0 006 0L7 7zM17 7l-3 6a3 3 0 006 0l-3-6M7 7l5-2 5 2" />
  ),
  medecine: <path d="M12 21s-7-4.6-7-10a4 4 0 017.9-1 4 4 0 017.1 1c0 5.4-7 10-7 10zM12 9v4M10 11h4" />,
  physique: (
    <>
      <ellipse cx="12" cy="12" rx="9" ry="3.6" />
      <ellipse cx="12" cy="12" rx="9" ry="3.6" transform="rotate(60 12 12)" />
      <ellipse cx="12" cy="12" rx="9" ry="3.6" transform="rotate(120 12 12)" />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
    </>
  ),
  fallback: <path d="M5 4h11a2 2 0 012 2v14H7a2 2 0 00-2 2V4zM7 18h11" />,
}

function DomainCard({ domain, count, index }) {
  const meta = DOMAIN_META[domain.slug] || DOMAIN_META.fallback
  const icon = DOMAIN_ICONS[domain.slug] || DOMAIN_ICONS.fallback

  return (
    <Link
      to={`/search?domain_id=${encodeURIComponent(domain.id)}`}
      className="group relative flex animate-fade-up flex-col overflow-hidden rounded-xl border border-gray-200/60 bg-white p-5 shadow-card transition-all duration-200 ease-premium hover:-translate-y-0.5 hover:shadow-card-hover dark:border-navy-700 dark:bg-navy-800"
      style={{ animationDelay: `${Math.min(index * 0.04, 0.4)}s` }}
    >
      {/* Halo d'accent au survol */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100"
        style={{ backgroundColor: `${meta.accent}26` }}
      />
      <div className="relative flex items-start justify-between gap-3">
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105"
          style={{ backgroundColor: `${meta.accent}1A`, color: meta.accent }}
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            {icon}
          </svg>
        </span>
        {count > 0 && (
          <span className="rounded-full bg-gray-50 px-2 py-0.5 font-mono text-[11px] font-medium text-gray-500 dark:bg-navy-900 dark:text-gray-400">
            {count} {count > 1 ? 'travaux' : 'travail'}
          </span>
        )}
      </div>
      <h2 className="relative mt-4 font-serif text-[17px] font-semibold leading-snug text-gray-900 dark:text-gray-100">
        {domain.name}
      </h2>
      <p className="relative mt-1 text-[13px] leading-relaxed text-gray-500 dark:text-gray-400">
        {meta.tagline}
      </p>
      <span
        className="relative mt-4 inline-flex items-center gap-1 text-xs font-medium opacity-0 transition-all duration-200 group-hover:opacity-100"
        style={{ color: meta.accent }}
      >
        Explorer le domaine
        <span className="transition-transform duration-200 group-hover:translate-x-0.5">→</span>
      </span>
    </Link>
  )
}

export default function DomainsPage() {
  const [domains, setDomains] = useState([])
  const [counts, setCounts] = useState({})
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')

  useEffect(() => {
    let active = true
    getDomains().then(({ data }) => {
      if (!active) return
      setDomains(data || [])
      setLoading(false)
    })
    // Compteur de travaux publiés par domaine (une seule requête).
    searchDocuments({ per_page: 100, status: 'published' }).then(({ data }) => {
      if (!active || !data?.documents) return
      const tally = {}
      for (const d of data.documents) {
        if (d.domain_id) tally[d.domain_id] = (tally[d.domain_id] || 0) + 1
      }
      setCounts(tally)
    })
    return () => {
      active = false
    }
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return domains
    return domains.filter((d) => (d.name || '').toLowerCase().includes(q))
  }, [domains, query])

  return (
    <div className="page-shell flex min-h-dvh flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-10 sm:px-6">
        <header className="mb-7">
          <p className="section-label mb-2">Explorer</p>
          <h1 className="font-serif text-3xl font-semibold text-gray-900 dark:text-gray-100">
            Domaines de recherche
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-gray-500 dark:text-gray-400">
            Parcourez les travaux par discipline académique et plongez dans le
            corpus qui vous intéresse.
          </p>
        </header>

        <div className="relative mb-7 max-w-md">
          <svg
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un domaine…"
            aria-label="Rechercher un domaine"
            className="input-base pl-10"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner size={28} />
          </div>
        ) : domains.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 bg-white py-16 text-center text-sm text-gray-500 dark:border-navy-700 dark:bg-navy-800 dark:text-gray-400">
            Aucun domaine disponible pour le moment.
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 bg-white py-16 text-center text-sm text-gray-500 dark:border-navy-700 dark:bg-navy-800 dark:text-gray-400">
            Aucun domaine ne correspond à «&nbsp;{query}&nbsp;».
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((d, i) => (
              <DomainCard key={d.id} domain={d} count={counts[d.id] || 0} index={i} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
