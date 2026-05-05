import { useEffect, useRef } from 'react'
import { useExamStore } from '../../store/examStore'

interface Props {
  onSubmit: () => void
}

export default function NavigationBar({ onSubmit }: Props) {
  const { questions, answers, currentIndex, navigateTo } = useExamStore()
  const scrollRef = useRef<HTMLDivElement>(null)
  const answered = Object.keys(answers).length
  const total = questions.length
  const unanswered = total - answered

  useEffect(() => {
    const el = document.getElementById(`q-btn-${currentIndex}`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  }, [currentIndex])

  return (
    <div style={{ background: 'var(--bg-card)', borderTop: '1px solid var(--border)' }}>
      <div style={{ maxWidth: 1152, marginLeft: 'auto', marginRight: 'auto', paddingLeft: 16, paddingRight: 16, paddingTop: 12, paddingBottom: 8 }}>
        <div
          ref={scrollRef}
          style={{ display: 'flex', gap: 4, overflowX: 'auto', paddingBottom: 8, marginBottom: 8, scrollbarWidth: 'thin', scrollbarColor: 'rgba(201,168,76,0.3) transparent' }}
        >
          {questions.map((q, i) => {
            const isAnswered = !!answers[q.id]
            const isCurrent = i === currentIndex
            return (
              <button
                key={q.id}
                id={`q-btn-${i}`}
                onClick={() => navigateTo(i)}
                style={{
                  flexShrink: 0, width: 32, height: 32, borderRadius: 8, fontSize: 11, fontWeight: 700, transition: 'all 0.15s',
                  ...(isCurrent
                    ? { background: 'var(--accent)', color: 'var(--accent-fg)', boxShadow: '0 0 0 2px rgba(201,168,76,0.5)' }
                    : isAnswered
                    ? { background: 'rgba(var(--success),0.4)', color: 'var(--success)', border: '1px solid var(--success)' }
                    : { background: 'var(--bg-raised)', color: 'var(--text-2)' }
                  ),
                }}
              >
                {i + 1}
              </button>
            )
          })}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--text-2)' }}>
            <span style={{ color: 'var(--success)', fontWeight: 500 }}>{answered} answered</span>
            {unanswered > 0 && <span>{unanswered} remaining</span>}
          </div>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <button
              onClick={() => navigateTo(Math.max(0, currentIndex - 1))}
              disabled={currentIndex === 0}
              className="btn btn-ghost"
              style={{ fontSize: 13, padding: '4px 12px', opacity: currentIndex === 0 ? 0.3 : 1 }}
            >
              ← Prev
            </button>
            <button
              onClick={() => navigateTo(Math.min(total - 1, currentIndex + 1))}
              disabled={currentIndex === total - 1}
              className="btn btn-ghost"
              style={{ fontSize: 13, padding: '4px 12px', opacity: currentIndex === total - 1 ? 0.3 : 1 }}
            >
              Next →
            </button>
            <button
              onClick={onSubmit}
              className="btn btn-primary"
              style={{ fontSize: 13, padding: '4px 20px', fontWeight: 700 }}
            >
              Submit
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
