import { useMemo, useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import clsx from 'clsx'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString()

const ZOOM_LEVELS = [0.75, 1, 1.25]

function ToolbarButton({ onClick, disabled, label, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="flex h-8 w-8 items-center justify-center rounded-lg text-white/70 transition-all duration-200 hover:bg-white/10 hover:text-white active:scale-95 disabled:cursor-not-allowed disabled:opacity-30"
    >
      {children}
    </button>
  )
}

function PdfSkeleton() {
  return (
    <div className="flex h-[620px] w-full max-w-[560px] flex-col items-center justify-center gap-4 rounded-lg bg-white/[0.03] p-8">
      <div className="w-full max-w-xs space-y-3">
        <div className="skeleton h-3 w-3/4 !bg-white/10" />
        <div className="skeleton h-3 w-full !bg-white/10" />
        <div className="skeleton h-3 w-5/6 !bg-white/10" />
        <div className="skeleton mt-6 h-40 w-full !bg-white/[0.06]" />
        <div className="skeleton h-3 w-2/3 !bg-white/10" />
        <div className="skeleton h-3 w-full !bg-white/10" />
      </div>
      <span className="font-mono text-[11px] text-white/40">Chargement du document…</span>
    </div>
  )
}

export default function PdfViewer({ fileUrl, httpHeaders, onDownload }) {
  const [numPages, setNumPages] = useState(null)
  const [page, setPage] = useState(1)
  const [zoomIdx, setZoomIdx] = useState(1)
  const [error, setError] = useState(false)

  const scale = ZOOM_LEVELS[zoomIdx]

  // Mémoïsé : react-pdf compare le prop `file` en profondeur et recharge le
  // document à chaque nouvel objet. On stabilise la référence sur l'URL + headers.
  const headersKey = httpHeaders ? JSON.stringify(httpHeaders) : ''
  const file = useMemo(
    () => (fileUrl ? { url: fileUrl, httpHeaders, withCredentials: false } : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fileUrl, headersKey],
  )

  return (
    <div className="pdf-chrome flex flex-col overflow-hidden rounded-xl border border-white/[0.06] shadow-navy">
      {/* Toolbar dark */}
      <div className="pdf-toolbar flex flex-wrap items-center justify-between gap-2 px-3 py-2.5">
        <div className="flex items-center gap-1">
          <ToolbarButton
            label="Page précédente"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
              <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </ToolbarButton>
          <span className="min-w-[88px] rounded-md bg-white/[0.06] px-2 py-1 text-center font-mono text-xs text-white/60">
            {numPages ? `${page} / ${numPages}` : '—'}
          </span>
          <ToolbarButton
            label="Page suivante"
            onClick={() => setPage((p) => Math.min(numPages || p, p + 1))}
            disabled={!numPages || page >= numPages}
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
              <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </ToolbarButton>
        </div>

        <div className="flex items-center gap-1">
          <ToolbarButton
            label="Dézoomer"
            onClick={() => setZoomIdx((z) => Math.max(0, z - 1))}
            disabled={zoomIdx <= 0}
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
              <path d="M5 12h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </ToolbarButton>
          <span className="min-w-[48px] text-center font-mono text-xs text-white/60">
            {Math.round(scale * 100)}%
          </span>
          <ToolbarButton
            label="Zoomer"
            onClick={() => setZoomIdx((z) => Math.min(ZOOM_LEVELS.length - 1, z + 1))}
            disabled={zoomIdx >= ZOOM_LEVELS.length - 1}
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </ToolbarButton>
          <button
            type="button"
            onClick={onDownload}
            className="ml-2 inline-flex items-center gap-1.5 rounded-lg bg-teal-500 px-3 py-1.5 text-xs font-medium text-white transition-all duration-200 hover:bg-teal-400 hover:shadow-teal active:scale-[0.98]"
          >
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none">
              <path d="M12 3v12m0 0l-4-4m4 4l4-4M4 19h16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Télécharger
          </button>
        </div>
      </div>

      {/* Zone PDF */}
      <div className="flex min-h-[620px] justify-center overflow-auto bg-[#1C1C1A] p-5">
        {error || !file ? (
          <div className="flex h-[620px] flex-col items-center justify-center gap-3 text-center text-white/50">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/[0.04]">
              <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none">
                <path d="M7 3h7l5 5v13H7z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
                <path d="M14 3v5h5" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="text-sm text-white/60">Aperçu du document indisponible</p>
            {onDownload && (
              <button
                type="button"
                onClick={onDownload}
                className="text-sm text-teal-400 transition-colors duration-200 hover:text-teal-300"
              >
                Télécharger le PDF →
              </button>
            )}
          </div>
        ) : (
          <Document
            file={file}
            loading={<PdfSkeleton />}
            error={<PdfSkeleton />}
            onLoadSuccess={({ numPages: n }) => {
              setNumPages(n)
              setError(false)
            }}
            onLoadError={() => setError(true)}
          >
            <Page
              pageNumber={page}
              scale={scale}
              renderTextLayer
              renderAnnotationLayer
              loading={<PdfSkeleton />}
              className={clsx('rounded-sm shadow-card-hover ring-1 ring-white/10')}
            />
          </Document>
        )}
      </div>
    </div>
  )
}
