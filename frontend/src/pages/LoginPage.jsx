import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import Navbar from '../components/layout/Navbar.jsx'
import Logo from '../components/ui/Logo.jsx'
import Spinner from '../components/ui/Spinner.jsx'
import PasswordInput from '../components/ui/PasswordInput.jsx'

const MOCK_MODE = import.meta.env.VITE_MOCK_API === 'true'

const DEMO_ACCOUNTS = [
  {
    label: 'Admin',
    email: 'admin@openscience.cm',
    password: 'demo',
    hint: 'Accès tableau de bord /admin',
  },
  {
    label: 'Étudiant',
    email: 'demo@etudiant.cm',
    password: 'demo',
    hint: 'Soumissions + soumettre',
  },
]

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from || '/'

  const [email, setEmail] = useState(MOCK_MODE ? DEMO_ACCOUNTS[0].email : '')
  const [password, setPassword] = useState(MOCK_MODE ? DEMO_ACCOUNTS[0].password : '')
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

  const quickLogin = async (account) => {
    setEmail(account.email)
    setPassword(account.password)
    setError(null)
    setSubmitting(true)
    const { error: loginError } = await login(account.email, account.password)
    setSubmitting(false)
    if (loginError) {
      setError(loginError)
      return
    }
    navigate(account.label === 'Admin' ? '/admin' : from, { replace: true })
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

          {MOCK_MODE && (
            <div className="mb-6 rounded-xl border border-teal-300/40 bg-teal-50/70 p-4 dark:border-teal-500/30 dark:bg-teal-500/10">
              <div className="mb-3 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
                <p className="section-label text-teal-700 dark:text-teal-300">
                  Comptes de démonstration
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                {DEMO_ACCOUNTS.map((acc) => (
                  <button
                    key={acc.label}
                    type="button"
                    disabled={submitting}
                    onClick={() => quickLogin(acc)}
                    className="flex-1 rounded-lg border border-teal-200 bg-white px-3 py-2.5 text-left transition-[border-color,box-shadow,transform] duration-200 ease-premium hover:border-teal-400 hover:shadow-teal active:scale-[0.99] disabled:opacity-50 dark:border-teal-500/30 dark:bg-navy-800"
                  >
                    <span className="block text-sm font-medium text-gray-900 dark:text-gray-100">{acc.label}</span>
                    <span className="mt-0.5 block font-mono text-[10px] text-gray-500 dark:text-gray-400">
                      {acc.email}
                    </span>
                    <span className="mt-1 block text-[11px] leading-snug text-teal-600 dark:text-teal-400">{acc.hint}</span>
                  </button>
                ))}
              </div>
              <p className="mt-2.5 font-mono text-[10px] text-gray-500 dark:text-gray-400">
                Mot de passe&nbsp;: <span className="text-gray-700 dark:text-gray-300">demo</span>
              </p>
            </div>
          )}

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
                <Link
                  to="/login"
                  className="text-xs font-medium text-teal hover:text-teal-dark dark:text-teal-400 dark:hover:text-teal-300"
                >
                  Mot de passe oublié&nbsp;?
                </Link>
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
