import { useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import clsx from 'clsx'
import Seo from '../components/Seo.jsx'
import Navbar from '../components/layout/Navbar.jsx'
import TypeBadge from '../components/ui/TypeBadge.jsx'
import AiBadge from '../components/ui/AiBadge.jsx'
import PdfViewer from '../components/ui/PdfViewer.jsx'
import CitationBox from '../components/ui/CitationBox.jsx'
import SkeletonCard from '../components/ui/SkeletonCard.jsx'
import { useToast } from '../components/ui/Toast.jsx'
import {
  getDocument,
  registerView,
  getDownloadUrl,
  searchDocuments,
} from '../api/documents.js'
import { STORAGE_KEYS } from '../constants/colors.js'

function MetaRow({ label, children }) {
  return (
    <div className="flex justify-between gap-4 py-2 text-sm">
      <span className="shrink-0 text-gray-500">{label}</span>
      <span className="text-right font-medium text-gray-900">{children}</span>
    </div>
  )
}

function Divider() {
  return <hr className="my-5 border-gray-200/80" />
}

function SectionLabel({ children }) {
  return <h2 className="section-label mb-3">{children}</h2>
}

function DocumentSkeleton() {
  return (
    <div className="flex min-h-dvh flex-col bg-gray-100">
      <Navbar />
      <div className="border-b border-gray-200/60 bg-white px-4 py-3 sm:px-6">
        <div className="skeleton mx-auto h-4 max-w-md w-full" />
      </div>
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:flex-row">
        <div className="min-w-0 flex-1">
          <div className="pdf-chrome overflow-hidden rounded-xl">
            <div className="pdf-toolbar h-12" />
            <div className="flex h-[620px] items-center justify-center bg-[#1C1C1A]">
              <div className="skeleton h-64 w-48 !bg-white/10" />
            </div>
          </div>
        </div>
        <aside className="w-full lg:w-80">
          <SkeletonCard detailed />
        </aside>
      </main>
    </div>
  )
}

function truncate(str = '', n = 40) {
  return str.length > n ? `${str.slice(0, n)}…` : str
}

export default function DocumentPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [doc, setDoc] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [similar, setSimilar] = useState([])

  useEffect(() => {
    let active = true
    /* eslint-disable react-hooks/set-state-in-effect */
    setLoading(true)
    setNotFound(false)
    /* eslint-enable react-hooks/set-state-in-effect */
    getDocument(id).then(({ data }) => {
      if (!active) return
      if (data) {
        setDoc(data)
      } else {
        setNotFound(true)
      }
      setLoading(false)
    })
    registerView(id)
    return () => {
      active = false
    }
  }, [id])

  useEffect(() => {
    if (!doc?.domain_id) return
    searchDocuments({
      domain_id: doc.domain_id,
      per_page: 4,
      exclude_id: doc.id,
    }).then(({ data }) => {
      const list = (data?.documents || [])
        .filter((d) => String(d.id) !== String(doc.id))
        .slice(0, 3)
      setSimilar(list)
    })
  }, [doc])

  const handleDownload = () => {
    window.open(getDownloadUrl(id), '_blank', 'noopener')
  }

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      toast('Lien copié dans le presse-papiers')
    } catch {
      toast('Impossible de copier le lien', 'error')
    }
  }

  if (loading) return <DocumentSkeleton />

  if (notFound || !doc) {
    return (
      <div className="flex min-h-dvh flex-col bg-gray-100">
        <Navbar />
        <div className="mx-auto max-w-md px-4 py-24 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-xl bg-white shadow-card">
            <svg viewBox="0 0 48 48" fill="none" className="h-8 w-8 text-gray-400">
              <path d="M14 10h14l8 8v22H14z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
              <path d="M28 10v8h8" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
              <path d="M20 28h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <h1 className="font-serif text-2xl font-semibold text-gray-900">
            Document introuvable
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Ce document n&apos;existe pas ou n&apos;est plus disponible.
          </p>
          <Link to="/search" className="btn-primary mt-6 inline-flex">
            Retour à la recherche
          </Link>
        </div>
      </div>
    )
  }

  const token = localStorage.getItem(STORAGE_KEYS.token)
  const httpHeaders = token ? { Authorization: `Bearer ${token}` } : undefined
  const sizeMo = doc.file_size_kb
    ? (doc.file_size_kb / 1024).toFixed(1)
    : null

  return (
    <div className="flex min-h-dvh flex-col bg-gray-100">
      <Seo
        title={doc.title}
        description={
          doc.abstract
            ? doc.abstract.slice(0, 160)
            : `${doc.title} — document académique sur OpenScience Hub.`
        }
        type="article"
      />
      <Navbar />

      {/* Breadcrumb */}
      <div className="border-b border-gray-200/60 bg-white">
        <nav className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-3 text-sm sm:px-6">
          <Link
            to="/"
            className="text-gray-500 transition-colors duration-200 hover:text-gray-900"
          >
            OSHub
          </Link>
          <span className="text-gray-300">/</span>
          <button
            type="button"
            onClick={() =>
              window.history.length > 1 ? navigate(-1) : navigate('/search')
            }
            className="text-gray-500 transition-colors duration-200 hover:text-gray-900"
          >
            Recherche
          </button>
          <span className="text-gray-300">/</span>
          <span className="truncate font-medium text-gray-900">{truncate(doc.title)}</span>
        </nav>
      </div>

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:flex-row lg:items-start lg:gap-8 lg:py-8">
        {/* PDF viewer */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="min-w-0 flex-1"
        >
          <PdfViewer
            fileUrl={getDownloadUrl(id)}
            httpHeaders={httpHeaders}
            onDownload={handleDownload}
          />
        </motion.div>

        {/* Panneau métadonnées — scroll indépendant */}
        <motion.aside
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
          className="w-full lg:sticky lg:top-16 lg:w-80 lg:shrink-0 lg:max-h-[calc(100dvh-5rem)] lg:overflow-y-auto"
        >
          <div className="rounded-xl border border-gray-200/60 bg-white p-5 shadow-card">
            <div
              className={clsx(
                'mb-4 flex flex-wrap items-center gap-2',
                doc.ai_extracted && 'rounded-lg p-2 -m-2 mb-2 glow-ai bg-teal-50/30',
              )}
            >
              <TypeBadge type={doc.doc_type} />
              {doc.ai_extracted && <AiBadge confidence={doc.ai_confidence} />}
            </div>

            <h1 className="font-serif text-xl font-semibold leading-snug text-gray-900">
              {doc.title}
            </h1>

            {doc.abstract && (
              <p className="mt-3 text-sm leading-relaxed text-gray-500 line-clamp-4">
                {doc.abstract}
              </p>
            )}

            <Divider />

            <div className="divide-y divide-gray-100">
              <MetaRow label="Auteurs">
                {(doc.authors || []).join(', ') || '—'}
              </MetaRow>
              <MetaRow label="Institution">
                {doc.institution_name || '—'}
              </MetaRow>
              <MetaRow label="Année">{doc.publication_year || '—'}</MetaRow>
              <MetaRow label="Domaine">{doc.domain_name || '—'}</MetaRow>
              <MetaRow label="Volume">
                {doc.page_count ? `${doc.page_count} p.` : '—'}
                {sizeMo ? ` · ${sizeMo} Mo` : ''}
              </MetaRow>
            </div>

            <div className="mt-4 flex items-center gap-4 border-t border-gray-200/80 pt-4 font-mono text-[11px] text-gray-400">
              <span className="inline-flex items-center gap-1">
                <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5">
                  <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" stroke="currentColor" strokeWidth="1.5" />
                  <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.5" />
                </svg>
                {doc.view_count ?? 0} vues
              </span>
              <span className="inline-flex items-center gap-1">
                <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5">
                  <path d="M12 3v12m0 0l-4-4m4 4l4-4M4 19h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {doc.download_count ?? 0} dl.
              </span>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={handleDownload}
                className="btn-primary flex-1 py-2.5 text-xs"
              >
                Télécharger
              </button>
              <button
                type="button"
                onClick={handleShare}
                className="btn-ghost px-3 py-2.5 text-xs"
                aria-label="Partager"
              >
                Partager
              </button>
            </div>

            {doc.keywords?.length > 0 && (
              <>
                <Divider />
                <SectionLabel>Mots-clés</SectionLabel>
                <div className="flex flex-wrap gap-1.5">
                  {doc.keywords.map((kw) => (
                    <span
                      key={kw}
                      className="rounded-full bg-gray-50 px-2.5 py-0.5 text-[11px] text-gray-500"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              </>
            )}

            <Divider />
            <SectionLabel>Exporter la citation</SectionLabel>
            <CitationBox documentId={doc.id} />

            {similar.length > 0 && (
              <>
                <Divider />
                <SectionLabel>Travaux similaires</SectionLabel>
                <div className="space-y-2">
                  {similar.map((s) => (
                    <Link
                      key={s.id}
                      to={`/documents/${s.id}`}
                      className="group block rounded-lg border border-gray-200/60 bg-gray-50/50 p-3 transition-all duration-200 hover:border-teal-300/50 hover:bg-teal-50/30"
                    >
                      <p className="font-serif text-[13px] font-semibold leading-snug text-gray-900 line-clamp-2 transition-colors duration-200 group-hover:text-teal-600 group-hover:underline decoration-teal-400/60 underline-offset-2">
                        {s.title}
                      </p>
                      <p className="mt-1 text-[11px] text-gray-500">
                        {(s.authors || [])[0] || '—'}
                        {s.publication_year ? ` · ${s.publication_year}` : ''}
                      </p>
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>
        </motion.aside>
      </main>
    </div>
  )
}
