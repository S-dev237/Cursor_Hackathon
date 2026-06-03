import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import Navbar from '../components/layout/Navbar.jsx'
import Logo from '../components/ui/Logo.jsx'
import Spinner from '../components/ui/Spinner.jsx'

const MOCK_MODE = import.meta.env.VITE_MOCK_API === 'true'

const DEMO_ACCOUNTS = [
  {
    label: 'Admin',
    email: 'admin@openscience.cm',
    password: 'demo',
    hint: 'Accès /admin/queue',
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
    navigate(account.label === 'Admin' ? '/admin/queue' : from, { replace: true })
  }

  return (
    <div className="flex min-h-dvh flex-col bg-gray-100">
      <Navbar />
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 flex flex-col items-center text-center">
            <Logo variant="full" size="md" onDark={false} className="mb-5" link={false} />
            <h1 className="font-serif text-3xl font-semibold text-gray-900">
              Connexion
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              Accédez à vos soumissions et déposez vos travaux.
            </p>
          </div>

          {MOCK_MODE && (
            <div className="mb-5 rounded-xl border border-teal-300/40 bg-teal-50/80 p-4">
              <p className="section-label mb-3 text-teal-700">
                Mode démo — sans backend
              </p>
              <div className="flex flex-col gap-2 sm:flex-row">
                {DEMO_ACCOUNTS.map((acc) => (
                  <button
                    key={acc.label}
                    type="button"
                    disabled={submitting}
                    onClick={() => quickLogin(acc)}
                    className="flex-1 rounded-lg border border-teal-200 bg-white px-3 py-2.5 text-left text-sm transition-all duration-200 hover:border-teal-400 hover:shadow-teal disabled:opacity-50"
                  >
                    <span className="font-medium text-gray-900">{acc.label}</span>
                    <span className="mt-0.5 block font-mono text-[10px] text-gray-500">
                      {acc.email}
                    </span>
                    <span className="mt-0.5 block text-[11px] text-teal-600">{acc.hint}</span>
                  </button>
                ))}
              </div>
              <p className="mt-2 font-mono text-[10px] text-gray-500">
                Mot de passe : demo (ou n&apos;importe quoi)
              </p>
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="rounded-xl border border-gray-200/60 bg-white p-6 shadow-card"
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
