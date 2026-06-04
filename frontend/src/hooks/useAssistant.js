import { useContext } from 'react'
import { AssistantContext } from '../contexts/AssistantContext.jsx'

export function useAssistant() {
  const ctx = useContext(AssistantContext)
  if (!ctx) {
    throw new Error('useAssistant doit être utilisé dans un <AssistantProvider>')
  }
  return ctx
}
