export interface WrongQuestion {
  id: string
  questionText: string
  domain: string
  sourceTopic: string
  sourceTopicSlug: string
  userAnswer: string
  userAnswerText: string
  correctAnswer: string
  correctAnswerText: string
  explanation: string
}

export interface DomainScore {
  domain: string
  correct: number
  total: number
  pct: number
}

export interface ExamAttempt {
  id: string
  date: string
  mode: 'full' | 'mini' | 'domain'
  selectedDomain: string | null
  score: number
  total: number
  pct: number
  timeTaken: number
  domainScores: DomainScore[]
  wrongQuestions: WrongQuestion[]
  aiAnalysis?: string
  certId: string
  certName: string
}
