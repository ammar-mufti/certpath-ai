import { useState, useCallback } from 'react'
import { contentCache } from '../services/contentCache'
import { requestQueue } from '../services/requestQueue'
import { useAuthStore } from '../store/authStore'
import { toTopicSlug } from '../utils/domainUtils'
import { getCert } from '../data/certifications'

type Stage = 'stage1-summary' | 'stage2-concepts' | 'stage3-deepdive' | 'stage4-quiz'

interface Options {
  topic?: string
  topics?: string[]
}

export function useStageContent<T>(certId: string, domain: string, stage: Stage, options?: Options) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const token = useAuthStore(s => s.token)

  const cacheKey = stage === 'stage3-deepdive' && options?.topic
    ? `${certId}_${domain}_stage3_${toTopicSlug(options.topic)}`
    : `${certId}_${domain}_${stage}`

  const load = useCallback(async () => {
    if (loading) return

    const cached = contentCache.get<T>(cacheKey)
    if (cached) {
      setData(cached)
      return
    }

    setLoading(true)
    setError(null)

    try {
      if (!token) throw new Error('Not authenticated')
      const workerUrl = import.meta.env.VITE_WORKER_URL as string
      const cert = getCert(certId)

      const requestBody: Record<string, unknown> = {
        type: stage,
        domain,
        certId,
        certName: cert?.name ?? certId,
        certFullName: cert?.fullName ?? certId,
        certIssuer: cert?.issuer ?? '',
        passingScore: cert?.passingScore ?? 70,
        difficulty: cert?.difficulty ?? 'Advanced',
        examQuestions: cert?.examQuestions ?? 100,
      }

      if (stage === 'stage2-concepts') {
        const certDomain = cert?.domains.find(d => d.name === domain)
        requestBody.topics = options?.topics ?? certDomain?.topics ?? []
      }
      if (stage === 'stage3-deepdive') {
        requestBody.topic = options?.topic
      }

      const result = await requestQueue.add(async () => {
        const res = await fetch(`${workerUrl}/api/llm`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(requestBody),
        })
        if (!res.ok) {
          const text = await res.text()
          throw new Error(`Worker error ${res.status}: ${text}`)
        }
        return res.json() as Promise<{ data?: T; error?: string }>
      })

      if (result.error) throw new Error(result.error)
      const content = result.data ?? (result as unknown as T)

      contentCache.set(cacheKey, content, domain, stage)
      setData(content)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load'
      console.error(`[useStageContent] ${certId} ${domain} ${stage}:`, msg)
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [certId, domain, stage, options?.topic, token, cacheKey])

  return { data, loading, error, load }
}
