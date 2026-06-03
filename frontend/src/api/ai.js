import api from './axios.js'
import { isMockMode, mockExtractMetadata } from '../mocks/mockApi.js'

export async function extractMetadata(documentId) {
  if (isMockMode()) return mockExtractMetadata(documentId)
  try {
    const { data } = await api.post('/ai/extract-metadata', {
      document_id: documentId,
    })
    return { data, error: null }
  } catch (err) {
    return { data: null, error: err.response?.data?.detail || 'Erreur réseau' }
  }
}
