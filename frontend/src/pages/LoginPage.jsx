import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import Navbar from '../components/layout/Navbar.jsx'
import Logo from '../components/ui/Logo.jsx'
import Spinner from '../components/ui/Spinner.jsx'
import PasswordInput from '../components/ui/PasswordInput.jsx'

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
    const { error: loginError } = await login(email, password)
    setSubmitting(false)
    if (loginError) {
      setError(loginError)
      return
    }
    navigate(from, { replace: true })
  }

  return (
    <div className="page-shell flex min-h-dvh flex-col">
      <Navbar />
      <main className="flex flex-1 items-center justify-center px-4 py-12 sm:py-16">
        <div className="w-full max-w-[26rem]">
          <div className="mb-9 flex flex-col items-center text-center">
            <Logo variant="full" size="md" onDark={false} className="mb-6" link={false} />
            <h1 className="font-serif text-[2rem] font-semibold leading-tight tracking-tight text-gray-900 dark:text-gray-100">
              Bon retour
            </h1>
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-gray-500 dark:text-gray-400">
              Connectez-vous pour suivre vos soumissions et déposer vos travaux.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-gray-200/70 bg-white p-7 shadow-card dark:border-navy-700 dark:bg-navy-800"
          >
            {error && (
              <div
                id="login-error"
                role="alert"
                className="mb-5 flex items-start gap-2 rounded-lg border border-[#F09595] bg-[#FCEBEB] px-3 py-2.5 text-sm text-[#791F1F] dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"
              >
                <svg viewBox="0 0 24 24" fill="none" className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true">
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
                  <path d="M12 7.5v5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                  <circle cx="12" cy="16" r="0.9" fill="currentColor" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <label className="mb-4 block" htmlFor="login-email">
              <span className="mb-1.5 block text-sm font-medium text-gray-900 dark:text-gray-100">
                Email
              </span>
              <input
                id="login-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={!!error || undefined}
                aria-describedby={error ? 'login-error' : undefined}
                className="input-base"
                placeholder="nom@universite.fr"
              />
            </label>

            <div className="mb-6">
              <div className="mb-1.5 flex items-baseline justify-between gap-2">
                <label className="text-sm font-medium text-gray-900 dark:text-gray-100" htmlFor="login-password">
                  Mot de passe
                </label>
              </div>
              <PasswordInput
                id="login-password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={!!error || undefined}
                aria-describedby={error ? 'login-error' : undefined}
                placeholder="Votre mot de passe"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full"
            >
              {submitting ? <Spinner size={18} /> : 'Se connecter'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
            Pas encore de compte ?{' '}
            <Link to="/register" className="font-medium text-teal hover:text-teal-dark dark:text-teal-400 dark:hover:text-teal-300">
              Créer un compte
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}
