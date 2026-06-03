import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/layout/Navbar.jsx'
import Spinner from '../components/ui/Spinner.jsx'
import { getDomains } from '../api/documents.js'

export default function DomainsPage() {
  const [domains, setDomains] = useState([])
  const [loading, setLoading] = useState(true)

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

  return (
    <div className="flex min-h-dvh flex-col bg-gray-bg">
      <Navbar />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
        <header className="mb-6">
          <h1 className="font-serif text-2xl font-semibold text-gray-text">
            Domaines de recherche
          </h1>
          <p className="mt-1 text-sm text-gray-muted">
            Parcourez les travaux par discipline académique.
          </p>
        </header>

        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner size={28} />
          </div>
        ) : domains.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-border bg-white py-16 text-center text-sm text-gray-muted">
            Aucun domaine disponible pour le moment.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {domains.map((d) => (
              <Link
                key={d.id}
                to={`/search?domain_id=${encodeURIComponent(d.id)}`}
                className="card-doc group flex items-center justify-between p-4"
              >
                <span className="font-serif text-[15px] font-medium text-gray-text group-hover:text-teal-dark">
                  {d.name}
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
