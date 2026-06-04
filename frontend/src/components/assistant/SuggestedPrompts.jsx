import { SUGGESTED_PROMPTS } from '../../ai/assistantContext.js'

export default function SuggestedPrompts({ onPick, disabled }) {
  return (
    <div>
      <p className="section-label mb-2">Suggestions</p>
      <div className="flex flex-col gap-2">
        {SUGGESTED_PROMPTS.map((p) => (
          <button
            key={p}
            type="button"
            disabled={disabled}
            onClick={() => onPick(p)}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-left text-sm text-gray-700 transition-all duration-200 ease-premium hover:border-teal-300 hover:bg-teal-50/50 hover:text-gray-900 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 dark:border-navy-700 dark:bg-navy-800 dark:text-gray-200 dark:hover:border-teal-500/40 dark:hover:bg-teal-500/10 dark:hover:text-white"
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  )
}
