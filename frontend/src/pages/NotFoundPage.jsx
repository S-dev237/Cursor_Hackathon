import PageWrapper from '../components/layout/PageWrapper.jsx'
import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <PageWrapper>
      <div className="mx-auto max-w-md py-24 text-center">
        <p className="font-mono text-5xl font-semibold text-teal">404</p>
        <h1 className="mt-4 font-serif text-2xl font-semibold text-gray-text">
          Page introuvable
        </h1>
        <p className="mt-2 text-sm text-gray-muted">
          La page que vous cherchez n'existe pas ou a été déplacée.
        </p>
        <Link to="/" className="btn-primary mt-6">
          Retour à l'accueil
        </Link>
      </div>
    </PageWrapper>
  )
}
