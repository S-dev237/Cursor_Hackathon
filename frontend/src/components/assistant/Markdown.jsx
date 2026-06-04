import { useNavigate } from 'react-router-dom'

// Renderer Markdown léger (sans dépendance) suffisant pour les réponses du LLM :
// gras, italique, code inline, listes à puces/numérotées, liens.
// Les liens internes (commençant par /) utilisent React Router et ferment le panneau.

const INLINE_RE =
  /\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|`([^`]+)`|\*([^*]+)\*/g

const linkCls =
  'font-medium text-teal-600 underline decoration-teal-300 decoration-1 underline-offset-2 transition-colors hover:text-teal-500 dark:text-teal-300 dark:hover:text-teal-200'

function renderInline(text, navigate, onNavigate, keyPrefix) {
  const nodes = []
  let last = 0
  let i = 0
  let m

  INLINE_RE.lastIndex = 0
  while ((m = INLINE_RE.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index))
    const key = `${keyPrefix}-${i++}`

    if (m[1] !== undefined) {
      const label = m[1]
      const href = m[2]
      if (href.startsWith('/')) {
        nodes.push(
          <a
            key={key}
            href={href}
            className={linkCls}
            onClick={(e) => {
              e.preventDefault()
              onNavigate?.()
              navigate(href)
            }}
          >
            {label}
          </a>,
        )
      } else {
        nodes.push(
          <a
            key={key}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={linkCls}
          >
            {label}
          </a>,
        )
      }
    } else if (m[3] !== undefined) {
      nodes.push(
        <strong key={key} className="font-semibold">
          {m[3]}
        </strong>,
      )
    } else if (m[4] !== undefined) {
      nodes.push(
        <code
          key={key}
          className="rounded bg-gray-100 px-1 py-0.5 font-mono text-[0.85em] text-gray-700 dark:bg-navy-900 dark:text-gray-200"
        >
          {m[4]}
        </code>,
      )
    } else if (m[5] !== undefined) {
      nodes.push(
        <em key={key} className="italic">
          {m[5]}
        </em>,
      )
    }

    last = INLINE_RE.lastIndex
  }
  if (last < text.length) nodes.push(text.slice(last))
  return nodes
}

export default function Markdown({ content, onNavigate }) {
  const navigate = useNavigate()
  const lines = String(content).split('\n')

  const blocks = []
  let list = null
  const flush = () => {
    if (list) {
      blocks.push(list)
      list = null
    }
  }

  lines.forEach((line) => {
    const ul = line.match(/^\s*[-*]\s+(.*)$/)
    const ol = line.match(/^\s*\d+\.\s+(.*)$/)
    if (ul) {
      if (!list || list.type !== 'ul') {
        flush()
        list = { type: 'ul', items: [] }
      }
      list.items.push(ul[1])
    } else if (ol) {
      if (!list || list.type !== 'ol') {
        flush()
        list = { type: 'ol', items: [] }
      }
      list.items.push(ol[1])
    } else {
      flush()
      if (line.trim() !== '') blocks.push({ type: 'p', text: line })
    }
  })
  flush()

  return (
    <div className="space-y-2 text-sm leading-relaxed">
      {blocks.map((b, idx) => {
        if (b.type === 'p') {
          return <p key={idx}>{renderInline(b.text, navigate, onNavigate, idx)}</p>
        }
        const items = b.items.map((it, j) => (
          <li key={j}>{renderInline(it, navigate, onNavigate, `${idx}-${j}`)}</li>
        ))
        return b.type === 'ul' ? (
          <ul key={idx} className="list-disc space-y-1 pl-5 marker:text-teal-500">
            {items}
          </ul>
        ) : (
          <ol key={idx} className="list-decimal space-y-1 pl-5 marker:text-gray-400">
            {items}
          </ol>
        )
      })}
    </div>
  )
}
