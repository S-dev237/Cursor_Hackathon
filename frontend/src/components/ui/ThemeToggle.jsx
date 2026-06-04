import clsx from 'clsx'
import { useTheme } from '../../hooks/useTheme.js'

function SunIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

function MoonIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M21 14.5A8.5 8.5 0 1111.5 4a6.5 6.5 0 1010 10.5z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/**
 * @param {'nav' | 'default'} [variant]
 */
export default function ThemeToggle({ variant = 'default', className = '' }) {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={clsx(
        'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors duration-200',
        variant === 'nav'
          ? 'text-white/75 hover:bg-white/10 hover:text-white'
          : 'border border-gray-200 bg-white text-gray-700 hover:border-teal-300 hover:text-gray-900 dark:border-navy-700 dark:bg-navy-800 dark:text-gray-200 dark:hover:border-teal-500/40 dark:hover:text-white',
        className,
      )}
      aria-label={isDark ? 'Activer le thème clair' : 'Activer le thème sombre'}
      title={isDark ? 'Thème clair' : 'Thème sombre'}
    >
      {isDark ? <SunIcon className="h-[18px] w-[18px]" /> : <MoonIcon className="h-[18px] w-[18px]" />}
    </button>
  )
}
