import api from './axios.js'
import {
  isMockMode,
  mockExtractMetadata,
  mockTranslateDocument,
} from '../mocks/mockApi.js'

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

/**
 * Traduit les métadonnées affichées d'un document (titre, résumé, mots-clés).
 * @param {string} documentId
 * @param {'fr'|'en'} targetLang
 * @returns {Promise<{data: {title, abstract, keywords, target_lang, simulated?: boolean}|null, error: string|null}>}
 */
export async function translateDocument(documentId, targetLang = 'en') {
  if (isMockMode()) return mockTranslateDocument(documentId, targetLang)
  try {
    const { data } = await api.post('/ai/translate', {
      document_id: documentId,
      target_lang: targetLang,
    })
    return { data, error: null }
  } catch (err) {
    return { data: null, error: err.response?.data?.detail || 'Erreur réseau' }
  }
}
