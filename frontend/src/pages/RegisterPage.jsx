import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import Navbar from '../components/layout/Navbar.jsx'
import Logo from '../components/ui/Logo.jsx'
import Spinner from '../components/ui/Spinner.jsx'

const ROLES = [
  { value: 'student', label: 'Étudiant' },
  { value: 'researcher', label: 'Chercheur' },
]

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'student',
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
    <div className="flex min-h-dvh flex-col bg-gray-bg">
      <Navbar />
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 flex flex-col items-center text-center">
            <Logo variant="full" size="md" onDark={false} className="mb-5" link={false} />
            <h1 className="font-serif text-3xl font-semibold text-gray-text">
              Créer un compte
            </h1>
            <p className="mt-2 text-sm text-gray-muted">
              Rejoignez le répertoire ouvert des travaux universitaires.
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
                Nom complet
              </span>
              <input
                type="text"
                required
                autoComplete="name"
                value={form.full_name}
                onChange={set('full_name')}
                className="input-base"
                placeholder="Aminata Diallo"
              />
            </label>

            <label className="mb-4 block">
              <span className="mb-1.5 block text-sm font-medium text-gray-text">
                Email
              </span>
              <input
                type="email"
                required
                autoComplete="email"
                value={form.email}
                onChange={set('email')}
                className="input-base"
                placeholder="nom@universite.fr"
              />
            </label>

            <label className="mb-4 block">
              <span className="mb-1.5 block text-sm font-medium text-gray-text">
                Mot de passe
              </span>
              <input
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                value={form.password}
                onChange={set('password')}
                className="input-base"
                placeholder="6 caractères minimum"
              />
            </label>

            <fieldset className="mb-5">
              <legend className="mb-1.5 block text-sm font-medium text-gray-text">
                Profil
              </legend>
              <div className="grid grid-cols-2 gap-2">
                {ROLES.map((r) => (
                  <label
                    key={r.value}
                    className={`cursor-pointer rounded-md border px-3 py-2.5 text-center text-sm transition-colors ${
                      form.role === r.value
                        ? 'border-teal bg-teal-light text-teal-dark'
                        : 'border-gray-border bg-white text-gray-text hover:border-teal-mid'
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
                    {r.label}
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

          <p className="mt-5 text-center text-sm text-gray-muted">
            Déjà inscrit ?{' '}
            <Link to="/login" className="font-medium text-teal hover:text-teal-dark">
              Se connecter
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}
