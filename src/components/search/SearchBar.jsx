import { useState } from 'react'

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

export default function SearchBar({
  initialValue = '',
  onSearch,
  onChange,
  size = 'sm',
  placeholder = 'Rechercher une thèse, un article, un auteur…',
}) {
  const [value, setValue] = useState(initialValue)
  const isLarge = size === 'lg'

  const handleChange = (e) => {
    const v = e.target.value
    setValue(v)
    onChange?.(v)
  }

  const submit = (e) => {
    e?.preventDefault()
    onSearch?.(value.trim())
  }

  if (isLarge) {
    return (
      <form
        onSubmit={submit}
        className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-1.5 backdrop-blur transition-all duration-200 focus-within:border-teal-400/50 focus-within:shadow-teal"
      >
        <span className="pl-2.5 text-white/50">
          <SearchIcon className="h-5 w-5" />
        </span>
        <input
          type="search"
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          aria-label="Rechercher"
          className="flex-1 border-0 bg-transparent py-2 text-base text-white/90 placeholder:text-white/40 focus:ring-0"
        />
        <button type="submit" className="btn-primary shrink-0">
          Rechercher
        </button>
      </form>
    )
  }

  return (
    <form
      onSubmit={submit}
      className="group flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.08] p-1 transition-all duration-200 focus-within:border-teal-400/40 focus-within:bg-white/[0.12]"
    >
      <span className="pl-2.5 text-white/40 transition-colors duration-200 group-focus-within:text-teal-300/70">
        <SearchIcon className="h-4 w-4" />
      </span>
      <input
        type="search"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        aria-label="Rechercher"
        className="min-w-0 flex-1 border-0 bg-transparent py-2 text-sm text-white/80 placeholder:text-white/35 focus:ring-0"
      />
      <button
        type="submit"
        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-teal-500 px-3 py-1.5 text-xs font-medium text-white transition-all duration-200 hover:bg-teal-400 hover:shadow-teal active:scale-[0.98]"
      >
        Rechercher
        <kbd className="hidden font-mono text-[10px] text-white/40 sm:inline">↵</kbd>
      </button>
    </form>
  )
}
