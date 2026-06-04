import { useEffect, useState } from 'react'
import clsx from 'clsx'
import { getCitation } from '../../api/documents.js'
import { useToast } from './Toast.jsx'

const FORMATS = [
  { value: 'bibtex', label: 'BibTeX' },
  { value: 'apa', label: 'APA' },
  { value: 'mla', label: 'MLA' },
]

export default function CitationBox({ documentId }) {
  const { toast } = useToast()
  const [format, setFormat] = useState('bibtex')
  const [cache, setCache] = useState({})
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (cache[format] !== undefined) return
    let active = true
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    getCitation(documentId, format).then(({ data, error }) => {
      if (!active) return
      setCache((prev) => ({
        ...prev,
        [format]: error ? '' : data?.citation || '',
      }))
      setLoading(false)
    })
    return () => {
      active = false
    }
  }, [format, documentId, cache])

  const citation = cache[format]

  const copy = async () => {
    if (!citation) return
    try {
      await navigator.clipboard.writeText(citation)
      setCopied(true)
      toast('Citation copiée')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast('Impossible de copier', 'error')
    }
  }

  return (
    <div>
      <div className="mb-3 flex gap-1 rounded-lg bg-gray-50 p-1 dark:bg-navy-900">
        {FORMATS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFormat(f.value)}
            className={clsx(
              'flex-1 rounded-md px-2.5 py-1.5 text-xs font-medium transition-all duration-200',
              format === f.value
                ? 'bg-navy-900 text-white shadow-sm dark:bg-navy-700'
                : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="rounded-lg border border-gray-200 bg-gray-50 p-3.5 dark:border-navy-700 dark:bg-navy-900">
        {loading ? (
          <div className="space-y-2">
            <div className="skeleton h-3 w-full" />
            <div className="skeleton h-3 w-5/6" />
            <div className="skeleton h-3 w-4/5" />
          </div>
        ) : citation ? (
          <pre className="max-h-36 overflow-y-auto whitespace-pre-wrap break-words font-mono text-[11px] leading-relaxed text-gray-900 dark:text-gray-100">
            {citation}
          </pre>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">Citation indisponible.</p>
        )}
      </div>

      <button
        type="button"
        onClick={copy}
        disabled={!citation || loading}
        className={clsx(
          'mt-3 flex w-full items-center justify-center gap-2 rounded-lg border py-2.5 text-xs font-medium transition-all duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50',
          copied
            ? 'border-teal-300 bg-teal-50 text-teal-700 dark:border-teal-500/40 dark:bg-teal-500/15 dark:text-teal-300'
            : 'border-gray-200 bg-white text-gray-700 hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700 dark:border-navy-700 dark:bg-navy-800 dark:text-gray-200 dark:hover:border-teal-500/40 dark:hover:bg-teal-500/10 dark:hover:text-teal-300',
        )}
      >
        {copied ? (
          <>
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none">
              <path d="M3.5 8.5l3 3 6-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Copié !
          </>
        ) : (
          'Copier la citation'
        )}
      </button>
    </div>
  )
}
