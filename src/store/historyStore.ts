import { create } from 'zustand'
import { useAuthStore } from './authStore'
import type { ExamAttempt, DomainScore, WrongQuestion } from '../types/history'

const MAX_ATTEMPTS = 50

function historyKey(): string {
  const userId = useAuthStore.getState().user?.id ?? 'anonymous'
  return `certpath_history_${userId}`
}

function load(): ExamAttempt[] {
  try {
    const data = localStorage.getItem(historyKey())
    if (data) return JSON.parse(data)
    // MIGRATION: Legacy shared certpath_exam_history → user-scoped key.
    const legacy = localStorage.getItem('certpath_exam_history')
    if (legacy) {
      const parsed = JSON.parse(legacy) as ExamAttempt[]
      localStorage.setItem(historyKey(), JSON.stringify(parsed))
      return parsed
    }
    // MIGRATION: Even older ccxp_exam_history key.
    const veryLegacy = localStorage.getItem('ccxp_exam_history')
    if (veryLegacy) {
      const parsed = JSON.parse(veryLegacy) as Omit<ExamAttempt, 'certId' | 'certName'>[]
      const migrated: ExamAttempt[] = parsed.map(a => ({ ...a, certId: 'ccxp', certName: 'CCXP' }))
      localStorage.setItem(historyKey(), JSON.stringify(migrated))
      return migrated
    }
    return []
  } catch {
    return []
  }
}

function save(attempts: ExamAttempt[]) {
  localStorage.setItem(historyKey(), JSON.stringify(attempts))
}

interface HistoryState {
  attempts: ExamAttempt[]
  loadForUser: () => void
  addAttempt: (attempt: ExamAttempt) => void
  setAiAnalysis: (id: string, analysis: string) => void
  clearHistory: () => void
  getBestScore: (certId?: string, mode?: string) => number | null
  getLatestScore: (certId?: string, mode?: string) => number | null
  getAverageScore: (certId?: string, mode?: string) => number | null
  getTrend: (certId?: string, mode?: string) => ExamAttempt[]
  getDomainTrend: (domain: string, certId?: string) => { date: string; pct: number }[]
}

export const useHistoryStore = create<HistoryState>((set, get) => ({
  attempts: load(),

  loadForUser() {
    set({ attempts: load() })
  },

  addAttempt(attempt) {
    const key = historyKey()
    const existing = JSON.parse(localStorage.getItem(key) ?? '[]') as ExamAttempt[]
    const updated = [attempt, ...existing].slice(0, MAX_ATTEMPTS)
    localStorage.setItem(key, JSON.stringify(updated))
    set({ attempts: updated })
  },

  setAiAnalysis(id, analysis) {
    set(state => {
      const attempts = state.attempts.map(a => a.id === id ? { ...a, aiAnalysis: analysis } : a)
      save(attempts)
      return { attempts }
    })
  },

  clearHistory() {
    localStorage.removeItem(historyKey())
    set({ attempts: [] })
  },

  getBestScore(certId, mode) {
    const attempts = get().attempts.filter(a =>
      (!certId || a.certId === certId) && (!mode || a.mode === mode)
    )
    if (!attempts.length) return null
    return Math.max(...attempts.map(a => a.pct))
  },

  getLatestScore(certId, mode) {
    const attempts = get().attempts.filter(a =>
      (!certId || a.certId === certId) && (!mode || a.mode === mode)
    )
    return attempts[0]?.pct ?? null
  },

  getAverageScore(certId, mode) {
    const attempts = get().attempts.filter(a =>
      (!certId || a.certId === certId) && (!mode || a.mode === mode)
    )
    if (!attempts.length) return null
    return Math.round(attempts.reduce((s, a) => s + a.pct, 0) / attempts.length)
  },

  getTrend(certId, mode) {
    return get().attempts
      .filter(a => (!certId || a.certId === certId) && (!mode || a.mode === mode))
      .slice(0, 10)
      .reverse()
  },

  getDomainTrend(domain, certId) {
    return get().attempts
      .filter(a =>
        (!certId || a.certId === certId) &&
        a.domainScores.some(d => d.domain === domain)
      )
      .slice(0, 10)
      .reverse()
      .map(a => {
        const ds = a.domainScores.find(d => d.domain === domain)
        return { date: a.date, pct: ds?.pct ?? 0 }
      })
  },
}))

export function buildDomainScores(
  questions: { id: string; domain: string; correct: string }[],
  answers: Record<string, string>
): DomainScore[] {
  const domains = [...new Set(questions.map(q => q.domain))]
  return domains.map(domain => {
    const qs = questions.filter(q => q.domain === domain)
    const correct = qs.filter(q => answers[q.id] === q.correct).length
    return { domain, correct, total: qs.length, pct: Math.round((correct / qs.length) * 100) }
  })
}

export type { WrongQuestion }
