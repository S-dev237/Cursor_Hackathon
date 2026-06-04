import { useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useAssistant } from '../../hooks/useAssistant.js'
import ChatMessage from './ChatMessage.jsx'
import ChatComposer from './ChatComposer.jsx'
import SuggestedPrompts from './SuggestedPrompts.jsx'

function SparkIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3z"
        fill="currentColor"
      />
      <path
        d="M18 14l.8 2.2L21 17l-2.2.8L18 20l-.8-2.2L15 17l2.2-.8L18 14z"
        fill="currentColor"
        opacity="0.7"
      />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function ResetIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
      <path
        d="M4 4v5h5M19.5 13a7.5 7.5 0 11-2.2-5.3L20 9"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function AssistantWidget() {
  const {
    isOpen,
    toggle,
    close,
    messages,
    send,
    isStreaming,
    stop,
    reset,
    isConfigured,
  } = useAssistant()

  const scrollRef = useRef(null)

  // Auto-scroll vers le bas à chaque nouveau token / ouverture
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, isOpen])

  // Échap pour fermer
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e) => {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, close])

  const isEmpty = messages.length === 0

  return (
    <>
      {/* Bouton lanceur flottant */}
      <button
        type="button"
        onClick={toggle}
        aria-label={isOpen ? 'Fermer OpenScience AI' : 'Ouvrir OpenScience AI'}
        aria-expanded={isOpen}
        className="fixed bottom-5 right-5 z-[60] flex h-14 w-14 items-center justify-center rounded-full text-white shadow-navy transition-transform duration-200 ease-premium hover:scale-105 active:scale-95 gradient-teal-avatar"
      >
        {!isOpen && (
          <span className="absolute inset-0 animate-pulse-ring rounded-full bg-teal-400/40" aria-hidden="true" />
        )}
        <span className="relative">
          {isOpen ? <CloseIcon /> : <SparkIcon className="h-6 w-6" />}
        </span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="osai-panel"
            role="dialog"
            aria-label="OpenScience AI"
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-[70] flex flex-col overflow-hidden bg-white dark:bg-navy-900 sm:inset-auto sm:bottom-24 sm:right-5 sm:h-[600px] sm:max-h-[calc(100dvh-7rem)] sm:w-[400px] sm:rounded-2xl sm:border sm:border-gray-200/70 sm:shadow-card-hover dark:sm:border-navy-700"
          >
            {/* En-tête */}
            <header className="flex shrink-0 items-center gap-3 border-b border-white/10 bg-navy-900 px-4 py-3 text-white dark:bg-navy-950">
              <span className="flex h-9 w-9 items-center justify-center rounded-full text-white gradient-teal-avatar" aria-hidden="true">
                <SparkIcon className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-serif text-sm font-semibold leading-tight">OpenScience AI</p>
                <p className="flex items-center gap-1.5 text-[11px] text-gray-400">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${isStreaming ? 'animate-pulse-dot bg-teal-400' : 'bg-teal-400'}`}
                    aria-hidden="true"
                  />
                  {isStreaming ? 'écrit…' : 'Assistant de la plateforme'}
                </p>
              </div>
              <button
                type="button"
                onClick={reset}
                aria-label="Réinitialiser la conversation"
                title="Réinitialiser"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
              >
                <ResetIcon />
              </button>
              <button
                type="button"
                onClick={close}
                aria-label="Fermer"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
              >
                <CloseIcon />
              </button>
            </header>

            {/* Fil de discussion */}
            <div
              ref={scrollRef}
              className="flex-1 space-y-3 overflow-y-auto bg-gray-50 px-3.5 py-4 dark:bg-navy-950"
            >
              {isEmpty ? (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-gray-200/70 bg-white p-4 dark:border-navy-700 dark:bg-navy-800">
                    <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-200">
                      👋 Bonjour ! Je suis <strong className="font-semibold">OpenScience AI</strong>.
                      Posez-moi une question sur la plateforme ou sur les travaux disponibles
                      (thèses, mémoires, articles…).
                    </p>
                  </div>
                  {!isConfigured && (
                    <p className="rounded-xl border border-amber/30 bg-amber-light/60 px-3 py-2 text-xs text-amber-dark dark:border-amber/30 dark:bg-amber/10 dark:text-amber-light">
                      Mode démo : aucune clé Groq détectée. Ajoutez <code className="font-mono">VITE_GROQ_API_KEY</code> dans <code className="font-mono">.env.local</code> pour activer les réponses.
                    </p>
                  )}
                  <SuggestedPrompts onPick={send} disabled={isStreaming} />
                </div>
              ) : (
                messages.map((m) => (
                  <ChatMessage key={m.id} message={m} onNavigate={close} />
                ))
              )}
            </div>

            {/* Bouton « Arrêter » pendant la génération */}
            {isStreaming && (
              <div className="flex shrink-0 justify-center bg-gray-50 pb-1 dark:bg-navy-950">
                <button
                  type="button"
                  onClick={stop}
                  className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-600 shadow-sm transition-colors hover:text-gray-900 dark:border-navy-700 dark:bg-navy-800 dark:text-gray-300 dark:hover:text-white"
                >
                  Arrêter la génération
                </button>
              </div>
            )}

            <ChatComposer onSend={send} disabled={isStreaming} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
