import { create } from 'zustand'
import type { WrongQuestion } from '../types/history'
import { toTopicSlug } from '../utils/domainUtils'

export interface Question {
  id: string
  q: string
  a: string
  b: string
  c: string
  d: string
  correct: string
  explanation: string
  domain: string
  sourceTopic?: string
  sourceTopicSlug?: string
}

export type ExamMode = 'full' | 'mini' | 'domain'

interface ExamState {
  currentCertId: string | null
  mode: ExamMode | null
  selectedDomain: string | null
  questions: Question[]
  answers: Record<string, string>
  currentIndex: number
  submitted: boolean
  isLoading: boolean
  loadingMessage: string
  error: string | null
  explanations: Record<string, string>
  currentSetId: string | null
  setCertId: (id: string) => void
  setMode: (mode: ExamMode, domain?: string) => void
  setQuestions: (questions: Question[]) => void
  setCurrentSetId: (id: string | null) => void
  answerQuestion: (id: string, answer: string) => void
  navigateTo: (index: number) => void
  submitExam: () => void
  resetExam: () => void
  setLoading: (loading: boolean, message?: string) => void
  setError: (error: string | null) => void
  setExplanation: (id: string, text: string) => void
  buildWrongQuestions: () => WrongQuestion[]
}

export const useExamStore = create<ExamState>((set, get) => ({
  currentCertId: null,
  mode: null,
  selectedDomain: null,
  questions: [],
  answers: {},
  currentIndex: 0,
  submitted: false,
  isLoading: false,
  loadingMessage: 'Generating questions…',
  error: null,
  explanations: {},
  currentSetId: null,

  setCertId(id) {
    set({ currentCertId: id })
  },

  setMode(mode, domain) {
    sessionStorage.removeItem('certpath_timer_seconds')
    set({ mode, selectedDomain: domain ?? null, questions: [], answers: {}, currentIndex: 0, submitted: false, currentSetId: null })
  },

  setCurrentSetId(id) {
    set({ currentSetId: id })
  },

  setQuestions(rawQuestions) {
    const seen = new Set<string>()
    const questions = rawQuestions.filter(q => {
      const key = q.q.trim().toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    set({ questions })
  },

  answerQuestion(id, answer) {
    set(state => ({ answers: { ...state.answers, [id]: answer } }))
  },

  navigateTo(index) {
    set({ currentIndex: index })
  },

  submitExam() {
    set({ submitted: true })
    sessionStorage.removeItem('certpath_exam_session')
  },

  resetExam() {
    set({ mode: null, selectedDomain: null, questions: [], answers: {}, currentIndex: 0, submitted: false, error: null, explanations: {}, currentSetId: null })
    sessionStorage.removeItem('certpath_exam_session')
  },

  setExplanation(id, text) {
    set(state => ({ explanations: { ...state.explanations, [id]: text } }))
  },

  setLoading(loading, message = 'Generating questions…') {
    set({ isLoading: loading, loadingMessage: message })
  },

  setError(error) {
    set({ error })
  },

  buildWrongQuestions(): WrongQuestion[] {
    const { questions, answers, explanations } = get()
    return questions
      .filter(q => answers[q.id] && answers[q.id] !== q.correct)
      .map(q => {
        const userAns = answers[q.id]
        return {
          id: q.id,
          questionText: q.q,
          domain: q.domain,
          sourceTopic: q.sourceTopic ?? q.domain,
          sourceTopicSlug: q.sourceTopicSlug ?? toTopicSlug(q.sourceTopic ?? q.domain),
          userAnswer: userAns,
          userAnswerText: q[userAns as 'a' | 'b' | 'c' | 'd'] ?? '',
          correctAnswer: q.correct,
          correctAnswerText: q[q.correct as 'a' | 'b' | 'c' | 'd'] ?? '',
          explanation: explanations[q.id] ?? q.explanation ?? '',
        }
      })
  },
}))

export const EXAM_DURATIONS: Record<ExamMode, number> = {
  full: 3 * 60 * 60,
  mini: 60 * 60,
  domain: 30 * 60,
}

// Kept as empty stub — consumers updated to use getCert(certId)?.color directly
export const DOMAIN_COLORS: Record<string, string> = {}
