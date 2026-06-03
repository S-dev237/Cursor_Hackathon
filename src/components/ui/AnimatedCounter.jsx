import { useEffect } from 'react'
import { animate, motion, useMotionValue, useTransform } from 'framer-motion'

/** Compteur animé de 0 → value (framer-motion). */
export default function AnimatedCounter({ value, duration = 1.5, className = '' }) {
  const motionValue = useMotionValue(0)
  const display = useTransform(motionValue, (v) =>
    Math.round(v).toLocaleString('fr-FR'),
  )

  useEffect(() => {
    if (typeof value !== 'number' || Number.isNaN(value)) return undefined
    const controls = animate(motionValue, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
    })
    return () => controls.stop()
  }, [value, motionValue, duration])

  if (typeof value !== 'number' || Number.isNaN(value)) {
    return <span className={className}>—</span>
  }

  return <motion.span className={className}>{display}</motion.span>
}
