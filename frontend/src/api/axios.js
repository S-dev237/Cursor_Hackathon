import axios from 'axios'
import { STORAGE_KEYS } from '../constants/colors.js'

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'

const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
})

// REQUEST: ajoute Authorization: Bearer {token} depuis localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(STORAGE_KEYS.token)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// RESPONSE: si 401 → supprime token + redirige vers /login.
// Les appels « mock » ne passent pas par axios : un 401 provient donc
// toujours d'un véritable appel authentifié au backend.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(STORAGE_KEYS.token)
      localStorage.removeItem(STORAGE_KEYS.user)
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  },
)

export default api
