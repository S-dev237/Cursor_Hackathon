// Client de chat pour OpenScience AI — API Groq (compatible OpenAI), en streaming.
//
// Trois modes détectés automatiquement via les variables d'environnement Vite :
//   1. VITE_CHAT_PROXY_URL → on POST vers ce proxy (la clé reste côté serveur). Recommandé en prod.
//   2. VITE_GROQ_API_KEY   → appel direct au navigateur. Pratique en démo locale.
//   3. aucun des deux      → mode "none" : streamChat lève NO_KEY (message explicatif côté UI).
//
// ⚠️ Sécurité : une variable VITE_* est embarquée dans le bundle client. En mode direct,
// la clé Groq est donc visible par l'utilisateur final → à proxifier avant toute mise en ligne publique.

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'

const trim = (v) => (typeof v === 'string' ? v.trim() : '')

const API_KEY = trim(import.meta.env.VITE_GROQ_API_KEY)
const PROXY_URL = trim(import.meta.env.VITE_CHAT_PROXY_URL)
export const CHAT_MODEL = trim(import.meta.env.VITE_GROQ_MODEL) || 'llama-3.3-70b-versatile'

export function chatMode() {
  if (PROXY_URL) return 'proxy'
  if (API_KEY) return 'direct'
  return 'none'
}

export function isChatConfigured() {
  return chatMode() !== 'none'
}

/**
 * Envoie une conversation et streame la réponse token par token.
 * @param {{ messages: Array<{role:string, content:string}>, onToken?: (t:string)=>void, signal?: AbortSignal }} args
 * @returns {Promise<string>} le texte complet
 */
export async function streamChat({ messages, onToken, signal }) {
  const mode = chatMode()
  if (mode === 'none') {
    const err = new Error('NO_KEY')
    err.code = 'NO_KEY'
    throw err
  }

  const url = mode === 'proxy' ? PROXY_URL : GROQ_URL
  const headers = { 'Content-Type': 'application/json' }
  if (mode === 'direct') headers.Authorization = `Bearer ${API_KEY}`

  const res = await fetch(url, {
    method: 'POST',
    headers,
    signal,
    body: JSON.stringify({
      model: CHAT_MODEL,
      messages,
      temperature: 0.4,
      max_tokens: 1024,
      stream: true,
    }),
  })

  if (!res.ok || !res.body) {
    let detail = ''
    try {
      const data = await res.json()
      detail = data?.error?.message || ''
    } catch {
      /* corps non-JSON */
    }
    throw new Error(detail || `Erreur ${res.status} ${res.statusText}`.trim())
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let full = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    const lines = buffer.split('\n')
    buffer = lines.pop() || '' // garde la dernière ligne potentiellement incomplète

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || !trimmed.startsWith('data:')) continue
      const payload = trimmed.slice(5).trim()
      if (payload === '[DONE]') return full
      try {
        const json = JSON.parse(payload)
        const token = json.choices?.[0]?.delta?.content || ''
        if (token) {
          full += token
          onToken?.(token)
        }
      } catch {
        /* fragment SSE non encore complet → ignoré */
      }
    }
  }

  return full
}
