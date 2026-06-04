import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/layout/Navbar.jsx'
import TypeBadge from '../components/ui/TypeBadge.jsx'
import AiBadge from '../components/ui/AiBadge.jsx'
import Spinner from '../components/ui/Spinner.jsx'
import { useToast } from '../components/ui/Toast.jsx'
import {
  getMyDocuments,
  publishDocument,
  withdrawDocument,
} from '../api/documents.js'
import { STATUS } from '../constants/colors.js'

function StatusBadge({ status }) {
  const s = STATUS[status] || STATUS.draft
  return (
    <span
      className={`inline-flex items-center rounded border px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wider ${s.cls}`}
    >
      {s.label}
    </span>
  )
}

export default function MySubmissionsPage() {
  const { toast } = useToast()
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)

  const load = () =>
    getMyDocuments().then(({ data }) => {
      setDocs(data || [])
      setLoading(false)
    })

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

  const runAction = async (doc, action, successMsg) => {
    setBusyId(doc.id)
    const { error } = await action(doc.id)
    setBusyId(null)
    if (error) {
      toast(error, 'error')
      return
    }
    await load()
    toast(successMsg)
  }

  return (
    <div className="page-shell flex min-h-dvh flex-col">
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
          <div className="rounded-lg border border-dashed border-gray-border bg-white py-16 text-center dark:border-navy-700 dark:bg-navy-800">
            <p className="font-serif text-lg font-semibold text-gray-text dark:text-gray-100">
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
            {docs.map((doc) => {
              const busy = busyId === doc.id
              return (
                <li
                  key={doc.id}
                  className="flex flex-col gap-4 rounded-lg border border-gray-border bg-white p-4 dark:border-navy-700 dark:bg-navy-800 sm:flex-row sm:items-center"
                >
                  <div className="min-w-0 flex-1">
                    <div className="mb-1.5 flex flex-wrap items-center gap-2">
                      <StatusBadge status={doc.status} />
                      <TypeBadge type={doc.doc_type} />
                      {doc.ai_extracted && <AiBadge confidence={doc.ai_confidence} />}
                    </div>
                    <p className="font-serif text-[15px] font-semibold text-gray-text line-clamp-2 dark:text-gray-100">
                      {doc.title}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-muted">
                      {doc.publication_year} · {doc.domain_name || '—'}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <Link
                      to={`/submit?id=${doc.id}`}
                      className="btn-ghost px-3 py-2 text-xs"
                    >
                      Modifier
                    </Link>

                    {doc.status === 'draft' && (
                      <button
                        type="button"
                        onClick={() =>
                          runAction(doc, publishDocument, 'Document publié')
                        }
                        disabled={busy}
                        className="btn-primary px-3 py-2 text-xs disabled:opacity-50"
                      >
                        {busy ? 'Publication…' : 'Publier'}
                      </button>
                    )}

                    {doc.status === 'published' && (
                      <>
                        <Link
                          to={`/documents/${doc.id}`}
                          className="text-sm font-medium text-teal hover:text-teal-dark"
                        >
                          Consulter →
                        </Link>
                        <button
                          type="button"
                          onClick={() =>
                            runAction(doc, withdrawDocument, 'Document retiré')
                          }
                          disabled={busy}
                          className="inline-flex items-center justify-center rounded-lg border border-gray-border bg-white px-3 py-2 text-xs font-medium text-gray-text transition-colors duration-200 hover:border-red-300 hover:text-red-700 disabled:opacity-50 dark:bg-navy-800 dark:text-gray-100"
                        >
                          {busy ? 'Retrait…' : 'Retirer'}
                        </button>
                      </>
                    )}

                    {doc.status === 'withdrawn' && (
                      <button
                        type="button"
                        onClick={() =>
                          runAction(doc, publishDocument, 'Document republié')
                        }
                        disabled={busy}
                        className="btn-primary px-3 py-2 text-xs disabled:opacity-50"
                      >
                        {busy ? 'Republication…' : 'Republier'}
                      </button>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </main>
    </div>
  )
}
