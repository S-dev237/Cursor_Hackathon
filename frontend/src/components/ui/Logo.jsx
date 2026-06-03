import { Link } from 'react-router-dom'
import clsx from 'clsx'

const HEIGHTS = {
  xs: 28,
  sm: 32,
  md: 48,
  lg: 64,
  xl: 80,
}

const FULL_HEIGHTS = {
  xs: 'h-14',
  sm: 'h-16',
  md: 'h-20',
  lg: 'h-24',
  xl: 'h-28',
}

function LogoMark({ size = 'sm', className = '' }) {
  const px = HEIGHTS[size] ?? HEIGHTS.sm

  return (
    <span
      className={clsx(
        'relative block shrink-0 overflow-hidden rounded-lg ring-1 ring-white/10',
        className,
      )}
      style={{ width: px, height: px }}
      aria-hidden="true"
    >
      {/* Crop : zone icône en haut du logo vertical */}
      <img
        src="/logo.png"
        alt=""
        width={px}
        height={px}
        decoding="async"
        className="absolute left-1/2 top-0 h-[185%] w-auto max-w-none -translate-x-1/2 object-contain object-top"
      />
    </span>
  )
}

function LogoWordmark({ className = '', onDark = true }) {
  return (
    <span className={clsx('font-serif text-[15px] font-semibold leading-tight tracking-tight sm:text-base', className)}>
      <span className={onDark ? 'text-white' : 'text-navy-900'}>OpenScience</span>{' '}
      <span className="text-teal-400">Hub</span>
    </span>
  )
}

/**
 * Logo OpenScience Hub
 * @param {'nav'|'full'|'mark'} variant
 *   - nav    → icône + wordmark horizontal (navbar dark)
 *   - full   → logo PNG complet (login, footer)
 *   - mark   → icône seule
 */
export default function Logo({
  variant = 'nav',
  size = 'sm',
  className = '',
  link = true,
  onDark = true,
}) {
  const wrapperClass = clsx(
    'inline-flex shrink-0 items-center gap-2.5',
    'rounded-lg transition-opacity duration-200 hover:opacity-90',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-900',
    link && 'min-h-[44px] min-w-[44px]',
    className,
  )

  const content =
    variant === 'full' ? (
      <img
        src="/logo.png"
        alt="OpenScience Hub"
        width={160}
        height={64}
        loading={link ? 'eager' : 'lazy'}
        fetchPriority={link ? 'high' : 'auto'}
        decoding="async"
        className={clsx(FULL_HEIGHTS[size] ?? FULL_HEIGHTS.sm, 'w-auto object-contain')}
      />
    ) : variant === 'mark' ? (
      <LogoMark size={size} />
    ) : (
      <>
        <LogoMark size={size} />
        <LogoWordmark onDark={onDark} className="hidden min-[420px]:inline" />
      </>
    )

  if (!link) {
    return <span className={wrapperClass}>{content}</span>
  }

  return (
    <Link to="/" className={wrapperClass} aria-label="OpenScience Hub — Accueil">
      {content}
    </Link>
  )
}
