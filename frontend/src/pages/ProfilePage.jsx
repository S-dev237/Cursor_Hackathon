import { useEffect, useState } from 'react'
import Navbar from '../components/layout/Navbar.jsx'
import Spinner from '../components/ui/Spinner.jsx'
import { useToast } from '../components/ui/Toast.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { updateMe } from '../api/auth.js'
import { getInstitutions } from '../api/documents.js'

const ROLE_LABELS = {
  admin: 'Administrateur',
  visitor: 'Visiteur',
  academic: 'Universitaire',
  student: 'Étudiant',
  researcher: 'Chercheur',
}

function initials(name = '') {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export default function ProfilePage() {
  const { user, updateUser } = useAuth()
  const { toast } = useToast()

  const [fullName, setFullName] = useState(user?.full_name || '')
  const [institutionId, setInstitutionId] = useState(
    user?.institution_id ? String(user.institution_id) : '',
  )
  const [institutions, setInstitutions] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    getInstitutions().then(({ data }) => data && setInstitutions(data))
  }, [])

  useEffect(() => {
    if (!user) return
    /* eslint-disable react-hooks/set-state-in-effect */
    setFullName(user.full_name || '')
    setInstitutionId(user.institution_id ? String(user.institution_id) : '')
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [user])

  const institutionName =
    institutions.find((i) => String(i.id) === institutionId)?.name || '—'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    if (!fullName.trim()) {
      setError('Le nom complet est requis.')
      return
    }
    setSaving(true)
    const { data, error: updErr } = await updateMe({
      full_name: fullName.trim(),
      institution_id: institutionId || null,
    })
    setSaving(false)
    if (updErr || !data) {
      setError(updErr || 'Mise à jour impossible.')
      toast(updErr || 'Mise à jour impossible.', 'error')
      return
    }
    updateUser(data)
    toast('Profil mis à jour')
  }

  if (!user) return null

  return (
    <div className="page-shell flex min-h-dvh flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:px-6">
        <h1 className="mb-6 font-serif text-2xl font-semibold text-gray-text dark:text-gray-100">
          Mon profil
        </h1>

        <div className="mb-6 flex items-center gap-4 rounded-xl border border-gray-border bg-white p-5 shadow-card dark:border-navy-700 dark:bg-navy-800">
          <span className="gradient-teal-avatar flex h-14 w-14 items-center justify-center rounded-full font-mono text-base font-medium text-white shadow-sm">
            {initials(user.full_name)}
          </span>
          <div className="min-w-0">
            <p className="truncate font-serif text-lg font-semibold text-gray-text dark:text-gray-100">
              {user.full_name}
            </p>
            <p className="truncate font-mono text-xs text-gray-muted">{user.email}</p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-gray-border bg-white p-6 shadow-card dark:border-navy-700 dark:bg-navy-800"
        >
          {error && (
            <div
              role="alert"
              className="mb-4 rounded-md border border-[#F09595] bg-[#FCEBEB] px-3 py-2 text-sm text-[#791F1F] dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"
            >
              {error}
            </div>
          )}

          <dl className="mb-5 grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="section-label mb-1">Email</dt>
              <dd className="text-sm text-gray-text dark:text-gray-100">{user.email}</dd>
            </div>
            <div>
              <dt className="section-label mb-1">Rôle</dt>
              <dd className="text-sm text-gray-text dark:text-gray-100">
                {ROLE_LABELS[user.role] || user.role}
              </dd>
            </div>
            <div>
              <dt className="section-label mb-1">Institution actuelle</dt>
              <dd className="text-sm text-gray-text dark:text-gray-100">{institutionName}</dd>
            </div>
          </dl>

          <label className="mb-4 block" htmlFor="profile-name">
            <span className="mb-1.5 block text-sm font-medium text-gray-text dark:text-gray-100">
              Nom complet
            </span>
            <input
              id="profile-name"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              aria-invalid={!!error || undefined}
              aria-describedby={error ? 'profile-error' : undefined}
              className="input-base"
              placeholder="Votre nom complet"
            />
          </label>

          <label className="mb-5 block" htmlFor="profile-institution">
            <span className="mb-1.5 block text-sm font-medium text-gray-text dark:text-gray-100">
              Institution
            </span>
            <select
              id="profile-institution"
              value={institutionId}
              onChange={(e) => setInstitutionId(e.target.value)}
              className="input-base"
            >
              <option value="">Aucune institution</option>
              {institutions.map((i) => (
                <option key={i.id} value={String(i.id)}>
                  {i.name}
                </option>
              ))}
            </select>
          </label>

          {error && (
            <p id="profile-error" className="sr-only">
              {error}
            </p>
          )}

          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? <Spinner size={18} /> : 'Enregistrer les modifications'}
          </button>
        </form>
      </main>
    </div>
  )
}
