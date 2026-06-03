import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import Navbar from '../components/layout/Navbar.jsx'
import Spinner from '../components/ui/Spinner.jsx'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from || '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    const { error } = await login(email, password)
    setSubmitting(false)
    if (error) {
      setError(error)
      return
    }
    navigate(from, { replace: true })
  }

  return (
    <div className="flex min-h-dvh flex-col bg-gray-bg">
      <Navbar />
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <h1 className="font-serif text-3xl font-semibold text-gray-text">
              Connexion
            </h1>
            <p className="mt-2 text-sm text-gray-muted">
              Accédez à vos soumissions et déposez vos travaux.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="rounded-lg border border-gray-border bg-white p-6 shadow-card"
          >
            {error && (
              <div
                role="alert"
                className="mb-4 rounded-md border border-[#F09595] bg-[#FCEBEB] px-3 py-2 text-sm text-[#791F1F]"
              >
                {error}
              </div>
            )}

            <label className="mb-4 block">
              <span className="mb-1.5 block text-sm font-medium text-gray-text">
                Email
              </span>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-base"
                placeholder="nom@universite.fr"
              />
            </label>

            <label className="mb-5 block">
              <span className="mb-1.5 block text-sm font-medium text-gray-text">
                Mot de passe
              </span>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-base"
                placeholder="••••••••"
              />
            </label>

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full"
            >
              {submitting ? <Spinner size={18} /> : 'Se connecter'}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-gray-muted">
            Pas encore de compte ?{' '}
            <Link to="/register" className="font-medium text-teal hover:text-teal-dark">
              Créer un compte
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}
