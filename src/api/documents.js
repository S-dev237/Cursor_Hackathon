import api from './axios.js'

function toError(err) {
  return err.response?.data?.detail || 'Erreur réseau'
}

// Sérialise les params : ignore les valeurs vides, répète les clés pour les tableaux
function serializeParams(params) {
  const usp = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return
    if (Array.isArray(value)) {
      value.forEach((item) => item !== '' && usp.append(key, item))
    } else {
      usp.append(key, value)
    }
  })
  return usp.toString()
}

// GET /search avec filtres → { documents, total, page, per_page }
export async function searchDocuments(params = {}) {
  try {
    const { data } = await api.get('/search', {
      params,
      paramsSerializer: serializeParams,
    })
    return { data, error: null }
  } catch (err) {
    return { data: null, error: toError(err) }
  }
}

export async function getDocument(id) {
  try {
    const { data } = await api.get(`/documents/${id}`)
    return { data, error: null }
  } catch (err) {
    return { data: null, error: toError(err), status: err.response?.status }
  }
}

// Soumissions de l'utilisateur connecté
export async function getMyDocuments() {
  try {
    const { data } = await api.get('/documents/my')
    return { data, error: null }
  } catch (err) {
    return { data: null, error: toError(err) }
  }
}

// Upload multipart : file + metadata JSON
export async function submitDocument(file, metadata = {}) {
  try {
    const form = new FormData()
    form.append('file', file)
    if (metadata && Object.keys(metadata).length > 0) {
      form.append('metadata', JSON.stringify(metadata))
    }
    const { data } = await api.post('/documents/', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return { data, error: null }
  } catch (err) {
    return { data: null, error: toError(err) }
  }
}

export async function updateDocument(id, payload) {
  try {
    const { data } = await api.put(`/documents/${id}`, payload)
    return { data, error: null }
  } catch (err) {
    return { data: null, error: toError(err) }
  }
}

// Fire & forget — pas de gestion d'erreur attendue
export function registerView(id) {
  api.post(`/documents/${id}/view`).catch(() => {})
}

export function getDownloadUrl(id) {
  const base = import.meta.env.VITE_API_URL || 'http://localhost:8000'
  return `${base}/documents/${id}/download`
}

export async function getCitation(id, format = 'bibtex') {
  try {
    const { data } = await api.get(`/documents/${id}/citation`, {
      params: { format },
    })
    return { data, error: null }
  } catch (err) {
    return { data: null, error: toError(err) }
  }
}

export async function getStats() {
  try {
    const { data } = await api.get('/stats')
    return { data, error: null }
  } catch (err) {
    return { data: null, error: toError(err) }
  }
}

export async function getDomains() {
  try {
    const { data } = await api.get('/domains')
    return { data, error: null }
  } catch (err) {
    return { data: null, error: toError(err) }
  }
}

export async function getInstitutions() {
  try {
    const { data } = await api.get('/institutions')
    return { data, error: null }
  } catch (err) {
    return { data: null, error: toError(err) }
  }
}

// ADMIN
export async function getAdminQueue(params = {}) {
  try {
    const { data } = await api.get('/admin/queue', { params })
    return { data, error: null }
  } catch (err) {
    return { data: null, error: toError(err) }
  }
}

export async function reviewDocument(id, payload) {
  try {
    const { data } = await api.patch(`/admin/documents/${id}/review`, payload)
    return { data, error: null }
  } catch (err) {
    return { data: null, error: toError(err) }
  }
}
