import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Question } from '../../store/examStore'
import { toDomainSlug } from '../../utils/domainUtils'

interface Props {
  questions: Question[]
  answers: Record<string, string>
}

const OPTS = ['a', 'b', 'c', 'd'] as const

export default function WrongAnswers({ questions, answers }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const navigate = useNavigate()
  const wrong = questions.filter(q => answers[q.id] !== q.correct)

  if (wrong.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem 0' }}>
        <div style={{ fontSize: '2.25rem', marginBottom: 8 }}>🏆</div>
        <p style={{ color: 'var(--success)', fontWeight: 600 }}>Perfect score on reviewed questions!</p>
      </div>
    )
  }

  function handleStudy(q: Question) {
    sessionStorage.setItem('ccxp_navigate_to_topic', JSON.stringify({
      sourceTopic: q.sourceTopic ?? q.domain,
      sourceTopicSlug: q.sourceTopicSlug ?? '',
      domain: q.domain,
    }))
    navigate(`/learn/${toDomainSlug(q.domain)}`)
  }

  return (
    <div>
      <h3 style={{ color: 'var(--text)', fontWeight: 600, marginBottom: 16 }}>Wrong Answers ({wrong.length})</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {wrong.map((q, i) => {
          const yourAnswer = answers[q.id]
          const isOpen = expanded === q.id
          return (
            <div key={q.id} className="card" style={{ overflow: 'hidden' }}>
              <button
                style={{ width: '100%', textAlign: 'left', padding: '1rem', display: 'flex', alignItems: 'flex-start', gap: 12, border: 'none', background: 'transparent', cursor: 'pointer' }}
                onClick={() => setExpanded(isOpen ? null : q.id)}
              >
                <span style={{ color: 'var(--error)', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>#{i + 1}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ color: 'var(--text-2)', fontSize: 13, lineHeight: 1.7 }}>{q.q}</p>
                  <p style={{ color: 'var(--text-3)', fontSize: 12, marginTop: 4 }}>{q.domain}{q.sourceTopic ? ` · ${q.sourceTopic}` : ''}</p>
                </div>
                <span style={{ color: 'var(--text-2)', fontSize: 12, flexShrink: 0 }}>{isOpen ? '▲' : '▼'}</span>
              </button>

              {isOpen && (
                <div style={{ padding: '0 1rem 1rem', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {OPTS.map(opt => {
                    const isYours = opt === yourAnswer
                    const isCorrect = opt === q.correct
                    let bg = 'transparent', borderC = 'var(--border)', textC = 'var(--text-2)'
                    if (isCorrect) { bg = 'rgba(45,106,79,0.10)'; borderC = 'var(--success)'; textC = 'var(--text)' }
                    else if (isYours) { bg = 'var(--error-dim)'; borderC = 'var(--error)'; textC = 'var(--text)' }
                    return (
                      <div key={opt} style={{ borderRadius: 'var(--r-sm)', padding: '8px 12px', border: `1px solid ${borderC}`, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, background: bg, color: textC }}>
                        <span style={{ fontWeight: 700, textTransform: 'uppercase', width: 16 }}>{opt}</span>
                        <span>{q[opt]}</span>
                        {isCorrect && <span style={{ marginLeft: 'auto', color: 'var(--success)', fontSize: 12, fontWeight: 700 }}>✓ correct</span>}
                        {isYours && !isCorrect && <span style={{ marginLeft: 'auto', color: 'var(--error)', fontSize: 12, fontWeight: 700 }}>✗ yours</span>}
                      </div>
                    )
                  })}

                  {q.explanation && (
                    <div style={{ background: 'var(--accent-dim)', borderRadius: 'var(--r-sm)', padding: '8px 12px', marginTop: 8 }}>
                      <span style={{ color: 'var(--accent)', fontSize: 12, fontWeight: 700 }}>Explanation: </span>
                      <span style={{ color: 'var(--text)', fontSize: 12 }}>{q.explanation}</span>
                    </div>
                  )}

                  <button
                    onClick={() => handleStudy(q)}
                    style={{ width: '100%', marginTop: 8, padding: '8px 16px', borderRadius: 'var(--r-sm)', border: '1px solid var(--accent)', background: 'transparent', color: 'var(--accent)', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-dim)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                  >
                    📚 Study "{q.sourceTopic ?? q.domain}" in {q.domain} →
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
