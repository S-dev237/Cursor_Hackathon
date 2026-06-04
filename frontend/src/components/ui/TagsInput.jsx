import { useState } from 'react'
import clsx from 'clsx'

export default function TagsInput({
  tags = [],
  onChange,
  max = 20,
  placeholder = 'Ajouter…',
  highlighted = false,
}) {
  const [value, setValue] = useState('')

  const addTag = (raw) => {
    const tag = raw.trim()
    if (!tag || tags.includes(tag) || tags.length >= max) return
    onChange([...tags, tag])
    setValue('')
  }

  const removeTag = (tag) => onChange(tags.filter((t) => t !== tag))

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(value)
    } else if (e.key === 'Backspace' && !value && tags.length) {
      removeTag(tags[tags.length - 1])
    }
  }

  return (
    <div
      className={clsx(
        'flex flex-wrap items-center gap-1.5 rounded-lg border p-2.5 transition-all duration-200',
        highlighted
          ? 'input-ai'
          : 'border-gray-200 bg-white focus-within:border-teal-400 focus-within:ring-1 focus-within:ring-teal-500/20 dark:border-navy-700 dark:bg-navy-800',
      )}
    >
      {tags.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 rounded-full border border-teal-200 bg-teal-50 px-2.5 py-0.5 text-xs font-medium text-teal-800 dark:border-teal-500/30 dark:bg-teal-500/15 dark:text-teal-300"
        >
          {tag}
          <button
            type="button"
            onClick={() => removeTag(tag)}
            aria-label={`Retirer ${tag}`}
            className="rounded-full p-0.5 text-teal-600 transition-colors duration-200 hover:bg-teal-100 dark:text-teal-400 dark:hover:bg-teal-500/20"
          >
            <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none">
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        </span>
      ))}
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => addTag(value)}
        placeholder={tags.length >= max ? `Maximum ${max} atteint` : placeholder}
        disabled={tags.length >= max}
        className="min-w-[120px] flex-1 border-0 bg-transparent p-0.5 text-sm text-gray-900 placeholder:text-gray-400 focus:ring-0 dark:text-gray-100 dark:placeholder:text-gray-500"
      />
    </div>
  )
}
