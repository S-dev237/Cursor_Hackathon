import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

const PLACEHOLDERS = [
  'Rechercher une thèse, un article, un auteur…',
  'Ex. machine learning, réseaux de neurones…',
  'Ex. biologie, énergie renouvelable…',
]

function SearchIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M20 20l-3.5-3.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

/** Barre de recherche hero — style dark premium + placeholder animé. */
export default function HeroSearchBar({ onSearch }) {
  const [value, setValue] = useState('')
  const [focused, setFocused] = useState(false)
  const [placeholderIdx, setPlaceholderIdx] = useState(0)

  useEffect(() => {
    if (value || focused) return undefined
    const timer = setInterval(() => {
      setPlaceholderIdx((i) => (i + 1) % PLACEHOLDERS.length)
    }, 3200)
    return () => clearInterval(timer)
  }, [value, focused])

  const submit = (e) => {
    e.preventDefault()
    onSearch?.(value.trim())
  }

  const showAnimatedPlaceholder = !value && !focused

  return (
    <form
      onSubmit={submit}
      className="group relative flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-1.5 transition-all duration-200 focus-within:border-teal-400/50 focus-within:bg-white/[0.07] focus-within:shadow-teal focus-within:ring-1 focus-within:ring-teal-500/20"
    >
      <span className="pl-2.5 text-gray-400 transition-colors duration-200 group-focus-within:text-teal-300">
        <SearchIcon className="h-5 w-5" />
      </span>

      <div className="relative min-w-0 flex-1">
        <input
          type="search"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          aria-label="Rechercher"
          className="relative z-10 w-full border-0 bg-transparent py-2.5 text-base text-white/90 placeholder:text-transparent focus:ring-0"
        />

        {showAnimatedPlaceholder && (
          <div
            className="pointer-events-none absolute inset-0 z-0 flex items-center overflow-hidden"
            aria-hidden="true"
          >
            <AnimatePresence mode="wait">
              <motion.span
                key={placeholderIdx}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="truncate text-base text-white/40"
              >
                {PLACEHOLDERS[placeholderIdx]}
              </motion.span>
            </AnimatePresence>
          </div>
        )}
      </div>

      <button
        type="submit"
        className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-teal-500 px-4 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:bg-teal-400 hover:shadow-teal active:scale-[0.98]"
      >
        Rechercher
        <kbd className="hidden font-mono text-[10px] text-white/40 sm:inline">↵</kbd>
      </button>
    </form>
  )
}
