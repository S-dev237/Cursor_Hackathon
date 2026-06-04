import { useState } from 'react'
import clsx from 'clsx'

function EyeIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M2.4 12S5.7 5.8 12 5.8 21.6 12 21.6 12 18.3 18.2 12 18.2 2.4 12 2.4 12Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="2.9" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  )
}

function EyeOffIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M10.7 6A9.9 9.9 0 0112 5.8c6.3 0 9.6 6.2 9.6 6.2a16.6 16.6 0 01-3.2 3.8M6.3 7.7A16.5 16.5 0 002.4 12S5.7 18.2 12 18.2c1.2 0 2.3-.2 3.3-.6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.9 9.9a3 3 0 004.2 4.2"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M4 4l16 16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

/**
 * Champ mot de passe avec bascule afficher/masquer et alerte Verr. Maj.
 */
export default function PasswordInput({ id, className, capsLockWarning = true, ...props }) {
  const [visible, setVisible] = useState(false)
  const [capsLock, setCapsLock] = useState(false)
  const [focused, setFocused] = useState(false)

  const detectCaps = (e) => {
    if (typeof e.getModifierState === 'function') {
      setCapsLock(e.getModifierState('CapsLock'))
    }
  }

  return (
    <div>
      <div className="relative">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          className={clsx('input-base pr-11', className)}
          onKeyDown={detectCaps}
          onKeyUp={detectCaps}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-pressed={visible}
          aria-label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
          title={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
          className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-gray-400 transition-[color,transform] duration-150 ease-premium hover:text-gray-600 focus-visible:text-teal-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/30 active:scale-95 dark:text-gray-500 dark:hover:text-gray-300 dark:focus-visible:text-teal-300"
        >
          {visible ? <EyeOffIcon className="h-[18px] w-[18px]" /> : <EyeIcon className="h-[18px] w-[18px]" />}
        </button>
      </div>

      {capsLockWarning && capsLock && focused && (
        <p className="mt-1.5 flex items-center gap-1.5 text-[11px] font-medium text-amber-600 dark:text-amber-400">
          <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5" aria-hidden="true">
            <path d="M12 4l7 7h-4v5H9v-5H5l7-7Z" fill="currentColor" />
            <rect x="9" y="18" width="6" height="2" rx="0.6" fill="currentColor" />
          </svg>
          Verrouillage des majuscules activé
        </p>
      )}
    </div>
  )
}
