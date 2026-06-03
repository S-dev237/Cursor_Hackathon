import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import clsx from 'clsx'

const ToastContext = createContext(null)

const TOAST_DURATION = 3000

let idCounter = 0

function ToastItem({ toast, onDismiss }) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), TOAST_DURATION)
    return () => clearTimeout(timer)
  }, [toast.id, onDismiss])

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 80, scale: 0.96 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.2 } }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className="pointer-events-auto relative overflow-hidden rounded-xl bg-gray-900 px-4 py-3 pr-5 text-sm text-white shadow-navy"
      role="status"
    >
      <div className="flex items-center gap-2.5">
        {toast.variant === 'error' ? (
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-500/20 text-red-400">
            <svg viewBox="0 0 24 24" fill="none" className="h-3 w-3" aria-hidden="true">
              <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </span>
        ) : (
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal-500/20 text-teal-400">
            <svg viewBox="0 0 24 24" fill="none" className="h-3 w-3" aria-hidden="true">
              <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        )}
        <span>{toast.message}</span>
      </div>

      <div
        className={clsx(
          'toast-progress-bar',
          toast.variant === 'error' && 'error',
        )}
        style={{ animationDuration: `${TOAST_DURATION}ms` }}
      />
    </motion.div>
  )
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback(
    (message, variant = 'success') => {
      const id = `${Date.now()}-${idCounter++}`
      setToasts((prev) => [...prev, { id, message, variant }])
    },
    [],
  )

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div
        className="pointer-events-none fixed bottom-4 right-4 z-[1000] flex w-full max-w-sm flex-col gap-2"
        aria-live="polite"
      >
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => (
            <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    return { toast: () => {} }
  }
  return ctx
}
