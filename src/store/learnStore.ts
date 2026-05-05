import { create } from 'zustand'
import { useAuthStore } from './authStore'
import { getCert } from '../data/certifications'

export interface TopicContent {
  topic: string
  explanation: string
  example: string
  examTrap: string
  keyTerms: { term: string; definition: string }[]
}

export interface Flashcard {
  front: string
  back: string
  why: string
}

export interface QuizQuestion {
  q: string
  a: string
  b: string
  c: string
  d: string
  correct: string
  explanation: string
}

interface DomainProgress {
  topicsRead: string[]
  flashcardsKnown: number[]
  quizScore: number | null
}

// Progress keyed by `${certId}::${domain}`
interface LearnState {
  activeDomain: string | null
  activeTab: Record<string, number>
  progress: Record<string, DomainProgress>
  setActiveDomain: (domain: string) => void
  setActiveTab: (domain: string, tab: number) => void
  markTopicRead: (certId: string, domain: string, topic: string) => void
  getReadTopics: (certId: string, domain: string) => string[]
  markFlashcardKnown: (domain: string, index: number) => void
  setQuizScore: (domain: string, score: number) => void
  getDomainProgress: (certId: string, domain: string) => number
  resetProgress: () => void
  loadForUser: () => void
}

function getUserId(): string {
  return useAuthStore.getState().user?.id ?? 'anonymous'
}

function storageKey(): string {
  return `${getUserId()}_learn_progress`
}

function loadProgress(): Record<string, DomainProgress> {
  try {
    const data = localStorage.getItem(storageKey())
    if (data) return JSON.parse(data)
    // MIGRATION: Legacy certpath_learn_progress → user-scoped key.
    // Pull from legacy key and migrate on first load.
    const legacy = localStorage.getItem('certpath_learn_progress')
    if (legacy) {
      const parsed = JSON.parse(legacy) as Record<string, DomainProgress>
      localStorage.setItem(storageKey(), JSON.stringify(parsed))
      return parsed
    }
    // MIGRATION: Even older ccxp_learn_progress key.
    const veryLegacy = localStorage.getItem('ccxp_learn_progress')
    if (veryLegacy) {
      const parsed = JSON.parse(veryLegacy) as Record<string, DomainProgress>
      const migrated: Record<string, DomainProgress> = {}
      for (const [k, v] of Object.entries(parsed)) {
        migrated[`ccxp::${k}`] = v
      }
      localStorage.setItem(storageKey(), JSON.stringify(migrated))
      return migrated
    }
    return {}
  } catch {
    return {}
  }
}

function saveProgress(p: Record<string, DomainProgress>) {
  localStorage.setItem(storageKey(), JSON.stringify(p))
}

function progressKey(certId: string, domain: string) {
  return `${certId}::${domain}`
}

export const useLearnStore = create<LearnState>((set, get) => ({
  activeDomain: null,
  activeTab: {},
  progress: loadProgress(),

  loadForUser() {
    set({ progress: loadProgress(), activeTab: {} })
  },

  setActiveDomain(domain) {
    set({ activeDomain: domain })
  },

  setActiveTab(domain, tab) {
    set(state => ({ activeTab: { ...state.activeTab, [domain]: tab } }))
  },

  getReadTopics(certId, domain) {
    const key = progressKey(certId, domain)
    return get().progress[key]?.topicsRead ?? []
  },

  markTopicRead(certId, domain, topic) {
    const key = progressKey(certId, domain)
    set(state => {
      const p = { ...state.progress }
      if (!p[key]) p[key] = { topicsRead: [], flashcardsKnown: [], quizScore: null }
      if (!p[key].topicsRead.includes(topic)) {
        p[key] = { ...p[key], topicsRead: [...p[key].topicsRead, topic] }
      }
      saveProgress(p)
      return { progress: p }
    })
  },

  markFlashcardKnown(domain, index) {
    set(state => {
      const p = { ...state.progress }
      if (!p[domain]) p[domain] = { topicsRead: [], flashcardsKnown: [], quizScore: null }
      const known = p[domain].flashcardsKnown
      if (!known.includes(index)) {
        p[domain] = { ...p[domain], flashcardsKnown: [...known, index] }
      }
      saveProgress(p)
      return { progress: p }
    })
  },

  setQuizScore(domain, score) {
    set(state => {
      const p = { ...state.progress }
      if (!p[domain]) p[domain] = { topicsRead: [], flashcardsKnown: [], quizScore: null }
      p[domain] = { ...p[domain], quizScore: score }
      saveProgress(p)
      return { progress: p }
    })
  },

  resetProgress() {
    localStorage.removeItem(storageKey())
    set({ progress: {}, activeTab: {} })
  },

  getDomainProgress(certId, domain) {
    const key = progressKey(certId, domain)
    const p = get().progress[key]
    if (!p) return 0
    // Use cert registry for topic count — works for any cert, not just CCXP
    const cert = getCert(certId)
    const certDomain = cert?.domains.find(d => d.name === domain)
    const topicCount = certDomain?.topics.length ?? 5
    const topicsScore = Math.min((p.topicsRead.length / topicCount) * 60, 60)
    const flashScore = Math.min((p.flashcardsKnown.length / 10) * 20, 20)
    const quizScore = p.quizScore !== null ? (p.quizScore / 5) * 20 : 0
    return Math.round(topicsScore + flashScore + quizScore)
  },
}))

