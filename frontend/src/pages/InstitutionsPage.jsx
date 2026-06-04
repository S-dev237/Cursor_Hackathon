import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/layout/Navbar.jsx'
import Spinner from '../components/ui/Spinner.jsx'
import { getInstitutions, searchDocuments } from '../api/documents.js'

function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <path d="M12 21s-6-5.2-6-10a6 6 0 1112 0c0 4.8-6 10-6 10z" strokeLinejoin="round" />
      <circle cx="12" cy="11" r="2" />
    </svg>
  )
}

function InstitutionCard({ institution, count, index }) {
  const acronym =
    institution.acronym || (institution.name || '?').slice(0, 2).toUpperCase()

  return (
    <Link
      to={`/search?institution_id=${encodeURIComponent(institution.id)}`}
      className="group flex animate-fade-up items-center gap-4 rounded-xl border border-gray-200/60 bg-white p-4 shadow-card transition-all duration-200 ease-premium hover:-translate-y-0.5 hover:border-teal-300/50 hover:shadow-card-hover dark:border-navy-700 dark:bg-navy-800 dark:hover:border-teal-500/40"
      style={{ animationDelay: `${Math.min(index * 0.05, 0.4)}s` }}
    >
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-navy-800 to-teal-700 font-mono text-xs font-semibold tracking-wide text-white shadow-sm ring-1 ring-white/10 transition-transform duration-200 group-hover:scale-105 dark:from-navy-700 dark:to-teal-700">
        {acronym}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-serif text-[15px] font-medium text-gray-900 transition-colors duration-200 group-hover:text-teal-700 dark:text-gray-100 dark:group-hover:text-teal-300">
          {institution.name}
        </span>
        <span className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
          {institution.city && (
            <span className="inline-flex items-center gap-1">
              <PinIcon />
              {institution.city}
            </span>
          )}
          {count > 0 && (
            <span className="font-mono text-[11px] text-gray-400 dark:text-gray-500">
              {count} {count > 1 ? 'travaux' : 'travail'}
            </span>
          )}
        </span>
      </span>
      <span className="shrink-0 text-gray-300 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-teal-500 dark:text-gray-600">
        →
      </span>
    </Link>
  )
}

export default function InstitutionsPage() {
  const [institutions, setInstitutions] = useState([])
  const [counts, setCounts] = useState({})
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')

  useEffect(() => {
    let active = true
    getInstitutions().then(({ data }) => {
      if (!active) return
      setInstitutions(data || [])
      setLoading(false)
    })
    searchDocuments({ per_page: 100, status: 'published' }).then(({ data }) => {
      if (!active || !data?.documents) return
      const tally = {}
      for (const d of data.documents) {
        if (d.institution_id) tally[d.institution_id] = (tally[d.institution_id] || 0) + 1
      }
      setCounts(tally)
    })
    return () => {
      active = false
    }
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return institutions
    return institutions.filter((i) =>
      [i.name, i.acronym, i.city].some((field) => (field || '').toLowerCase().includes(q)),
    )
  }, [institutions, query])

  return (
    <div className="page-shell flex min-h-dvh flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-10 sm:px-6">
        <header className="mb-7">
          <p className="section-label mb-2">Explorer</p>
          <h1 className="font-serif text-3xl font-semibold text-gray-900 dark:text-gray-100">
            Institutions
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-gray-500 dark:text-gray-400">
            Explorez les travaux par établissement et découvrez la production
            scientifique de chaque université.
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
            placeholder="Rechercher une institution, un acronyme, une ville…"
            aria-label="Rechercher une institution"
            className="input-base pl-10"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner size={28} />
          </div>
        ) : institutions.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 bg-white py-16 text-center text-sm text-gray-500 dark:border-navy-700 dark:bg-navy-800 dark:text-gray-400">
            Aucune institution disponible pour le moment.
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 bg-white py-16 text-center text-sm text-gray-500 dark:border-navy-700 dark:bg-navy-800 dark:text-gray-400">
            Aucune institution ne correspond à «&nbsp;{query}&nbsp;».
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((i, idx) => (
              <InstitutionCard key={i.id} institution={i} count={counts[i.id] || 0} index={idx} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
