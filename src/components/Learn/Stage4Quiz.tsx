import { useState } from 'react'
import type { Stage4Question } from '../../types/content'
import { useLearnStore } from '../../store/learnStore'

const OPTS = ['a', 'b', 'c', 'd'] as const

interface Props {
  questions: Stage4Question[]
  domain: string
}

export default function Stage4Quiz({ questions, domain }: Props) {
  const { setQuizScore } = useLearnStore()
  const [started, setStarted] = useState(false)
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState<Record<number, string>>({})
  const [showResult, setShowResult] = useState(false)
  const [finished, setFinished] = useState(false)

  if (!started) {
    return (
      <div className="card" style={{ borderRadius: 16, padding: 24, textAlign: 'center' }}>
        <div style={{ fontSize: '1.875rem', marginBottom: 8 }}>🧩</div>
        <h3 style={{ color: 'var(--text)', fontWeight: 600, marginBottom: 4 }}>Quick Quiz</h3>
        <p style={{ color: 'var(--text-2)', fontSize: 13, marginBottom: 16 }}>{questions.length} questions · Immediate feedback</p>
        <button
          onClick={() => setStarted(true)}
          className="btn btn-primary"
          style={{ fontWeight: 700, padding: '8px 24px' }}
        >
          Start Quiz
        </button>
      </div>
    )
  }

  if (finished) {
    const score = questions.filter((q, i) => selected[i] === q.correct).length
    return (
      <div className="card" style={{ borderRadius: 16, padding: 24, textAlign: 'center' }}>
        <div style={{ fontSize: '2.25rem', marginBottom: 12 }}>{score >= 4 ? '🏆' : score >= 3 ? '👍' : '📚'}</div>
        <div style={{ color: 'var(--text)', fontSize: '1.5rem', fontWeight: 700, marginBottom: 4 }}>{score} / {questions.length}</div>
        <div style={{ color: 'var(--text-2)', fontSize: 13, marginBottom: 20 }}>{score >= 4 ? 'Excellent mastery!' : score >= 3 ? 'Good work — review weak spots' : 'Review the concepts above and retry'}</div>
        <button
          onClick={() => { setCurrent(0); setSelected({}); setShowResult(false); setFinished(false); setStarted(false) }}
          className="btn btn-primary"
          style={{ fontWeight: 700, padding: '8px 24px' }}
        >
          Retake Quiz
        </button>
      </div>
    )
  }

  const q = questions[current]
  const answered = selected[current]

  function choose(opt: string) {
    if (answered) return
    setSelected(p => ({ ...p, [current]: opt }))
    setShowResult(true)
  }

  function next() {
    setShowResult(false)
    if (current < questions.length - 1) {
      setCurrent(c => c + 1)
    } else {
      const score = questions.filter((q, i) => selected[i] === q.correct).length
      setQuizScore(domain, score)
      setFinished(true)
    }
  }

  return (
    <div className="card" style={{ borderRadius: 16, padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <span style={{ color: 'var(--text-2)', fontSize: 13 }}>Question {current + 1} of {questions.length}</span>
        <div style={{ display: 'flex', gap: 4 }}>
          {questions.map((_, i) => (
            <div key={i} style={{
              width: 8, height: 8, borderRadius: '50%', transition: 'all 0.15s',
              ...(i < current ? { background: 'var(--accent)' } : i === current ? { background: 'var(--accent)', animation: 'pulse 1.5s ease-in-out infinite' } : { background: 'var(--bg-raised)' }),
            }} />
          ))}
        </div>
      </div>

      <p style={{ color: 'var(--text)', lineHeight: 1.7, marginBottom: 16 }}>{q.q}</p>

      <div style={{ display: 'grid', gap: 8, marginBottom: 16 }}>
        {OPTS.map(opt => {
          const isSelected = answered === opt
          const isCorrect = opt === q.correct
          let style: React.CSSProperties = { border: '1px solid var(--border)', color: 'var(--text-2)' }
          if (showResult && isCorrect) style = { border: '1px solid var(--success)', background: 'rgba(var(--success),0.1)', color: 'var(--text)' }
          else if (showResult && isSelected && !isCorrect) style = { border: '1px solid var(--error)', background: 'rgba(var(--error),0.1)', color: 'var(--text)' }
          else if (isSelected) style = { border: '1px solid var(--accent)', background: 'rgba(201,168,76,0.1)', color: 'var(--text)' }
          return (
            <button
              key={opt}
              onClick={() => choose(opt)}
              style={{
                width: '100%', textAlign: 'left', borderRadius: 12, padding: 12, border: style.border, background: style.background || 'transparent', color: style.color, transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 12, cursor: answered ? 'default' : 'pointer',
              }}
            >
              <span style={{ fontWeight: 700, textTransform: 'uppercase', width: 16, fontSize: 13 }}>{opt}</span>
              <span style={{ fontSize: 13 }}>{q[opt]}</span>
            </button>
          )
        })}
      </div>

      {showResult && (
        <div className="card" style={{ border: '1px solid var(--accent)', background: 'rgba(201,168,76,0.1)', padding: 16, marginBottom: 16 }}>
          <div style={{ color: 'var(--accent)', fontSize: 11, fontWeight: 700, marginBottom: 4 }}>
            {answered === q.correct ? '✓ Correct!' : `✗ Incorrect — Answer is (${q.correct.toUpperCase()})`}
          </div>
          <p style={{ color: 'var(--text)', fontSize: 13, lineHeight: 1.7 }}>{q.explanation}</p>
        </div>
      )}

      {showResult && (
        <button
          onClick={next}
          className="btn btn-primary"
          style={{ width: '100%', fontWeight: 700, padding: 12 }}
        >
          {current < questions.length - 1 ? 'Next Question →' : 'See Results'}
        </button>
      )}
    </div>
  )
}
