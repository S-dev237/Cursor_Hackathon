import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/layout/Navbar.jsx'
import TypeBadge from '../components/ui/TypeBadge.jsx'
import AiBadge from '../components/ui/AiBadge.jsx'
import Spinner from '../components/ui/Spinner.jsx'
import { getMyDocuments } from '../api/documents.js'

const STATUS = {
  pending: { label: 'En attente', cls: 'border-amber bg-amber-light text-amber-dark' },
  approved: { label: 'Approuvé', cls: 'border-teal-mid bg-teal-light text-teal-dark' },
  rejected: { label: 'Rejeté', cls: 'border-[#F09595] bg-[#FCEBEB] text-[#791F1F]' },
}

function StatusBadge({ status }) {
  const s = STATUS[status] || STATUS.pending
  return (
    <span className={`inline-flex items-center rounded border px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wider ${s.cls}`}>
      {s.label}
    </span>
  )
}

export default function MySubmissionsPage() {
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    getMyDocuments().then(({ data }) => {
      if (!active) return
      setDocs(data || [])
      setLoading(false)
    })
    return () => {
      active = false
    }
  }, [])

  return (
    <div className="flex min-h-dvh flex-col bg-gray-bg">
      <Navbar />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="font-serif text-2xl font-semibold text-gray-text">
            Mes soumissions
          </h1>
          <Link to="/submit" className="btn-primary px-3 py-2 text-xs">
            Nouvelle soumission
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner size={28} />
          </div>
        ) : docs.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-border bg-white py-16 text-center">
            <p className="font-serif text-lg font-semibold text-gray-text">
              Aucune soumission pour le moment
            </p>
            <p className="mx-auto mt-2 max-w-sm text-sm text-gray-muted">
              Déposez votre premier travail pour le partager avec la communauté.
            </p>
            <Link to="/submit" className="btn-primary mt-5">
              Soumettre un travail
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {docs.map((doc) => (
              <li
                key={doc.id}
                className="flex items-center gap-4 rounded-lg border border-gray-border bg-white p-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="mb-1.5 flex flex-wrap items-center gap-2">
                    <StatusBadge status={doc.status} />
                    <TypeBadge type={doc.doc_type} />
                    {doc.ai_extracted && <AiBadge confidence={doc.ai_confidence} />}
                  </div>
                  <p className="font-serif text-[15px] font-semibold text-gray-text line-clamp-2">
                    {doc.title}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-muted">
                    {doc.publication_year} · {doc.domain_name || '—'}
                  </p>
                  {doc.status === 'rejected' && doc.rejection_reason && (
                    <p className="mt-2 rounded bg-[#FCEBEB] px-2 py-1 text-xs text-[#791F1F]">
                      Motif : {doc.rejection_reason}
                    </p>
                  )}
                </div>
                {doc.status === 'approved' && (
                  <Link
                    to={`/documents/${doc.id}`}
                    className="shrink-0 text-sm font-medium text-teal hover:text-teal-dark"
                  >
                    Consulter →
                  </Link>
                )}
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  )
}
