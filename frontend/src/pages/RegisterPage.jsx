import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import Navbar from '../components/layout/Navbar.jsx'
import Logo from '../components/ui/Logo.jsx'
import Spinner from '../components/ui/Spinner.jsx'
import PasswordInput from '../components/ui/PasswordInput.jsx'

const ROLES = [
  { value: 'visitor', label: 'Visiteur', hint: 'Consultation' },
  { value: 'academic', label: 'Universitaire', hint: 'Étudiant ou chercheur' },
]

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'visitor',
  })
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const set = (key) => (e) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    const { error } = await register(form)
    setSubmitting(false)
    if (error) {
      setError(error)
      return
    }
    navigate('/', { replace: true })
  }

  return (
    <div className="page-shell flex min-h-dvh flex-col">
      <Navbar />
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 flex flex-col items-center text-center">
            <Logo variant="full" size="md" onDark={false} className="mb-5" link={false} />
            <h1 className="font-serif text-3xl font-semibold text-gray-900 dark:text-gray-100">
              Créer un compte
            </h1>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Rejoignez le répertoire ouvert des travaux universitaires.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="rounded-lg border border-gray-border bg-white p-6 shadow-card dark:border-navy-700 dark:bg-navy-800"
          >
            {error && (
              <div
                id="register-error"
                role="alert"
                className="mb-4 rounded-md border border-[#F09595] bg-[#FCEBEB] px-3 py-2 text-sm text-[#791F1F] dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"
              >
                {error}
              </div>
            )}

            <label className="mb-4 block" htmlFor="register-name">
              <span className="mb-1.5 block text-sm font-medium text-gray-900 dark:text-gray-100">
                Nom complet
              </span>
              <input
                id="register-name"
                type="text"
                required
                autoComplete="name"
                value={form.full_name}
                onChange={set('full_name')}
                aria-invalid={!!error || undefined}
                aria-describedby={error ? 'register-error' : undefined}
                className="input-base"
                placeholder="Aminata Diallo"
              />
            </label>

            <label className="mb-4 block" htmlFor="register-email">
              <span className="mb-1.5 block text-sm font-medium text-gray-900 dark:text-gray-100">
                Email
              </span>
              <input
                id="register-email"
                type="email"
                required
                autoComplete="email"
                value={form.email}
                onChange={set('email')}
                aria-invalid={!!error || undefined}
                aria-describedby={error ? 'register-error' : undefined}
                className="input-base"
                placeholder="nom@universite.fr"
              />
            </label>

            <label className="mb-4 block" htmlFor="register-password">
              <span className="mb-1.5 block text-sm font-medium text-gray-900 dark:text-gray-100">
                Mot de passe
              </span>
              <PasswordInput
                id="register-password"
                required
                minLength={6}
                autoComplete="new-password"
                value={form.password}
                onChange={set('password')}
                aria-invalid={!!error || undefined}
                aria-describedby={error ? 'register-error' : undefined}
                placeholder="6 caractères minimum"
              />
            </label>

            <fieldset className="mb-5">
              <legend className="mb-1.5 block text-sm font-medium text-gray-900 dark:text-gray-100">
                Profil
              </legend>
              <div className="grid grid-cols-2 gap-2">
                {ROLES.map((r) => (
                  <label
                    key={r.value}
                    className={`cursor-pointer rounded-md border px-3 py-2.5 text-center text-sm transition-colors ${
                      form.role === r.value
                        ? 'border-teal bg-teal-light text-teal-dark dark:border-teal-500/50 dark:bg-teal-500/10 dark:text-teal-300'
                        : 'border-gray-border bg-white text-gray-text hover:border-teal-mid dark:border-navy-700 dark:bg-navy-800 dark:text-gray-200 dark:hover:border-teal-500/40'
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={r.value}
                      checked={form.role === r.value}
                      onChange={set('role')}
                      className="sr-only"
                    />
                    <span className="block font-medium">{r.label}</span>
                    {r.hint && (
                      <span className="mt-0.5 block text-xs text-gray-500 dark:text-gray-400">
                        {r.hint}
                      </span>
                    )}
                  </label>
                ))}
              </div>
            </fieldset>

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full"
            >
              {submitting ? <Spinner size={18} /> : 'Créer mon compte'}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-gray-500 dark:text-gray-400">
            Déjà inscrit ?{' '}
            <Link to="/login" className="font-medium text-teal hover:text-teal-dark dark:text-teal-400 dark:hover:text-teal-300">
              Se connecter
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}
