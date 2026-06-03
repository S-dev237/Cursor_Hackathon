import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/layout/Navbar.jsx'
import Spinner from '../components/ui/Spinner.jsx'
import { getInstitutions } from '../api/documents.js'

export default function InstitutionsPage() {
  const [institutions, setInstitutions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    getInstitutions().then(({ data }) => {
      if (!active) return
      setInstitutions(data || [])
      setLoading(false)
    })
    return () => {
      active = false
    }
  }, [])

  return (
    <div className="flex min-h-dvh flex-col bg-gray-bg">
      <Navbar />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
        <header className="mb-6">
          <h1 className="font-serif text-2xl font-semibold text-gray-text">
            Institutions
          </h1>
          <p className="mt-1 text-sm text-gray-muted">
            Explorez les travaux par établissement.
          </p>
        </header>

        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner size={28} />
          </div>
        ) : institutions.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-border bg-white py-16 text-center text-sm text-gray-muted">
            Aucune institution disponible pour le moment.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {institutions.map((i) => (
              <Link
                key={i.id}
                to={`/search?institution_id=${encodeURIComponent(i.id)}`}
                className="card-doc group flex items-center gap-3 p-4"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-navy font-mono text-xs font-semibold text-white">
                  {i.acronym || (i.name || '?').slice(0, 2).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-serif text-[15px] font-medium text-gray-text group-hover:text-teal-dark">
                    {i.name}
                  </span>
                  {i.city && (
                    <span className="block text-xs text-gray-muted">{i.city}</span>
                  )}
                </span>
                <span className="text-gray-muted transition-transform group-hover:translate-x-0.5 group-hover:text-teal">
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
