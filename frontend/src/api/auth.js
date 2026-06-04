import api from './axios.js'

// L'authentification est toujours servie par le backend réel (module IAM),
// même lorsque le reste de l'application tourne en mode démo (mock).

function toError(err) {
  const detail = err.response?.data?.detail
  if (Array.isArray(detail)) {
    return detail.map((d) => d.msg ?? JSON.stringify(d)).join(', ')
  }
  return detail || 'Erreur réseau'
}

export async function login(email, password) {
  try {
    const { data } = await api.post('/auth/login', { email, password })
    return { data, error: null }
  } catch (err) {
    return { data: null, error: toError(err) }
  }
}

export async function register(payload) {
  try {
    const { data } = await api.post('/auth/register', payload)
    return { data, error: null }
  } catch (err) {
    return { data: null, error: toError(err) }
  }
}

export async function getMe() {
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
