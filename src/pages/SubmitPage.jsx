import { useEffect, useReducer, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import clsx from 'clsx'
import Navbar from '../components/layout/Navbar.jsx'
import TagsInput from '../components/ui/TagsInput.jsx'
import { useToast } from '../components/ui/Toast.jsx'
import {
  getDomains,
  getInstitutions,
  submitDocument,
  updateDocument,
} from '../api/documents.js'
import { extractMetadata } from '../api/ai.js'
import { DOC_TYPES, DOC_TYPE_LABELS, STORAGE_KEYS } from '../constants/colors.js'

const STEPS = [
  'Informations générales',
  'Auteurs & domaine',
  'Document & IA',
  'Confirmation',
]

const YEARS = Array.from({ length: 2026 - 2010 + 1 }, (_, i) => 2026 - i)
const MAX_FILE_MB = 20

const initialState = {
  title: '',
  doc_type: 'thesis',
  publication_year: new Date().getFullYear(),
  institution_id: '',
  domain_id: '',
  authors: [],
  keywords: [],
  abstract: '',
  ai_extracted: false,
  ai_confidence: 0,
}

function reducer(state, action) {
  switch (action.type) {
    case 'SET':
      return { ...state, [action.key]: action.value }
    case 'MERGE':
      return { ...state, ...action.payload }
    case 'HYDRATE':
      return { ...state, ...action.payload }
    default:
      return state
  }
}

function IaTag() {
  return <span className="badge-ai ml-1.5 !px-1.5 !py-0">IA</span>
}

function Field({ label, required, ai, children, hint }) {
  return (
    <label className="mb-5 block">
      <span className="mb-2 flex items-center text-sm font-medium text-gray-900">
        {label}
        {required && <span className="ml-0.5 text-red-700">*</span>}
        {ai && <IaTag />}
      </span>
      {children}
      {hint && <span className="mt-1.5 block text-xs text-gray-500">{hint}</span>}
    </label>
  )
}

function Stepper({ current, savedAt }) {
  return (
    <aside className="w-full lg:w-64 lg:shrink-0">
      <ol className="relative space-y-0">
        {STEPS.map((label, i) => {
          const stepNum = i + 1
          const done = stepNum < current
          const active = stepNum === current
          const isLast = i === STEPS.length - 1

          return (
            <li key={label} className="relative flex gap-3 pb-6 last:pb-0">
              {/* Connecteur vertical animé */}
              {!isLast && (
                <div
                  className="absolute left-[15px] top-8 h-[calc(100%-12px)] w-0.5 overflow-hidden bg-gray-200"
                  aria-hidden="true"
                >
                  <motion.div
                    className="h-full w-full origin-top bg-teal-500"
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: done ? 1 : 0 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  />
                </div>
              )}

              {/* Cercle étape */}
              <div className="relative shrink-0">
                {active && (
                  <span className="absolute inset-0 animate-pulse-ring rounded-full bg-teal-500/30" />
                )}
                <span
                  className={clsx(
                    'relative flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-all duration-200',
                    done && 'bg-teal-500 text-white shadow-teal',
                    active && 'border-2 border-teal-500 bg-white text-teal-600',
                    !done && !active && 'border border-gray-200 bg-white text-gray-400',
                  )}
                >
                  {done ? (
                    <motion.svg
                      viewBox="0 0 16 16"
                      className="h-4 w-4"
                      fill="none"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 28 }}
                    >
                      <path d="M3.5 8.5l3 3 6-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </motion.svg>
                  ) : (
                    stepNum
                  )}
                </span>
              </div>

              <div
                className={clsx(
                  'min-w-0 flex-1 rounded-xl px-3 py-2 transition-all duration-200',
                  active && 'bg-white shadow-card',
                )}
              >
                <span
                  className={clsx(
                    'block text-sm leading-snug',
                    active ? 'font-medium text-gray-900' : done ? 'text-gray-700' : 'text-gray-400',
                  )}
                >
                  {label}
                </span>
              </div>
            </li>
          )
        })}
      </ol>

      {savedAt && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 rounded-xl border border-teal-200/60 bg-teal-50/50 px-4 py-3 text-xs text-teal-800"
        >
          <span className="font-medium">Brouillon sauvegardé</span>
          <span className="mt-0.5 block font-mono text-[10px] text-teal-600">{savedAt}</span>
        </motion.div>
      )}
    </aside>
  )
}

const stepVariants = {
  enter: { opacity: 0, x: 16 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -16 },
}

const aiFieldVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.35, ease: [0.16, 1, 0.3, 1] },
  }),
}

export default function SubmitPage() {
  const navigate = useNavigate()
  const { toast } = useToast()

  const [form, dispatch] = useReducer(reducer, initialState)
  const [step, setStep] = useState(1)
  const [file, setFile] = useState(null)
  const [fileError, setFileError] = useState(null)
  const [aiFields, setAiFields] = useState(new Set())
  const [extracting, setExtracting] = useState(false)
  const [extractStatus, setExtractStatus] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [savedAt, setSavedAt] = useState(null)

  const [domains, setDomains] = useState([])
  const [institutions, setInstitutions] = useState([])
  const tempDocId = useRef(null)

  const set = (key, value) => dispatch({ type: 'SET', key, value })

  useEffect(() => {
    getDomains().then(({ data }) => data && setDomains(data))
    getInstitutions().then(({ data }) => data && setInstitutions(data))
    const raw = localStorage.getItem(STORAGE_KEYS.draft)
    if (raw) {
      try {
        dispatch({ type: 'HYDRATE', payload: JSON.parse(raw) })
      } catch {
        /* ignore */
      }
    }
  }, [])

  const saveDraft = useCallback(() => {
    localStorage.setItem(STORAGE_KEYS.draft, JSON.stringify(form))
    setSavedAt(new Date().toLocaleTimeString('fr-FR'))
  }, [form])

  useEffect(() => {
    const interval = setInterval(saveDraft, 30000)
    return () => clearInterval(interval)
  }, [saveDraft])

  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        saveDraft()
        toast('Brouillon sauvegardé')
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [saveDraft, toast])

  const stepValid = () => {
    if (step === 1)
      return (
        form.title.trim() &&
        form.doc_type &&
        form.publication_year &&
        form.institution_id
      )
    if (step === 2) return form.authors.length >= 1 && form.domain_id
    if (step === 3) return !!file
    return true
  }

  const handleFile = (selected) => {
    setFileError(null)
    if (!selected) return
    if (!selected.name.toLowerCase().endsWith('.pdf')) {
      setFileError('Seuls les fichiers PDF sont acceptés.')
      return
    }
    if (selected.size > MAX_FILE_MB * 1024 * 1024) {
      setFileError(`Le fichier dépasse ${MAX_FILE_MB} Mo.`)
      return
    }
    setFile(selected)
  }

  const runExtraction = async () => {
    if (!file) return
    setExtracting(true)
    setExtractStatus(null)

    const { data: created, error: upErr } = await submitDocument(file, {})
    if (upErr || !created?.id) {
      setExtractStatus('partial')
      setExtracting(false)
      return
    }
    tempDocId.current = created.id

    const { data, error } = await extractMetadata(created.id)
    setExtracting(false)

    if (error || !data) {
      setExtractStatus('partial')
      return
    }

    const filled = new Set()
    const payload = {}
    if (data.title) { payload.title = data.title; filled.add('title') }
    if (data.abstract) { payload.abstract = data.abstract; filled.add('abstract') }
    if (data.keywords?.length) { payload.keywords = data.keywords; filled.add('keywords') }
    if (data.authors?.length) { payload.authors = data.authors; filled.add('authors') }
    if (data.domain_suggestion) {
      const match = domains.find(
        (d) => d.name.toLowerCase() === data.domain_suggestion.toLowerCase(),
      )
      if (match) { payload.domain_id = String(match.id); filled.add('domain_id') }
    }
    payload.ai_extracted = true
    payload.ai_confidence = data.confidence || 0

    dispatch({ type: 'MERGE', payload })
    setAiFields(filled)
    setExtractStatus('success')
  }

  const aiClass = (key) =>
    aiFields.has(key) ? 'input-ai border-teal-300 bg-teal-50/30 glow-ai' : 'input-base'

  const handleSubmit = async () => {
    setSubmitting(true)
    const metadata = {
      title: form.title,
      doc_type: form.doc_type,
      publication_year: Number(form.publication_year),
      institution_id: form.institution_id,
      domain_id: form.domain_id,
      authors: form.authors,
      keywords: form.keywords,
      abstract: form.abstract,
      ai_extracted: form.ai_extracted,
      ai_confidence: form.ai_confidence,
    }

    const { error } = tempDocId.current
      ? await updateDocument(tempDocId.current, metadata)
      : await submitDocument(file, metadata)

    setSubmitting(false)
    if (error) {
      toast(error, 'error')
      return
    }
    localStorage.removeItem(STORAGE_KEYS.draft)
    toast('Soumission envoyée — en attente de validation')
    navigate('/my-submissions')
  }

  const progress = (step / STEPS.length) * 100

  return (
    <div className="flex min-h-dvh flex-col bg-gray-100">
      <Navbar />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 lg:flex-row lg:gap-10">
        <Stepper current={step} savedAt={savedAt} />

        <section className="min-w-0 flex-1">
          {/* Barre de progression */}
          <div className="mb-6">
            <div className="mb-2.5 flex items-center justify-between">
              <span className="font-serif text-lg font-semibold text-gray-900">
                {STEPS[step - 1]}
              </span>
              <span className="font-mono text-[11px] uppercase tracking-wider text-gray-400">
                Étape {step} / {STEPS.length}
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
              <motion.div
                className="h-full rounded-full bg-teal-500"
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
          </div>

          <div className="rounded-xl border border-gray-200/60 bg-white p-6 shadow-card sm:p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              >
                {step === 1 && (
                  <>
                    <Field label="Titre du travail" required>
                      <input
                        type="text"
                        value={form.title}
                        onChange={(e) => set('title', e.target.value)}
                        className="input-base"
                        placeholder="Titre complet du document"
                      />
                    </Field>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Type de travail" required>
                        <select
                          value={form.doc_type}
                          onChange={(e) => set('doc_type', e.target.value)}
                          className="input-base"
                        >
                          {DOC_TYPES.map((t) => (
                            <option key={t} value={t}>
                              {DOC_TYPE_LABELS[t]}
                            </option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Année de publication" required>
                        <select
                          value={form.publication_year}
                          onChange={(e) => set('publication_year', e.target.value)}
                          className="input-base"
                        >
                          {YEARS.map((y) => (
                            <option key={y} value={y}>
                              {y}
                            </option>
                          ))}
                        </select>
                      </Field>
                    </div>
                    <Field label="Institution" required>
                      <select
                        value={form.institution_id}
                        onChange={(e) => set('institution_id', e.target.value)}
                        className="input-base"
                      >
                        <option value="">Sélectionner une institution…</option>
                        {institutions.map((i) => (
                          <option key={i.id} value={String(i.id)}>
                            {i.name}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </>
                )}

                {step === 2 && (
                  <>
                    <Field label="Auteurs" required hint="Entrée ou virgule pour ajouter">
                      <TagsInput
                        tags={form.authors}
                        onChange={(t) => set('authors', t)}
                        placeholder="Nom de l'auteur…"
                      />
                    </Field>
                    <Field label="Domaine" required>
                      <select
                        value={form.domain_id}
                        onChange={(e) => set('domain_id', e.target.value)}
                        className="input-base"
                      >
                        <option value="">Sélectionner un domaine…</option>
                        {domains.map((d) => (
                          <option key={d.id} value={String(d.id)}>
                            {d.name}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Mots-clés" hint="10 mots-clés maximum">
                      <TagsInput
                        tags={form.keywords}
                        onChange={(t) => set('keywords', t)}
                        max={10}
                        placeholder="Mot-clé…"
                      />
                    </Field>
                  </>
                )}

                {step === 3 && (
                  <>
                    <FileDropzone
                      file={file}
                      error={fileError}
                      onFile={handleFile}
                      onRemove={() => {
                        setFile(null)
                        tempDocId.current = null
                        setExtractStatus(null)
                      }}
                    />

                    {file && (
                      <button
                        type="button"
                        onClick={runExtraction}
                        disabled={extracting}
                        className="group mt-5 flex w-full items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-navy-900 to-navy-800 px-4 py-3.5 text-sm font-medium text-white transition-all duration-200 hover:ring-1 hover:ring-teal-400/40 disabled:opacity-60 active:scale-[0.98]"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          className={clsx(
                            'h-4 w-4 text-teal-300',
                            extracting && 'animate-spin',
                          )}
                          fill="currentColor"
                        >
                          <path d="M12 2l1.6 5.6L19 9.2l-5.4 1.6L12 16l-1.6-5.2L5 9.2l5.4-1.6L12 2z" />
                        </svg>
                        {extracting ? 'Extraction en cours…' : 'Extraire les métadonnées avec l\u2019IA'}
                      </button>
                    )}

                    {extractStatus === 'success' && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-4 flex items-center gap-2 rounded-xl border border-teal-300/50 bg-teal-50 px-4 py-3 text-sm text-teal-800 glow-ai"
                      >
                        <svg viewBox="0 0 16 16" className="h-4 w-4 shrink-0" fill="none">
                          <path d="M3.5 8.5l3 3 6-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Extraction réussie — confiance{' '}
                        {Math.round((form.ai_confidence || 0) * 100)}%
                      </motion.div>
                    )}
                    {extractStatus === 'partial' && (
                      <div className="mt-4 rounded-xl border border-amber/30 bg-amber-light px-4 py-3 text-sm text-amber-dark">
                        Extraction partielle — remplissez les champs manuellement.
                      </div>
                    )}

                    <div className="mt-8 border-t border-gray-200/80 pt-8">
                      {extractStatus === 'success' ? (
                        <motion.div
                          initial="hidden"
                          animate="visible"
                          variants={{
                            hidden: {},
                            visible: { transition: { staggerChildren: 0.1 } },
                          }}
                        >
                          <motion.div variants={aiFieldVariants} custom={0}>
                            <Field label="Titre" ai={aiFields.has('title')}>
                              <input
                                type="text"
                                value={form.title}
                                onChange={(e) => set('title', e.target.value)}
                                className={aiClass('title')}
                              />
                            </Field>
                          </motion.div>
                          <motion.div variants={aiFieldVariants} custom={1}>
                            <Field label="Mots-clés" ai={aiFields.has('keywords')}>
                              <TagsInput
                                tags={form.keywords}
                                onChange={(t) => set('keywords', t)}
                                max={10}
                                highlighted={aiFields.has('keywords')}
                              />
                            </Field>
                          </motion.div>
                          <motion.div variants={aiFieldVariants} custom={2}>
                            <Field label="Résumé" ai={aiFields.has('abstract')}>
                              <textarea
                                rows={5}
                                value={form.abstract}
                                onChange={(e) => set('abstract', e.target.value)}
                                className={clsx('resize-none', aiClass('abstract'))}
                                placeholder="Résumé du document…"
                              />
                            </Field>
                          </motion.div>
                        </motion.div>
                      ) : (
                        <>
                          <Field label="Titre" ai={aiFields.has('title')}>
                            <input
                              type="text"
                              value={form.title}
                              onChange={(e) => set('title', e.target.value)}
                              className={aiClass('title')}
                            />
                          </Field>
                          <Field label="Mots-clés" ai={aiFields.has('keywords')}>
                            <TagsInput
                              tags={form.keywords}
                              onChange={(t) => set('keywords', t)}
                              max={10}
                              highlighted={aiFields.has('keywords')}
                            />
                          </Field>
                          <Field label="Résumé" ai={aiFields.has('abstract')}>
                            <textarea
                              rows={5}
                              value={form.abstract}
                              onChange={(e) => set('abstract', e.target.value)}
                              className={clsx('resize-none', aiClass('abstract'))}
                              placeholder="Résumé du document…"
                            />
                          </Field>
                        </>
                      )}
                    </div>
                  </>
                )}

                {step === 4 && (
                  <Recap form={form} file={file} domains={domains} institutions={institutions} />
                )}
              </motion.div>
            </AnimatePresence>

            <div className="mt-8 flex items-center justify-between border-t border-gray-200/80 pt-6">
              <button
                type="button"
                onClick={() => setStep((s) => Math.max(1, s - 1))}
                disabled={step === 1}
                className="btn-ghost disabled:opacity-40"
              >
                Précédent
              </button>

              {step < STEPS.length ? (
                <button
                  type="button"
                  onClick={() => stepValid() && setStep((s) => s + 1)}
                  disabled={!stepValid()}
                  className="btn-primary disabled:opacity-50"
                >
                  Suivant
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="btn-primary min-w-[120px]"
                >
                  {submitting ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Envoi…
                    </span>
                  ) : (
                    'Soumettre'
                  )}
                </button>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

function FileDropzone({ file, error, onFile, onRemove }) {
  const [dragging, setDragging] = useState(false)
  const [hovering, setHovering] = useState(false)
  const inputRef = useRef(null)

  if (file) {
    const sizeMo = (file.size / 1024 / 1024).toFixed(1)
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center gap-4 rounded-xl border border-teal-300/50 bg-teal-50/50 p-4 glow-ai"
      >
        <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-white text-teal-600 shadow-sm">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
            <path d="M7 3h7l5 5v13H7z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
            <path d="M14 3v5h5" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
          </svg>
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-gray-900">{file.name}</p>
          <p className="mt-0.5 font-mono text-[11px] text-gray-500">
            {sizeMo} Mo
            <span className="ml-2 rounded-full bg-teal-100 px-2 py-0.5 text-teal-700">
              PDF
            </span>
          </p>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="rounded-lg px-2 py-1 text-sm text-red-700 transition-colors duration-200 hover:bg-red-50"
        >
          Retirer
        </button>
      </motion.div>
    )
  }

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          onFile(e.dataTransfer.files?.[0])
        }}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        className={clsx(
          'dropzone group flex cursor-pointer flex-col items-center justify-center p-12 text-center',
          dragging && 'dropzone-active',
        )}
      >
        <motion.svg
          viewBox="0 0 24 24"
          className="mb-4 h-10 w-10 text-gray-400 transition-colors duration-200 group-hover:text-teal-500"
          fill="none"
          animate={{ y: hovering || dragging ? -4 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <path d="M12 16V4m0 0L8 8m4-4l4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </motion.svg>
        <p className="text-sm font-medium text-gray-900">
          Glissez votre PDF ici ou cliquez pour parcourir
        </p>
        <p className="mt-1.5 text-xs text-gray-500">
          PDF uniquement · {MAX_FILE_MB} Mo maximum
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          className="hidden"
          onChange={(e) => onFile(e.target.files?.[0])}
        />
      </div>
      {error && (
        <p role="alert" className="mt-2 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-4 border-b border-gray-100 py-3 text-sm last:border-0">
      <span className="shrink-0 text-gray-500">{label}</span>
      <span className="text-right font-medium text-gray-900">{value || '—'}</span>
    </div>
  )
}

function Recap({ form, file, domains, institutions }) {
  const domainName = domains.find((d) => String(d.id) === form.domain_id)?.name
  const instName = institutions.find(
    (i) => String(i.id) === form.institution_id,
  )?.name

  return (
    <div>
      <h3 className="mb-1 font-serif text-xl font-semibold text-gray-900">
        Vérifiez votre soumission
      </h3>
      <p className="mb-6 text-sm text-gray-500">
        Une fois soumis, votre travail sera examiné par un administrateur.
      </p>
      <div className="overflow-hidden rounded-xl border border-gray-200/60 bg-gray-50/50">
        <div className="px-5">
          <Row label="Titre" value={form.title} />
          <Row label="Type" value={DOC_TYPE_LABELS[form.doc_type]} />
          <Row label="Année" value={form.publication_year} />
          <Row label="Institution" value={instName} />
          <Row label="Domaine" value={domainName} />
          <Row label="Auteurs" value={form.authors.join(', ')} />
          <Row label="Mots-clés" value={form.keywords.join(', ')} />
          <Row label="Fichier" value={file?.name} />
          {form.ai_extracted && (
            <Row
              label="Extraction IA"
              value={`${Math.round((form.ai_confidence || 0) * 100)}% confiance`}
            />
          )}
        </div>
      </div>
      {form.abstract && (
        <div className="mt-5">
          <p className="section-label mb-2">Résumé</p>
          <p className="rounded-lg border border-gray-200 bg-white p-4 text-sm leading-relaxed text-gray-700">
            {form.abstract}
          </p>
        </div>
      )}
    </div>
  )
}
