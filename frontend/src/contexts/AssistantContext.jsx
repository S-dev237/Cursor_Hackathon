import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { STORAGE_KEYS } from '../constants/colors.js'
import { buildSystemPrompt } from '../ai/assistantContext.js'
import { isChatConfigured, streamChat } from '../api/chat.js'

// eslint-disable-next-line react-refresh/only-export-components
export const AssistantContext = createContext(null)

const MAX_PERSISTED = 30

const NO_KEY_MESSAGE =
  "Je ne suis pas encore connecté à un moteur d'IA 🔌\n\n" +
  'Pour activer mes réponses, ajoute une clé **Groq** dans `frontend/.env.local` :\n\n' +
  '`VITE_GROQ_API_KEY=ta_clé`\n\n' +
  'puis relance `npm run dev`. En attendant, tu peux explorer la [recherche](/search) ou les [domaines](/domains).'

let counter = 0
function uid() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  counter += 1
  return `msg-${Date.now()}-${counter}`
}

function loadInitial() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.chat)
    const parsed = raw ? JSON.parse(raw) : []
    if (!Array.isArray(parsed)) return []
    return parsed.map((m) => ({ ...m, pending: false }))
  } catch {
    return []
  }
}

export function AssistantProvider({ children }) {
  const [messages, setMessages] = useState(loadInitial)
  const [isOpen, setIsOpen] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)

  const messagesRef = useRef(messages)
  const streamingRef = useRef(false)
  const systemRef = useRef(null)
  const abortRef = useRef(null)

  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  // Persistance (uniquement hors streaming, pour éviter d'écrire à chaque token)
  useEffect(() => {
    if (isStreaming) return
    try {
      localStorage.setItem(
        STORAGE_KEYS.chat,
        JSON.stringify(messages.slice(-MAX_PERSISTED)),
      )
    } catch {
      /* quota dépassé → on ignore */
    }
  }, [messages, isStreaming])

  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])
  const toggle = useCallback(() => setIsOpen((v) => !v), [])

  const patchMessage = useCallback((id, patch) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...patch } : m)),
    )
  }, [])

  const ensureSystem = useCallback(async () => {
    if (!systemRef.current) {
      systemRef.current = await buildSystemPrompt()
    }
    return systemRef.current
  }, [])

  const send = useCallback(
    async (raw) => {
      const text = (raw || '').trim()
      if (!text || streamingRef.current) return

      const assistantId = uid()
      setMessages((prev) => [
        ...prev,
        { id: uid(), role: 'user', content: text },
        { id: assistantId, role: 'assistant', content: '', pending: true },
      ])
      setIsStreaming(true)
      streamingRef.current = true

      // Pas de clé / proxy → message explicatif, sans appel réseau
      if (!isChatConfigured()) {
        patchMessage(assistantId, { content: NO_KEY_MESSAGE, pending: false })
        setIsStreaming(false)
        streamingRef.current = false
        return
      }

      const history = messagesRef.current
        .filter((m) => m.content)
        .map((m) => ({ role: m.role, content: m.content }))

      const controller = new AbortController()
      abortRef.current = controller

      try {
        const system = await ensureSystem()
        await streamChat({
          signal: controller.signal,
          messages: [
            { role: 'system', content: system },
            ...history,
            { role: 'user', content: text },
          ],
          onToken: (token) => {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? { ...m, content: m.content + token, pending: false }
                  : m,
              ),
            )
          },
        })
      } catch (err) {
        if (err?.name === 'AbortError') {
          patchMessage(assistantId, { pending: false })
        } else if (err?.code === 'NO_KEY') {
          patchMessage(assistantId, { content: NO_KEY_MESSAGE, pending: false })
        } else {
          patchMessage(assistantId, {
            content: `⚠️ Désolé, une erreur est survenue : ${err?.message || 'inconnue'}. Réessaie dans un instant.`,
            pending: false,
          })
        }
      } finally {
        setIsStreaming(false)
        streamingRef.current = false
        abortRef.current = null
      }
    },
    [ensureSystem, patchMessage],
  )

  const stop = useCallback(() => {
    abortRef.current?.abort()
  }, [])

  const reset = useCallback(() => {
    abortRef.current?.abort()
    setMessages([])
  }, [])

  const value = useMemo(
    () => ({
      messages,
      isOpen,
      isStreaming,
      isConfigured: isChatConfigured(),
      open,
      close,
      toggle,
      send,
      stop,
      reset,
    }),
    [messages, isOpen, isStreaming, open, close, toggle, send, stop, reset],
  )

  return (
    <AssistantContext.Provider value={value}>
      {children}
    </AssistantContext.Provider>
  )
}
