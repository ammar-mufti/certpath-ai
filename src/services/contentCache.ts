const CACHE_VERSION = '2.0'

interface CacheEntry {
  data: unknown
  generatedAt: number
  version: string
  domain: string
  type: string
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
        // Intentional double-prefix: old key is ccxp_{Domain}_{type}, new key is ccxp_ccxp_{Domain}_{type}
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
  get<T>(key: string): T | null {
    try {
      const raw = localStorage.getItem(key)
      if (!raw) return null
      const entry: CacheEntry = JSON.parse(raw)
      if (entry.version !== CACHE_VERSION) {
        localStorage.removeItem(key)
        return null
      }
      return entry.data as T
    } catch {
      return null
    }
  },

  set(key: string, data: unknown, domain: string, type: string): void {
    try {
      const entry: CacheEntry = { data, generatedAt: Date.now(), version: CACHE_VERSION, domain, type }
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
        localStorage.setItem(key, JSON.stringify({ data, generatedAt: Date.now(), version: CACHE_VERSION, domain, type }))
      } catch { /* silent */ }
    }
  },

  hasContent(certId: string, domain: string): boolean {
    return !!(
      localStorage.getItem(`${certId}_${domain}_stage1-summary`) &&
      localStorage.getItem(`${certId}_${domain}_stage2-concepts`)
    )
  },

  getGeneratedDate(certId: string, domain: string): string | null {
    try {
      const raw = localStorage.getItem(`${certId}_${domain}_stage1-summary`)
      if (!raw) return null
      const entry = JSON.parse(raw) as CacheEntry
      return new Date(entry.generatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    } catch {
      return null
    }
  },

  clearContent(): void {
    Object.keys(localStorage)
      .filter(k =>
        !k.endsWith('_exam_history') &&
        !k.includes('_learn_progress') &&
        !k.includes('_exam_date') &&
        !k.includes('_plan_checks') &&
        !k.endsWith('_question_bank') &&
        !k.endsWith('_waitlist')
      )
      .filter(k => k.includes('_stage') || k.match(/^[a-z-]+_[^_]/))
      .forEach(k => localStorage.removeItem(k))
  },

  clearCert(certId: string): void {
    Object.keys(localStorage)
      .filter(k => k.startsWith(`${certId}_`) && k.includes('_stage'))
      .forEach(k => localStorage.removeItem(k))
  },

  clearDomain(certId: string, domain: string): void {
    Object.keys(localStorage)
      .filter(k => k.startsWith(`${certId}_${domain}_`))
      .forEach(k => localStorage.removeItem(k))
  },
}

