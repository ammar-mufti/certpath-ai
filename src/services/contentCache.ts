import { useAuthStore } from '../store/authStore'

const CACHE_VERSION = '2.0'

interface CacheEntry {
  data: unknown
  generatedAt: number
  version: string
  domain: string
  type: string
}

function getUserId(): string {
  return useAuthStore.getState().user?.id ?? 'anonymous'
}

function buildKey(certId: string, domain: string, type: string): string {
  return `${getUserId()}_${certId}_${domain}_${type}`
}

// MIGRATION: Legacy bare ccxp_{Domain}_{type} keys → ccxp_ccxp_{Domain}_{type} (certId-prefixed format).
// Safe to remove once no user has bare ccxp_{Domain}_ keys remaining in localStorage.
function migrateLegacyCacheKeys() {
  const legacyDomains = [
    'CX Strategy',
    'Customer-Centric Culture',
    'Voice of Customer',
    'Experience Design',
    'Metrics & Measurement',
    'Organizational Adoption',
  ]

  Object.keys(localStorage).forEach(key => {
    for (const domain of legacyDomains) {
      const legacyPrefix = `ccxp_${domain}_`
      if (key.startsWith(legacyPrefix) && !key.startsWith('ccxp_ccxp_')) {
        const newKey = 'ccxp_' + key
        const value = localStorage.getItem(key)
        if (value) {
          localStorage.setItem(newKey, value)
          localStorage.removeItem(key)
        }
      }
    }
  })
}

migrateLegacyCacheKeys()

export const contentCache = {
  get<T>(certId: string, domain: string, type: string): T | null {
    const key = buildKey(certId, domain, type)
    try {
      const raw = localStorage.getItem(key)
      if (!raw) return null
      const entry = JSON.parse(raw) as CacheEntry
      if (entry.version !== CACHE_VERSION) {
        localStorage.removeItem(key)
        return null
      }
      return entry.data as T
    } catch {
      return null
    }
  },

  set(certId: string, domain: string, type: string, data: unknown): void {
    const key = buildKey(certId, domain, type)
    const entry: CacheEntry = { data, generatedAt: Date.now(), version: CACHE_VERSION, domain, type }
    try {
      localStorage.setItem(key, JSON.stringify(entry))
    } catch {
      // localStorage full — evict oldest 3 stage entries
      const entries = Object.keys(localStorage)
        .filter(k => k.includes('_stage'))
        .map(k => {
          try {
            const e = JSON.parse(localStorage.getItem(k) ?? '{}') as { generatedAt?: number }
            return { key: k, generatedAt: e.generatedAt ?? 0 }
          } catch {
            return { key: k, generatedAt: 0 }
          }
        })
        .sort((a, b) => a.generatedAt - b.generatedAt)
      entries.slice(0, 3).forEach(e => localStorage.removeItem(e.key))
      try {
        localStorage.setItem(key, JSON.stringify(entry))
      } catch { /* silent */ }
    }
  },

  hasContent(certId: string, domain: string): boolean {
    const userId = getUserId()
    return !!(
      localStorage.getItem(`${userId}_${certId}_${domain}_stage1-summary`) &&
      localStorage.getItem(`${userId}_${certId}_${domain}_stage2-concepts`)
    )
  },

  getGeneratedDate(certId: string, domain: string): string | null {
    try {
      const key = buildKey(certId, domain, 'stage1-summary')
      const raw = localStorage.getItem(key)
      if (!raw) return null
      const entry = JSON.parse(raw) as CacheEntry
      return new Date(entry.generatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    } catch {
      return null
    }
  },

  clearContent(): void {
    const userId = getUserId()
    Object.keys(localStorage)
      .filter(k => k.startsWith(`${userId}_`))
      .filter(k =>
        !k.includes('_learn_progress') &&
        !k.includes('_exam_history') &&
        !k.includes('_exam_date') &&
        !k.includes('_plan_checks')
      )
      .filter(k => k.includes('_stage'))
      .forEach(k => localStorage.removeItem(k))
  },

  clearCert(certId: string): void {
    const userId = getUserId()
    Object.keys(localStorage)
      .filter(k => k.startsWith(`${userId}_${certId}_`) && k.includes('_stage'))
      .forEach(k => localStorage.removeItem(k))
  },

  clearDomain(certId: string, domain: string): void {
    const userId = getUserId()
    Object.keys(localStorage)
      .filter(k => k.startsWith(`${userId}_${certId}_${domain}_`))
      .forEach(k => localStorage.removeItem(k))
  },
}
