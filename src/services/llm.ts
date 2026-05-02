export { callLLM } from './groq'
export type { LLMPayload } from './groq'

export function extractJson<T>(raw: unknown, shape: 'array' | 'object'): T | null {
  if (shape === 'array') {
    if (Array.isArray(raw) && raw.length > 0) return raw as T
    if (raw && typeof raw === 'object') {
      if ('data' in raw && Array.isArray((raw as { data: unknown }).data)) {
        const arr = (raw as { data: unknown[] }).data
        if (arr.length > 0) return arr as T
      }
      if ('content' in raw && typeof (raw as { content: unknown }).content === 'string') {
        return extractJson<T>((raw as { content: string }).content, shape)
      }
    }
    if (typeof raw === 'string' && raw.length > 0) {
      try {
        const cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()
        const match = cleaned.match(/\[[\s\S]*\]/)
        if (match) {
          const parsed = JSON.parse(match[0])
          if (Array.isArray(parsed) && parsed.length > 0) return parsed as T
        }
      } catch { /* fall through */ }
    }
    return null
  }

  // shape === 'object'
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) return raw as T
  if (raw && typeof raw === 'object' && 'data' in raw) return (raw as { data: T }).data
  if (typeof raw === 'string' && raw.length > 0) {
    try {
      const cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()
      const match = cleaned.match(/\{[\s\S]*\}/)
      if (match) return JSON.parse(match[0]) as T
    } catch { /* fall through */ }
  }
  return null
}
