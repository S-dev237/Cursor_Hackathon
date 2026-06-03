import api from './axios.js'
import {
  isMockMode,
  mockSearchDocuments,
  mockGetDocument,
  mockGetMyDocuments,
  mockSubmitDocument,
  mockUpdateDocument,
  mockGetDownloadUrl,
  mockGetCitation,
  mockGetStats,
  mockGetDomains,
  mockGetInstitutions,
  mockGetAdminQueue,
  mockReviewDocument,
  mockRegisterView,
} from '../mocks/mockApi.js'

function toError(err) {
  return err.response?.data?.detail || 'Erreur réseau'
}

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

export async function searchDocuments(params = {}) {
  if (isMockMode()) return mockSearchDocuments(params)
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
  if (isMockMode()) return mockGetDocument(id)
  try {
    const { data } = await api.get(`/documents/${id}`)
    return { data, error: null }
  } catch (err) {
    return { data: null, error: toError(err), status: err.response?.status }
  }
}

export async function getMyDocuments() {
  if (isMockMode()) return mockGetMyDocuments()
  try {
    const { data } = await api.get('/documents/my')
    return { data, error: null }
  } catch (err) {
    return { data: null, error: toError(err) }
  }
}

export async function submitDocument(file, metadata = {}) {
  if (isMockMode()) return mockSubmitDocument(file, metadata)
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
  if (isMockMode()) return mockUpdateDocument(id, payload)
  try {
    const { data } = await api.put(`/documents/${id}`, payload)
    return { data, error: null }
  } catch (err) {
    return { data: null, error: toError(err) }
  }
}

export function registerView(id) {
  if (isMockMode()) {
    mockRegisterView(id)
    return
  }
  api.post(`/documents/${id}/view`).catch(() => {})
}

export function getDownloadUrl(id) {
  if (isMockMode()) return mockGetDownloadUrl(id)
  const base = import.meta.env.VITE_API_URL || 'http://localhost:8000'
  return `${base}/documents/${id}/download`
}

export async function getCitation(id, format = 'bibtex') {
  if (isMockMode()) return mockGetCitation(id, format)
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
  if (isMockMode()) return mockGetStats()
  try {
    const { data } = await api.get('/stats')
    return { data, error: null }
  } catch (err) {
    return { data: null, error: toError(err) }
  }
}

export async function getDomains() {
  if (isMockMode()) return mockGetDomains()
  try {
    const { data } = await api.get('/domains')
    return { data, error: null }
  } catch (err) {
    return { data: null, error: toError(err) }
  }
}

export async function getInstitutions() {
  if (isMockMode()) return mockGetInstitutions()
  try {
    const { data } = await api.get('/institutions')
    return { data, error: null }
  } catch (err) {
    return { data: null, error: toError(err) }
  }
}

export async function getAdminQueue(params = {}) {
  if (isMockMode()) return mockGetAdminQueue(params)
  try {
    const { data } = await api.get('/admin/queue', { params })
    return { data, error: null }
  } catch (err) {
    return { data: null, error: toError(err) }
  }
}

export async function reviewDocument(id, payload) {
  if (isMockMode()) return mockReviewDocument(id, payload)
  try {
    const { data } = await api.patch(`/admin/documents/${id}/review`, payload)
    return { data, error: null }
  } catch (err) {
    return { data: null, error: toError(err) }
  }
}
