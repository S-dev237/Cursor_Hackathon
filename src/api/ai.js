import api from './axios.js'

// POST /ai/extract-metadata { document_id }
// → { title, authors, abstract, keywords, domain_suggestion, confidence }
export async function extractMetadata(documentId) {
  try {
    const { data } = await api.post('/ai/extract-metadata', {
      document_id: documentId,
    })
    return { data, error: null }
  } catch (err) {
    return { data: null, error: err.response?.data?.detail || 'Erreur réseau' }
  }
}
