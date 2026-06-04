import { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import { STORAGE_KEYS } from '../constants/colors.js'

/** @typedef {'light' | 'dark'} Theme */

// eslint-disable-next-line react-refresh/only-export-components
export const ThemeContext = createContext(null)

function readStoredTheme() {
  const stored = localStorage.getItem(STORAGE_KEYS.theme)
  if (stored === 'light' || stored === 'dark') return stored
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark'
  return 'light'
}

function applyTheme(theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
  document.documentElement.style.colorScheme = theme
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', theme === 'dark' ? '#060E18' : '#0B1929')
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => readStoredTheme())

  useEffect(() => {
    applyTheme(theme)
    localStorage.setItem(STORAGE_KEYS.theme, theme)
  }, [theme])

  const setTheme = useCallback((next) => {
    setThemeState(next)
  }, [])

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }, [])

  const value = useMemo(
    () => ({
      theme,
      isDark: theme === 'dark',
      setTheme,
      toggleTheme,
    }),
    [theme, setTheme, toggleTheme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
