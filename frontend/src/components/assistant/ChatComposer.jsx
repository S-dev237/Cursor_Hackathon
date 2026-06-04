import { useRef, useState } from 'react'

function SendIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
      <path
        d="M4 12l15-7-7 15-2-6-6-2z"
        fill="currentColor"
      />
    </svg>
  )
}

export default function ChatComposer({ onSend, disabled }) {
  const [value, setValue] = useState('')
  const taRef = useRef(null)

  const submit = () => {
    const text = value.trim()
    if (!text || disabled) return
    onSend(text)
    setValue('')
    if (taRef.current) taRef.current.style.height = 'auto'
  }

  const handleChange = (e) => {
    setValue(e.target.value)
    const el = e.target
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  return (
    <form
      className="flex items-end gap-2 border-t border-gray-200/70 bg-white p-3 dark:border-navy-700 dark:bg-navy-900"
      onSubmit={(e) => {
        e.preventDefault()
        submit()
      }}
    >
      <textarea
        ref={taRef}
        rows={1}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="Posez votre question…"
        aria-label="Votre message"
        autoFocus
        className="max-h-[120px] flex-1 resize-none rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 transition-all duration-200 ease-premium focus:border-teal-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500/20 dark:border-navy-700 dark:bg-navy-800 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:bg-navy-800"
      />
      <button
        type="submit"
        disabled={disabled || !value.trim()}
        aria-label="Envoyer"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-500 text-white shadow-sm transition-all duration-200 ease-premium hover:bg-teal-400 hover:shadow-teal active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <SendIcon />
      </button>
    </form>
  )
}
