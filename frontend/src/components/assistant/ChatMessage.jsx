import Markdown from './Markdown.jsx'

function SparkIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3z"
        fill="currentColor"
      />
      <path d="M18 14l.8 2.2L21 17l-2.2.8L18 20l-.8-2.2L15 17l2.2-.8L18 14z" fill="currentColor" opacity="0.7" />
    </svg>
  )
}

function Avatar() {
  return (
    <span
      className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white gradient-teal-avatar"
      aria-hidden="true"
    >
      <SparkIcon className="h-4 w-4" />
    </span>
  )
}

function TypingDots() {
  return (
    <span className="flex items-center gap-1 py-1" aria-label="OpenScience AI écrit…">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-teal-400"
          style={{ animationDelay: `${i * 0.18}s` }}
        />
      ))}
    </span>
  )
}

export default function ChatMessage({ message, onNavigate }) {
  const isUser = message.role === 'user'

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-teal-500 px-3.5 py-2 text-sm leading-relaxed text-white shadow-sm">
          {message.content}
        </div>
      </div>
    )
  }

  return (
    <div className="flex justify-start gap-2">
      <Avatar />
      <div className="max-w-[85%] rounded-2xl rounded-bl-md border border-gray-200/70 bg-white px-3.5 py-2.5 text-gray-800 shadow-sm dark:border-navy-700 dark:bg-navy-800 dark:text-gray-100">
        {message.content ? (
          <Markdown content={message.content} onNavigate={onNavigate} />
        ) : (
          <TypingDots />
        )}
      </div>
    </div>
  )
}
