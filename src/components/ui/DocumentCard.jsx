import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import clsx from 'clsx'
import TypeBadge from './TypeBadge.jsx'
import AiBadge from './AiBadge.jsx'

const TYPE_BORDER = {
  thesis: 'border-l-[#534AB7]',
  memoir: 'border-l-[#185FA5]',
  article: 'border-l-teal-500',
  report: 'border-l-amber',
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5" aria-hidden="true">
      <path
        d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

function DownloadIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5" aria-hidden="true">
      <path
        d="M12 3v12m0 0l-4-4m4 4l4-4M4 19h16"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function DocumentCard({ document, detailed = false, index = 0 }) {
  const {
    id,
    title,
    abstract,
    doc_type,
    authors = [],
    keywords = [],
    publication_year,
    institution_name,
    view_count = 0,
    download_count = 0,
    ai_extracted,
    ai_confidence,
  } = document

  const borderClass = TYPE_BORDER[doc_type] || TYPE_BORDER.report

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay: Math.min(index * 0.05, 0.3),
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      <Link
        to={`/documents/${id}`}
        className={clsx(
          'group relative flex flex-col overflow-hidden rounded-xl border border-gray-200/60 bg-white p-5 shadow-card transition-all duration-200 ease-premium hover:-translate-y-0.5 hover:border-gray-400 hover:shadow-card-hover',
          'border-l-[3px]',
          borderClass,
        )}
      >
        <div className="mb-3 flex items-center gap-2">
          <TypeBadge type={doc_type} />
          {ai_extracted && <AiBadge confidence={ai_confidence} />}
          {publication_year && (
            <span className="ml-auto font-mono text-[11px] text-gray-500">
              {publication_year}
            </span>
          )}
        </div>

        <h3 className="mb-2 font-serif text-[15px] font-semibold leading-snug text-gray-900 line-clamp-2 transition-colors duration-200 group-hover:text-teal-600">
          {title}
        </h3>

        <p className="mb-3 text-[12px] text-gray-500">
          {authors[0] || 'Auteur inconnu'}
          {authors.length > 1 && ` +${authors.length - 1}`}
          {institution_name && (
            <>
              <span className="mx-1.5 text-gray-400">·</span>
              {institution_name}
            </>
          )}
        </p>

        {detailed && abstract && (
          <p className="mb-3 text-[13px] leading-relaxed text-gray-700/80 line-clamp-2">
            {abstract}
          </p>
        )}

        {keywords.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-1.5">
            {keywords.slice(0, 3).map((kw) => (
              <span
                key={kw}
                className="rounded-full bg-gray-50 px-2.5 py-0.5 text-[11px] text-gray-500"
              >
                {kw}
              </span>
            ))}
          </div>
        )}

        <div className="mt-auto flex items-center justify-between border-t border-gray-200/60 pt-3">
          <div className="flex items-center gap-3 font-mono text-[11px] text-gray-400">
            <span className="inline-flex items-center gap-1">
              <EyeIcon />
              {view_count}
            </span>
            <span className="inline-flex items-center gap-1">
              <DownloadIcon />
              {download_count}
            </span>
          </div>
          <span className="text-xs font-medium text-teal-500 opacity-0 translate-y-1 transition-all duration-200 ease-premium group-hover:opacity-100 group-hover:translate-y-0">
            Consulter →
          </span>
        </div>
      </Link>
    </motion.div>
  )
}
