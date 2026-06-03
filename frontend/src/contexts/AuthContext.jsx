import { createContext, useState, useEffect, useCallback } from 'react'
import * as authApi from '../api/auth.js'
import { STORAGE_KEYS } from '../constants/colors.js'

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem(STORAGE_KEYS.user)
    return raw ? JSON.parse(raw) : null
  })
  const [token, setToken] = useState(() =>
    localStorage.getItem(STORAGE_KEYS.token),
  )
  const [loading, setLoading] = useState(true)

  const persist = useCallback((nextToken, nextUser) => {
    if (nextToken) {
      localStorage.setItem(STORAGE_KEYS.token, nextToken)
    } else {
      localStorage.removeItem(STORAGE_KEYS.token)
    }
    if (nextUser) {
      localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(nextUser))
    } else {
      localStorage.removeItem(STORAGE_KEYS.user)
    }
    setToken(nextToken || null)
    setUser(nextUser || null)
  }, [])

  // Au montage : si token présent, réhydrate l'utilisateur via /auth/me
  useEffect(() => {
    let active = true
    async function rehydrate() {
      if (!token) {
        setLoading(false)
        return
      }
      const { data, error } = await authApi.getMe()
      if (!active) return
      if (data && !error) {
        persist(token, data)
      } else {
        persist(null, null)
      }
      setLoading(false)
    }
    rehydrate()
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const login = useCallback(
    async (email, password) => {
      const { data, error } = await authApi.login(email, password)
      if (data && !error) {
        persist(data.access_token, data.user)
        return { error: null }
      }
      return { error: error || 'Identifiants invalides' }
    },
    [persist],
  )

  const register = useCallback(
    async (payload) => {
      const { data, error } = await authApi.register(payload)
      if (data && !error) {
        persist(data.access_token, data.user)
        return { error: null }
      }
      return { error: error || 'Inscription impossible' }
    },
    [persist],
  )

  const logout = useCallback(() => {
    persist(null, null)
  }, [persist])

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    login,
    register,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
