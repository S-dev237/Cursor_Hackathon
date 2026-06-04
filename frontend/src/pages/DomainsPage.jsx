import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/layout/Navbar.jsx'
import Spinner from '../components/ui/Spinner.jsx'
import { getDomains } from '../api/documents.js'

export default function DomainsPage() {
  const [domains, setDomains] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')

  useEffect(() => {
    let active = true
    getDomains().then(({ data }) => {
      if (!active) return
      setDomains(data || [])
      setLoading(false)
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
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
        <header className="mb-6">
          <h1 className="font-serif text-2xl font-semibold text-gray-900 dark:text-gray-100">
            Domaines de recherche
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Parcourez les travaux par discipline académique.
          </p>
        </header>

        <div className="relative mb-6 max-w-md">
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
            className="w-full rounded-lg border border-gray-border bg-white py-2.5 pl-10 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30 dark:border-navy-700 dark:bg-navy-800 dark:text-gray-100 dark:placeholder:text-gray-500"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner size={28} />
          </div>
        ) : domains.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-border bg-white py-16 text-center text-sm text-gray-muted dark:border-navy-700 dark:bg-navy-800 dark:text-gray-400">
            Aucun domaine disponible pour le moment.
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-border bg-white py-16 text-center text-sm text-gray-muted dark:border-navy-700 dark:bg-navy-800 dark:text-gray-400">
            Aucun domaine ne correspond à «&nbsp;{query}&nbsp;».
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {filtered.map((d) => (
              <Link
                key={d.id}
                to={`/search?domain_id=${encodeURIComponent(d.id)}`}
                className="card-doc group flex items-center justify-between p-4"
              >
                <span className="font-serif text-[15px] font-medium text-gray-900 group-hover:text-teal-dark dark:text-gray-100 dark:group-hover:text-teal-300">
                  {d.name}
                </span>
                <span className="text-gray-400 transition-transform group-hover:translate-x-0.5 group-hover:text-teal dark:text-gray-500 dark:group-hover:text-teal-400">
                  →
                </span>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
