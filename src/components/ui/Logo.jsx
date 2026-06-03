import { Link } from 'react-router-dom'
import clsx from 'clsx'

const SIZES = {
  xs: 'h-7',
  sm: 'h-9',
  md: 'h-12',
  lg: 'h-16',
  xl: 'h-20',
}

/**
 * Logo OpenScience Hub — image officielle (icône + wordmark).
 * @param {'xs'|'sm'|'md'|'lg'|'xl'} size
 * @param {'dark'|'light'} variant — fond derrière le logo (navbar dark = light pad)
 */
export default function Logo({
  size = 'sm',
  variant = 'dark',
  className = '',
  link = true,
}) {
  const img = (
    <img
      src="/logo.png"
      alt="OpenScience Hub"
      className={clsx(
        SIZES[size],
        'w-auto object-contain',
        variant === 'dark' && 'rounded-lg bg-white px-2 py-1 shadow-sm',
        variant === 'light' && 'rounded-lg bg-white/95 px-2 py-1 shadow-sm',
      )}
    />
  )

  const wrapperClass = clsx(
    'inline-flex shrink-0 items-center transition-opacity duration-200 hover:opacity-90',
    className,
  )

  if (!link) {
    return <span className={wrapperClass}>{img}</span>
  }

  return (
    <Link to="/" className={wrapperClass} aria-label="OpenScience Hub — Accueil">
      {img}
    </Link>
  )
}
