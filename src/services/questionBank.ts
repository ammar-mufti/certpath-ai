import type { Question } from '../store/examStore'

export interface SavedQuestionSet {
  id: string
  createdAt: string
  mode: 'full' | 'mini' | 'domain'
  label: string
  domains: string[]
  questions: Question[]
  totalCount: number
  timesUsed: number
  lastUsed: string | null
  certId: string
  certName: string
}

const STORAGE_KEY = 'certpath_question_bank'
const MAX_SETS = 10

function loadSets(): SavedQuestionSet[] {
  try {
    // Try new key first, fall back to legacy
    const newData = localStorage.getItem(STORAGE_KEY)
    if (newData) return JSON.parse(newData)
    const legacy = localStorage.getItem('ccxp_question_bank')
    if (legacy) {
      const parsed = JSON.parse(legacy) as Omit<SavedQuestionSet, 'certId' | 'certName'>[]
      const migrated: SavedQuestionSet[] = parsed.map(s => ({
        ...s,
        certId: 'ccxp',
        certName: 'CCXP',
      }))
      localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated))
      return migrated
    }
    return []
  } catch {
    return []
  }
}

function saveSets(sets: SavedQuestionSet[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sets))
}

export const questionBank = {
  save(questions: Question[], mode: string, domains: string[], certId = 'ccxp', certName = 'CCXP'): SavedQuestionSet {
    const sets = loadSets()
    const now = new Date()
    const modeLabel = mode === 'full' ? 'Full Exam' : mode === 'mini' ? 'Mini Drill' : 'Domain Drill'
    const dateLabel = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    const newSet: SavedQuestionSet = {
      id: crypto.randomUUID(),
      createdAt: now.toISOString(),
      mode: mode as SavedQuestionSet['mode'],
      label: `${certName} ${modeLabel} — ${dateLabel}`,
      domains,
      questions,
      totalCount: questions.length,
      timesUsed: 0,
      lastUsed: null,
      certId,
      certName,
    }
    const updated = [newSet, ...sets].slice(0, MAX_SETS)
    saveSets(updated)
    return newSet
  },

  getAll(certId?: string): SavedQuestionSet[] {
    const sets = loadSets()
    if (certId) return sets.filter(s => s.certId === certId)
    return sets
  },

  get(id: string): SavedQuestionSet | null {
    return loadSets().find(s => s.id === id) ?? null
  },

  markUsed(id: string): void {
    const sets = loadSets()
    saveSets(sets.map(s =>
      s.id === id ? { ...s, timesUsed: s.timesUsed + 1, lastUsed: new Date().toISOString() } : s
    ))
  },

  delete(id: string): void {
    saveSets(loadSets().filter(s => s.id !== id))
  },

  hasAny(certId?: string): boolean {
    return loadSets().filter(s => !certId || s.certId === certId).length > 0
  },

  getLatest(mode?: string, certId?: string): SavedQuestionSet | null {
    const sets = loadSets().filter(s => (!certId || s.certId === certId) && (!mode || s.mode === mode))
    return sets[0] ?? null
  },
}
