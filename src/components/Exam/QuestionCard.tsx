import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type { Question } from '../../store/examStore'
import { useExamStore } from '../../store/examStore'
import { useAuthStore } from '../../store/authStore'
import { toDomainSlug } from '../../utils/domainUtils'
import { stripMarker } from '../../utils/stripMarker'

const OPTION_LABELS = ['a', 'b', 'c', 'd'] as const
const WORKER_URL = import.meta.env.VITE_WORKER_URL

interface Props {
  question: Question
  selectedAnswer: string | undefined
  onAnswer: (answer: string) => void
  questionNumber: number
  totalQuestions: number
}

function renderMarkdown(text: string) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/^[•●\-–—*]\s*(.+)$/gm, '<div style="display:flex;gap:8px;margin-top:4px"><span style="color:var(--accent);flex-shrink:0;font-size:10px">●</span><span>$1</span></div>')
    .replace(/\n\n/g, '<div style="margin-top:8px"></div>')
    .replace(/\n/g, '<br/>')
}

export default function QuestionCard({ question, selectedAnswer, onAnswer, questionNumber, totalQuestions }: Props) {
  const { explanations, setExplanation, currentCertId } = useExamStore()
  const token = useAuthStore(s => s.token) ?? ''
  const navigate = useNavigate()
  const { certId: certIdParam } = useParams<{ certId?: string }>()
  const certId = certIdParam ?? currentCertId ?? 'ccxp'
  const [explaining, setExplaining] = useState(false)

  const explanation = explanations[question.id]
  const isWrong = selectedAnswer && selectedAnswer !== question.correct

  async function fetchExplanation() {
    if (explanation || explaining) return
    setExplaining(true)
    try {
      const res = await fetch(`${WORKER_URL}/api/llm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          type: 'explain-question',
          domain: question.domain,
          question: question.q,
          a: question.a, b: question.b, c: question.c, d: question.d,
          correct: question.correct,
          userAnswer: selectedAnswer,
        }),
      })
      if (!res.ok) throw new Error(`${res.status}`)
      const data = await res.json() as { explanation: string }
      setExplanation(question.id, data.explanation ?? 'No explanation available.')
    } catch {
      setExplanation(question.id, 'Could not load explanation — please try again.')
    } finally {
      setExplaining(false)
    }
  }

  function handleStudyTopic() {
    sessionStorage.setItem('certpath_navigate_to_topic', JSON.stringify({
      sourceTopic: question.sourceTopic,
      sourceTopicSlug: question.sourceTopicSlug ?? '',
      domain: question.domain,
      fromQuestion: question.id,
    }))
    navigate(`/${certId}/learn/${toDomainSlug(question.domain)}`)
  }

  return (
    <div className="card" style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <span style={{ color: 'var(--text-2)', fontSize: 13 }}>Question {questionNumber} of {totalQuestions}</span>
        <span style={{
          fontSize: 11, padding: '3px 10px', borderRadius: 9999,
          background: 'var(--bg-raised)', color: 'var(--text-2)',
        }}>
          {question.domain}
        </span>
      </div>

      <p style={{ color: 'var(--text)', fontSize: '1.125rem', lineHeight: 1.7, marginBottom: 24 }}>
        {question.q}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {OPTION_LABELS.map(opt => {
          const text = question[opt]
          const isSelected = selectedAnswer === opt
          return (
            <button
              key={opt}
              onClick={() => onAnswer(opt)}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '1rem',
                borderRadius: 12,
                border: `1px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
                background: isSelected ? 'var(--accent-dim)' : 'var(--bg-raised)',
                color: isSelected ? 'var(--accent)' : 'var(--text-2)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => {
                if (!isSelected) {
                  e.currentTarget.style.borderColor = 'var(--accent)'
                  e.currentTarget.style.color = 'var(--text)'
                }
              }}
              onMouseLeave={e => {
                if (!isSelected) {
                  e.currentTarget.style.borderColor = 'var(--border)'
                  e.currentTarget.style.color = 'var(--text-2)'
                }
              }}
            >
              <span style={{
                fontWeight: 700,
                textTransform: 'uppercase',
                width: 20,
                flexShrink: 0,
                color: isSelected ? 'var(--accent)' : 'var(--text-3)',
              }}>
                {opt}
              </span>
              <span style={{ lineHeight: 1.6 }}>{text}</span>
            </button>
          )
        })}
      </div>

      {selectedAnswer && (
        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {!explanation && (
            <button
              onClick={fetchExplanation}
              disabled={explaining}
              style={{
                width: '100%',
                padding: '10px 16px',
                borderRadius: 12,
                border: '1px solid var(--accent)',
                background: 'transparent',
                color: 'var(--accent)',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
                opacity: explaining ? 0.6 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { if (!explaining) e.currentTarget.style.background = 'var(--accent-dim)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
            >
              {explaining ? (
                <>
                  <span style={{ animation: 'spin 0.6s linear infinite' }}>⟳</span>
                  Generating explanation…
                </>
              ) : (
                <>🧠 Explain this question</>
              )}
            </button>
          )}

          {explanation && (
            <div style={{
              borderRadius: 12,
              border: '1px solid var(--accent)',
              background: 'var(--accent-dim)',
              padding: '1rem',
            }}>
              <div
                style={{ color: 'var(--text)', fontSize: 13, lineHeight: 1.7 }}
                dangerouslySetInnerHTML={{ __html: renderMarkdown(stripMarker(explanation)) }}
              />
            </div>
          )}

          {isWrong && (
            <button
              onClick={handleStudyTopic}
              style={{
                width: '100%',
                padding: '10px 16px',
                borderRadius: 12,
                border: '1px solid var(--border)',
                background: 'transparent',
                color: 'var(--text-2)',
                fontSize: 13,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'var(--accent)'
                e.currentTarget.style.color = 'var(--accent)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--border)'
                e.currentTarget.style.color = 'var(--text-2)'
              }}
            >
              📚 Study {question.sourceTopic ? `"${question.sourceTopic}"` : 'this topic'} →
            </button>
          )}
        </div>
      )}
    </div>
  )
}
