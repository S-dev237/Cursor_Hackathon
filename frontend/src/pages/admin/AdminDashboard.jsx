import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import clsx from 'clsx'
import Navbar from '../../components/layout/Navbar.jsx'
import TypeBadge from '../../components/ui/TypeBadge.jsx'
import AnimatedCounter from '../../components/ui/AnimatedCounter.jsx'
import Spinner from '../../components/ui/Spinner.jsx'
import { useToast } from '../../components/ui/Toast.jsx'
import {
  getAllDocuments,
  getDomains,
  getInstitutions,
  getStats,
  getUsers,
  publishDocument,
  setUserActive,
  setUserRole,
  withdrawDocument,
} from '../../api/documents.js'
import { STATUS, STATUS_OPTIONS } from '../../constants/colors.js'

const SECTIONS = [
  { id: 'overview', label: 'Vue d’ensemble' },
  { id: 'documents', label: 'Documents' },
  { id: 'users', label: 'Utilisateurs' },
  { id: 'domains', label: 'Domaines' },
  { id: 'institutions', label: 'Institutions' },
]

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

function MetricCard({ label, value, tone = 'navy' }) {
  const styles = {
    amber: 'border-amber/30 bg-amber-light text-amber-dark dark:border-amber/40 dark:bg-amber/15 dark:text-amber-light',
    teal: 'border-teal-mid bg-teal-light text-teal-dark dark:border-teal-500/40 dark:bg-teal-500/15 dark:text-teal-300',
    navy: 'border-gray-border bg-white text-gray-text dark:border-navy-700 dark:bg-navy-800 dark:text-gray-100',
  }
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className={clsx('rounded-xl border p-4 shadow-card', styles[tone])}
    >
      <div className="font-serif text-2xl font-semibold tabular-nums">
        {typeof value === 'number' ? <AnimatedCounter value={value} duration={1.1} /> : value}
      </div>
      <div className="section-label mt-1 opacity-70">{label}</div>
    </motion.div>
  )
}

function OverviewSection({ stats, loading }) {
  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size={28} />
      </div>
    )
  }
  return (
    <div>
      <h2 className="mb-5 font-serif text-2xl font-semibold text-gray-text dark:text-gray-100">
        Vue d’ensemble
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricCard label="Documents publiés" value={stats?.total_documents ?? 0} tone="teal" />
        <MetricCard label="Brouillons" value={stats?.total_drafts ?? 0} tone="amber" />
        <MetricCard label="Utilisateurs" value={stats?.total_users ?? 0} />
        <MetricCard label="Téléchargements" value={stats?.total_downloads ?? 0} />
      </div>
      <p className="mt-6 text-sm text-gray-muted">
        Données de démonstration (mode mock). Les actions de gestion sont
        appliquées en mémoire pour la session courante.
      </p>
    </div>
  )
}

function DocumentsSection({ toast }) {
  const [docs, setDocs] = useState([])
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)

  const load = useCallback(
    (st = status) => {
      setLoading(true)
      getAllDocuments(st ? { status: st } : {}).then(({ data }) => {
        setDocs(data?.documents || [])
        setLoading(false)
      })
    },
    [status],
  )

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load(status)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

  const act = async (doc, action, msg) => {
    setBusyId(doc.id)
    const { error } = await action(doc.id)
    setBusyId(null)
    if (error) {
      toast(error, 'error')
      return
    }
    load(status)
    toast(msg)
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-serif text-2xl font-semibold text-gray-text dark:text-gray-100">
          Documents
        </h2>
        <label className="flex items-center gap-2 text-sm text-gray-muted">
          Statut
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-lg border border-gray-border bg-white py-2 pl-3 pr-8 text-sm text-gray-text focus:border-teal-400 focus:ring-1 focus:ring-teal-500/20 dark:border-navy-700 dark:bg-navy-800 dark:text-gray-100"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size={28} />
        </div>
      ) : docs.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-border bg-white py-12 text-center text-sm text-gray-muted dark:border-navy-700 dark:bg-navy-800">
          Aucun document pour ce filtre.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-border bg-white shadow-card dark:border-navy-700 dark:bg-navy-800">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-gray-border text-gray-muted dark:border-navy-700">
                <th scope="col" className="px-4 py-3 font-medium">Titre</th>
                <th scope="col" className="px-4 py-3 font-medium">Type</th>
                <th scope="col" className="px-4 py-3 font-medium">Statut</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {docs.map((doc) => {
                const busy = busyId === doc.id
                return (
                  <tr
                    key={doc.id}
                    className="border-b border-gray-100 last:border-0 dark:border-navy-700/60"
                  >
                    <td className="px-4 py-3">
                      <Link
                        to={`/documents/${doc.id}`}
                        className="font-medium text-gray-text hover:text-teal dark:text-gray-100"
                      >
                        {doc.title}
                      </Link>
                      <span className="mt-0.5 block text-xs text-gray-muted">
                        {doc.publication_year} · {doc.institution_name || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <TypeBadge type={doc.doc_type} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={doc.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        {doc.status === 'published' ? (
                          <button
                            type="button"
                            onClick={() => act(doc, withdrawDocument, 'Document retiré')}
                            disabled={busy}
                            className="inline-flex items-center rounded-lg border border-gray-border bg-white px-3 py-1.5 text-xs font-medium text-gray-text transition-colors duration-200 hover:border-red-300 hover:text-red-700 disabled:opacity-50 dark:bg-navy-800 dark:text-gray-100"
                          >
                            {busy ? '…' : 'Retirer'}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => act(doc, publishDocument, 'Document publié')}
                            disabled={busy}
                            className="btn-primary px-3 py-1.5 text-xs disabled:opacity-50"
                          >
                            {busy ? '…' : 'Publier'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function UsersSection({ toast }) {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)

  useEffect(() => {
    let active = true
    getUsers().then(({ data }) => {
      if (!active) return
      setUsers(data?.users || [])
      setLoading(false)
    })
    return () => {
      active = false
    }
  }, [])

  const apply = (id, updated) =>
    setUsers((list) => list.map((u) => (u.id === id ? { ...u, ...updated } : u)))

  const toggleRole = async (user) => {
    const nextRole = user.role === 'admin' ? 'student' : 'admin'
    setBusyId(user.id)
    const { error } = await setUserRole(user.id, nextRole)
    setBusyId(null)
    if (error) return toast(error, 'error')
    apply(user.id, { role: nextRole })
    toast(`Rôle mis à jour : ${nextRole === 'admin' ? 'admin' : 'étudiant'}`)
  }

  const toggleActive = async (user) => {
    const next = !user.is_active
    setBusyId(user.id)
    const { error } = await setUserActive(user.id, next)
    setBusyId(null)
    if (error) return toast(error, 'error')
    apply(user.id, { is_active: next })
    toast(next ? 'Compte activé' : 'Compte désactivé')
  }

  return (
    <div>
      <h2 className="mb-5 font-serif text-2xl font-semibold text-gray-text dark:text-gray-100">
        Utilisateurs
      </h2>
      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size={28} />
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-border bg-white shadow-card dark:border-navy-700 dark:bg-navy-800">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead>
              <tr className="border-b border-gray-border text-gray-muted dark:border-navy-700">
                <th scope="col" className="px-4 py-3 font-medium">Utilisateur</th>
                <th scope="col" className="px-4 py-3 font-medium">Rôle</th>
                <th scope="col" className="px-4 py-3 font-medium">Statut</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const busy = busyId === user.id
                return (
                  <tr
                    key={user.id}
                    className="border-b border-gray-100 last:border-0 dark:border-navy-700/60"
                  >
                    <td className="px-4 py-3">
                      <span className="font-medium text-gray-text dark:text-gray-100">
                        {user.full_name}
                      </span>
                      <span className="mt-0.5 block font-mono text-xs text-gray-muted">
                        {user.email}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={clsx(
                          'inline-flex items-center rounded border px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wider',
                          user.role === 'admin'
                            ? 'border-[#F09595] bg-[#FCEBEB] text-[#791F1F] dark:border-red-500/40 dark:bg-red-500/15 dark:text-red-300'
                            : 'border-teal-mid bg-teal-light text-teal-dark dark:border-teal-500/40 dark:bg-teal-500/15 dark:text-teal-300',
                        )}
                      >
                        {user.role === 'admin' ? 'Admin' : 'Étudiant'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={clsx(
                          'inline-flex items-center gap-1.5 text-xs',
                          user.is_active ? 'text-teal-dark dark:text-teal-300' : 'text-gray-muted',
                        )}
                      >
                        <span
                          className={clsx(
                            'h-2 w-2 rounded-full',
                            user.is_active ? 'bg-teal' : 'bg-gray-muted',
                          )}
                          aria-hidden="true"
                        />
                        {user.is_active ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => toggleRole(user)}
                          disabled={busy}
                          className="btn-ghost px-3 py-1.5 text-xs disabled:opacity-50"
                        >
                          {user.role === 'admin' ? 'Passer étudiant' : 'Passer admin'}
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleActive(user)}
                          disabled={busy}
                          className="inline-flex items-center rounded-lg border border-gray-border bg-white px-3 py-1.5 text-xs font-medium text-gray-text transition-colors duration-200 hover:border-teal-300 disabled:opacity-50 dark:bg-navy-800 dark:text-gray-100"
                        >
                          {user.is_active ? 'Désactiver' : 'Activer'}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function RefListSection({ title, items, renderMeta }) {
  return (
    <div>
      <h2 className="mb-5 font-serif text-2xl font-semibold text-gray-text dark:text-gray-100">
        {title}
      </h2>
      <ul className="grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <li
            key={item.id}
            className="rounded-xl border border-gray-border bg-white p-4 shadow-card dark:border-navy-700 dark:bg-navy-800"
          >
            <p className="font-medium text-gray-text dark:text-gray-100">{item.name}</p>
            <p className="mt-0.5 text-xs text-gray-muted">{renderMeta(item)}</p>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-xs text-gray-muted">Liste en lecture seule (référentiel).</p>
    </div>
  )
}

export default function AdminDashboard() {
  const { toast } = useToast()
  const [section, setSection] = useState('overview')
  const [stats, setStats] = useState(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const [domains, setDomains] = useState([])
  const [institutions, setInstitutions] = useState([])

  useEffect(() => {
    getStats().then(({ data }) => {
      setStats(data)
      setStatsLoading(false)
    })
    getDomains().then(({ data }) => data && setDomains(data))
    getInstitutions().then(({ data }) => data && setInstitutions(data))
  }, [])

  const content = useMemo(() => {
    switch (section) {
      case 'documents':
        return <DocumentsSection toast={toast} />
      case 'users':
        return <UsersSection toast={toast} />
      case 'domains':
        return (
          <RefListSection
            title="Domaines"
            items={domains}
            renderMeta={(d) => `slug : ${d.slug}`}
          />
        )
      case 'institutions':
        return (
          <RefListSection
            title="Institutions"
            items={institutions}
            renderMeta={(i) =>
              [i.acronym, i.city].filter(Boolean).join(' · ') || '—'
            }
          />
        )
      default:
        return <OverviewSection stats={stats} loading={statsLoading} />
    }
  }, [section, toast, domains, institutions, stats, statsLoading])

  return (
    <div className="page-shell flex min-h-dvh flex-col">
      <Navbar />
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 lg:flex-row lg:gap-10">
        <aside className="w-full lg:w-56 lg:shrink-0">
          <h1 className="mb-4 px-3 font-serif text-lg font-semibold text-gray-text dark:text-gray-100">
            Administration
          </h1>
          <nav className="flex gap-1 overflow-x-auto lg:flex-col" aria-label="Sections d’administration">
            {SECTIONS.map((s) => {
              const active = s.id === section
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSection(s.id)}
                  aria-current={active ? 'page' : undefined}
                  className={clsx(
                    'whitespace-nowrap rounded-lg px-3 py-2.5 text-left text-sm transition-all duration-200',
                    active
                      ? 'bg-white font-medium text-gray-text shadow-card dark:bg-navy-800 dark:text-gray-100'
                      : 'text-gray-muted hover:bg-white/60 hover:text-gray-text dark:hover:bg-navy-800/60 dark:hover:text-gray-100',
                  )}
                >
                  {s.label}
                </button>
              )
            })}
          </nav>
        </aside>

        <section className="min-w-0 flex-1">{content}</section>
      </main>
    </div>
  )
}
