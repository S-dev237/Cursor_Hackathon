import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import clsx from 'clsx'
import Navbar from '../../components/layout/Navbar.jsx'
import TypeBadge from '../../components/ui/TypeBadge.jsx'
import AiBadge from '../../components/ui/AiBadge.jsx'
import AnimatedCounter from '../../components/ui/AnimatedCounter.jsx'
import Pagination from '../../components/ui/Pagination.jsx'
import SkeletonCard from '../../components/ui/SkeletonCard.jsx'
import { useToast } from '../../components/ui/Toast.jsx'
import { getAdminQueue, getStats, reviewDocument } from '../../api/documents.js'

const PER_PAGE = 5

const NAV_ITEMS = [
  'Dashboard',
  'File d\u2019attente',
  'Approuvés',
  'Rejetés',
  'Utilisateurs',
  'Domaines',
  'Institutions',
]

function MetricCard({ label, value, tone, animate = true }) {
  const styles = {
    amber: 'border-amber/30 bg-amber-light text-amber-dark',
    teal: 'border-teal-300/40 bg-teal-50 text-teal-800',
    red: 'border-red-200 bg-red-50 text-red-800',
    navy: 'border-gray-200/60 bg-white text-gray-900',
  }

  const isNumber = typeof value === 'number'

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className={clsx('rounded-xl border p-4 shadow-card', styles[tone] || styles.navy)}
    >
      <div className="font-serif text-2xl font-semibold tabular-nums">
        {isNumber && animate ? (
          <AnimatedCounter value={value} duration={1.2} />
        ) : (
          value
        )}
      </div>
      <div className="section-label mt-1 opacity-70">{label}</div>
    </motion.div>
  )
}

function daysSince(iso) {
  if (!iso) return 0
  const diff = Date.now() - new Date(iso).getTime()
  return Math.max(0, Math.floor(diff / 86400000))
}

function SubmissionCard({ doc, onApprove, onReject, busy }) {
  const [rejecting, setRejecting] = useState(false)
  const [reason, setReason] = useState('')
  const scanned = !doc.ai_extracted

  return (
    <article
      className={clsx(
        'rounded-xl border border-gray-200/60 bg-white p-5 shadow-card transition-all duration-200 hover:bg-gray-50/80',
        'border-l-[3px]',
        scanned ? 'border-l-amber' : 'border-l-transparent',
      )}
    >
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center rounded-full border border-amber/30 bg-amber-light px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-amber-dark">
          En attente
        </span>
        <TypeBadge type={doc.doc_type} />
        {doc.ai_extracted && <AiBadge confidence={doc.ai_confidence} />}
        <span className="ml-auto font-mono text-[11px] text-gray-400">
          il y a {daysSince(doc.created_at)} j
        </span>
      </div>

      <h3 className="font-serif text-base font-semibold leading-snug text-gray-900">
        {doc.title}
      </h3>
      <p className="mt-1.5 text-xs text-gray-500">
        {(doc.authors || [])[0] || '—'}
        {doc.institution_name && ` · ${doc.institution_name}`}
        {doc.publication_year && ` · ${doc.publication_year}`}
        {doc.file_size_kb && ` · ${(doc.file_size_kb / 1024).toFixed(1)} Mo`}
      </p>

      {doc.abstract && (
        <p className="mt-2.5 text-sm leading-relaxed text-gray-600 line-clamp-2">
          {doc.abstract}
        </p>
      )}

      {scanned && (
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-amber/30 bg-amber-light px-3 py-2.5 text-xs text-amber-dark">
          <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none">
            <path d="M12 9v4m0 4h.01M10.3 3.9l-8 14A2 2 0 004 21h16a2 2 0 001.7-3.1l-8-14a2 2 0 00-3.4 0z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          PDF scanné détecté — métadonnées non extraites par l&apos;IA
        </div>
      )}

      {rejecting && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-3 overflow-hidden"
        >
          <textarea
            rows={2}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Motif du rejet (communiqué à l'auteur)…"
            className="input-base resize-none"
            autoFocus
          />
        </motion.div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {!rejecting ? (
          <>
            <button
              type="button"
              onClick={() => onApprove(doc)}
              disabled={busy}
              className="inline-flex items-center justify-center rounded-lg border border-teal-200 bg-teal-50 px-3.5 py-2 text-xs font-medium text-teal-700 transition-all duration-200 hover:border-teal-500 hover:bg-teal-500 hover:text-white active:scale-[0.98] disabled:opacity-50"
            >
              Approuver
            </button>
            <button
              type="button"
              onClick={() => setRejecting(true)}
              disabled={busy}
              className="inline-flex items-center justify-center rounded-lg border border-red-200 bg-red-50 px-3.5 py-2 text-xs font-medium text-red-700 transition-all duration-200 hover:border-red-500 hover:bg-red-500 hover:text-white active:scale-[0.98] disabled:opacity-50"
            >
              Rejeter
            </button>
            <Link
              to={`/documents/${doc.id}`}
              target="_blank"
              rel="noopener"
              className="btn-ghost ml-auto px-3 py-2 text-xs"
            >
              Voir le PDF
            </Link>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => onReject(doc, reason)}
              disabled={busy || !reason.trim()}
              className="inline-flex items-center justify-center rounded-lg border border-red-200 bg-red-50 px-3.5 py-2 text-xs font-medium text-red-700 transition-all duration-200 hover:bg-red-500 hover:text-white disabled:opacity-50"
            >
              Confirmer le rejet
            </button>
            <button
              type="button"
              onClick={() => {
                setRejecting(false)
                setReason('')
              }}
              className="btn-ghost px-3 py-2 text-xs"
            >
              Annuler
            </button>
          </>
        )}
      </div>
    </article>
  )
}

export default function AdminQueue() {
  const { toast } = useToast()
  const [queue, setQueue] = useState([])
  const [loading, setLoading] = useState(true)
  const [sort, setSort] = useState('asc')
  const [page, setPage] = useState(1)
  const [busyId, setBusyId] = useState(null)
  const [counters, setCounters] = useState({ approved: 0, rejected: 0 })

  useEffect(() => {
    let active = true
    Promise.all([getAdminQueue({ per_page: 100 }), getStats()]).then(
      ([queueRes, statsRes]) => {
        if (!active) return
        setQueue(queueRes.data?.documents || [])
        setCounters({
          approved: statsRes.data?.total_documents || 0,
          rejected: 0,
        })
        setLoading(false)
      },
    )
    return () => {
      active = false
    }
  }, [])

  const sorted = useMemo(() => {
    const copy = [...queue]
    copy.sort((a, b) => {
      const da = new Date(a.created_at || 0).getTime()
      const db = new Date(b.created_at || 0).getTime()
      return sort === 'asc' ? da - db : db - da
    })
    return copy
  }, [queue, sort])

  const pending = queue.length
  const oldestDays = pending
    ? Math.max(...queue.map((d) => daysSince(d.created_at)))
    : 0
  const total = counters.approved + counters.rejected + pending
  const rate = total ? Math.round((counters.approved / total) * 100) : 0

  const paged = sorted.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  const act = async (doc, status, rejection_reason) => {
    setBusyId(doc.id)
    const prev = queue
    setQueue((q) => q.filter((d) => d.id !== doc.id))

    const { error } = await reviewDocument(doc.id, {
      status,
      ...(rejection_reason ? { rejection_reason } : {}),
    })
    setBusyId(null)

    if (error) {
      setQueue(prev)
      toast(error, 'error')
      return
    }
    setCounters((c) => ({
      ...c,
      [status === 'approved' ? 'approved' : 'rejected']:
        c[status === 'approved' ? 'approved' : 'rejected'] + 1,
    }))
    toast(status === 'approved' ? 'Soumission approuvée' : 'Soumission rejetée')
  }

  return (
    <div className="flex min-h-dvh flex-col bg-gray-100">
      <Navbar />
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 lg:flex-row lg:gap-10">
        {/* Sidebar admin */}
        <aside className="w-full lg:w-52 lg:shrink-0">
          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const active = item === 'File d\u2019attente'
              return (
                <div
                  key={item}
                  className={clsx(
                    'flex items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-all duration-200',
                    active
                      ? 'bg-white font-medium text-gray-900 shadow-card'
                      : 'text-gray-500 hover:bg-white/60 hover:text-gray-900',
                  )}
                >
                  {item}
                  {active && pending > 0 && (
                    <span className="rounded-full bg-red-100 px-2 py-0.5 font-mono text-[10px] font-semibold text-red-700">
                      {pending}
                    </span>
                  )}
                </div>
              )
            })}
          </nav>

          {pending > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-5 rounded-xl border border-amber/30 bg-amber-light px-4 py-3 text-xs text-amber-dark"
            >
              <span className="font-medium">{pending} en attente</span>
              <span className="mt-1 block opacity-80">
                La plus ancienne date de {oldestDays} jour{oldestDays > 1 ? 's' : ''}
              </span>
            </motion.div>
          )}
        </aside>

        {/* Contenu */}
        <section className="min-w-0 flex-1">
          <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <MetricCard label="En attente" value={pending} tone="amber" />
            <MetricCard label="Approuvés" value={counters.approved} tone="teal" />
            <MetricCard label="Rejetés" value={counters.rejected} tone="red" />
            <MetricCard label="Taux validation" value={`${rate}%`} tone="navy" animate={false} />
          </div>

          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <h1 className="font-serif text-2xl font-semibold text-gray-900">
              {loading ? (
                'Chargement…'
              ) : (
                <>
                  {pending} soumission{pending > 1 ? 's' : ''} en attente
                </>
              )}
            </h1>
            <label className="flex items-center gap-2 text-sm text-gray-500">
              Trier par
              <select
                value={sort}
                onChange={(e) => {
                  setSort(e.target.value)
                  setPage(1)
                }}
                className="rounded-lg border border-gray-200 bg-white py-2 pl-3 pr-8 text-sm text-gray-900 transition-all duration-200 focus:border-teal-400 focus:shadow-teal focus:ring-1 focus:ring-teal-500/20"
              >
                <option value="asc">Plus ancienne</option>
                <option value="desc">Plus récente</option>
              </select>
            </label>
          </div>

          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <SkeletonCard key={i} detailed />
              ))}
            </div>
          ) : pending === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 bg-white px-6 py-16 text-center">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-xl bg-teal-50">
                <svg viewBox="0 0 24 24" className="h-8 w-8 text-teal-600" fill="none">
                  <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="font-serif text-xl font-semibold text-gray-900">
                Aucune soumission en attente
              </p>
              <p className="mx-auto mt-2 max-w-sm text-sm text-gray-500">
                La file est vide. Tout est à jour — bon travail !
              </p>
              <Link to="/search" className="btn-ghost mt-6 inline-flex">
                Voir les documents approuvés →
              </Link>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                  {paged.map((doc) => (
                    <motion.div
                      key={doc.id}
                      layout
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{
                        opacity: 0,
                        height: 0,
                        marginBottom: 0,
                        overflow: 'hidden',
                      }}
                      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <SubmissionCard
                        doc={doc}
                        busy={busyId === doc.id}
                        onApprove={(d) => act(d, 'approved')}
                        onReject={(d, reason) => act(d, 'rejected', reason)}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              <div className="mt-10">
                <Pagination
                  page={page}
                  total={pending}
                  perPage={PER_PAGE}
                  onChange={setPage}
                />
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  )
}
