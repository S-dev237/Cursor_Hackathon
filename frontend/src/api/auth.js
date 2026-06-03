import api from './axios.js'
import { isMockMode, mockGetMe, mockLogin, mockRegister } from '../mocks/mockApi.js'

function toError(err) {
  return err.response?.data?.detail || 'Erreur réseau'
}

export async function login(email, password) {
  if (isMockMode()) return mockLogin(email, password)
  try {
    const { data } = await api.post('/auth/login', { email, password })
    return { data, error: null }
  } catch (err) {
    return { data: null, error: toError(err) }
  }
}

export async function register(payload) {
  if (isMockMode()) return mockRegister(payload)
  try {
    const { data } = await api.post('/auth/register', payload)
    return { data, error: null }
  } catch (err) {
    return { data: null, error: toError(err) }
  }
}

export async function getMe() {
  if (isMockMode()) return mockGetMe()
  try {
    const { data } = await api.get('/auth/me')
    return { data, error: null }
  } catch (err) {
    return { data: null, error: toError(err) }
  }
}

export async function updateMe(payload) {
  try {
    const { data } = await api.put('/auth/me', payload)
    return { data, error: null }
  } catch (err) {
    return { data: null, error: toError(err) }
  }
}
