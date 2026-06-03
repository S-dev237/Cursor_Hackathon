import { Link } from 'react-router-dom'

// Placeholder structuré — sera remplacé par les prompts P3–P6
export default function StubPage({ title, prompt, children }) {
  return (
    <div className="mx-auto max-w-2xl py-16 text-center">
      <span className="inline-block rounded-full border border-gray-border bg-white px-3 py-1 font-mono text-[11px] uppercase tracking-wider text-gray-muted">
        En construction
      </span>
      <h1 className="mt-5 font-serif text-3xl font-semibold text-gray-text">
        {title}
      </h1>
      {prompt && (
        <p className="mt-3 text-sm text-gray-muted">
          Cette page sera générée par le prompt{' '}
          <span className="font-mono text-teal-dark">{prompt}</span>.
        </p>
      )}
      {children}
      <div className="mt-8">
        <Link to="/" className="btn-ghost">
          Retour à l'accueil
        </Link>
      </div>
    </div>
  )
}
