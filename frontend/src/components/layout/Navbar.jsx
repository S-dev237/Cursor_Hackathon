import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import { useAuth } from '../../hooks/useAuth.js'
import useScrollPosition from '../../hooks/useScrollPosition.js'
import Logo from '../ui/Logo.jsx'
import ThemeToggle from '../ui/ThemeToggle.jsx'

function initials(name = '') {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

const NAV_LINKS = [
  { to: '/search', label: 'Explorer' },
  { to: '/institutions', label: 'Institutions' },
  { to: '/domains', label: 'Domaines' },
]

export default function Navbar() {
  const { user, isAdmin, logout } = useAuth()
  const navigate = useNavigate()
  const scrolled = useScrollPosition()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  const linkClass = ({ isActive }) =>
    clsx(
      'text-sm transition-colors duration-200',
      isActive ? 'text-white' : 'text-white/60 hover:text-white',
    )

  useEffect(() => {
    if (!menuOpen) return undefined
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
    }
    const onKey = (e) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [menuOpen])

  const handleLogout = () => {
    logout()
    navigate('/')
    setMenuOpen(false)
    setMobileOpen(false)
  }

  return (
    <header
      className={clsx(
        'glass-nav transition-all duration-200',
        scrolled && 'bg-navy-900/95 shadow-navy',
      )}
    >
      <div className="mx-auto flex h-12 max-w-7xl items-center gap-6 px-4 sm:px-6">
        <Logo variant="nav" size="sm" />

        <nav className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map(({ to, label }) => (
            <NavLink key={to} to={to} className={linkClass}>
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <ThemeToggle variant="nav" />
          {user ? (
            <>
              {isAdmin && (
                <Link
                  to="/admin"
                  className="hidden rounded-full border border-red-200/30 bg-red-500/10 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-red-300 transition-colors duration-200 hover:bg-red-500/20 sm:inline-flex"
                >
                  Admin
                </Link>
              )}
              <Link
                to="/submit"
                className="inline-flex items-center justify-center rounded-lg bg-teal-500 px-3 py-1.5 text-xs font-medium text-white transition-all duration-200 hover:bg-teal-400 hover:shadow-teal active:scale-[0.98]"
              >
                Soumettre
              </Link>
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setMenuOpen((o) => !o)}
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                  aria-label="Menu utilisateur"
                  className="flex items-center gap-2 rounded-lg text-sm text-white/90 transition-colors duration-200 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/60"
                >
                  <span className="gradient-teal-avatar flex h-7 w-7 items-center justify-center rounded-full font-mono text-[11px] font-medium text-white shadow-sm">
                    {initials(user.full_name)}
                  </span>
                  <span className="hidden sm:inline">
                    {user.full_name?.split(' ')[0]}
                  </span>
                </button>
                {menuOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-xl border border-gray-200/60 bg-white py-1 shadow-card-hover dark:border-navy-700 dark:bg-navy-800"
                  >
                    <Link
                      to="/profile"
                      role="menuitem"
                      onClick={() => setMenuOpen(false)}
                      className="block px-3.5 py-2.5 text-sm text-gray-900 transition-colors duration-200 hover:bg-gray-50 dark:text-gray-100 dark:hover:bg-navy-700"
                    >
                      Mon profil
                    </Link>
                    <Link
                      to="/my-submissions"
                      role="menuitem"
                      onClick={() => setMenuOpen(false)}
                      className="block px-3.5 py-2.5 text-sm text-gray-900 transition-colors duration-200 hover:bg-gray-50 dark:text-gray-100 dark:hover:bg-navy-700"
                    >
                      Mes soumissions
                    </Link>
                    {isAdmin && (
                      <Link
                        to="/admin"
                        role="menuitem"
                        onClick={() => setMenuOpen(false)}
                        className="block px-3.5 py-2.5 text-sm text-gray-900 transition-colors duration-200 hover:bg-gray-50 dark:text-gray-100 dark:hover:bg-navy-700"
                      >
                        Administration
                      </Link>
                    )}
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleLogout}
                      className="block w-full px-3.5 py-2.5 text-left text-sm text-red-700 transition-colors duration-200 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-500/10"
                    >
                      Déconnexion
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-sm text-white/70 transition-colors duration-200 hover:text-white"
              >
                Connexion
              </Link>
              <Link
                to="/submit"
                className="inline-flex items-center justify-center rounded-lg bg-teal-500 px-3 py-1.5 text-xs font-medium text-white transition-all duration-200 hover:bg-teal-400 hover:shadow-teal active:scale-[0.98]"
              >
                Soumettre
              </Link>
            </>
          )}

          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-white/80 transition-colors duration-200 hover:bg-white/10 hover:text-white md:hidden"
            onClick={() => setMobileOpen((o) => !o)}
            aria-expanded={mobileOpen}
            aria-label="Menu"
          >
            {mobileOpen ? (
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
                <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav className="border-t border-white/5 bg-navy-900/95 px-4 py-3 md:hidden">
          <div className="flex flex-col gap-1">
            {NAV_LINKS.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className={linkClass}
                onClick={() => setMobileOpen(false)}
              >
                <span className="block rounded-lg px-3 py-2.5 hover:bg-white/5">
                  {label}
                </span>
              </NavLink>
            ))}
            {isAdmin && user && (
              <Link
                to="/admin"
                className="block rounded-lg px-3 py-2.5 font-mono text-xs uppercase tracking-wider text-red-300 hover:bg-white/5"
                onClick={() => setMobileOpen(false)}
              >
                Admin
              </Link>
            )}
          </div>
        </nav>
      )}
    </header>
  )
}
