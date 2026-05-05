import { useState, useEffect, useRef } from 'react'
import type { TopicContent } from '../../store/learnStore'

interface Props {
  topic: TopicContent
  onRead: () => void
  isRead: boolean
}

export default function TopicCard({ topic, onRead, isRead }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [readSeconds, setReadSeconds] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (expanded && !isRead) {
      timerRef.current = setInterval(() => {
        setReadSeconds(s => {
          if (s >= 29) {
            clearInterval(timerRef.current!)
            onRead()
            return 30
          }
          return s + 1
        })
      }, 1000)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [expanded, isRead])

  return (
    <div className="card" style={{ transition: 'all 0.15s', borderColor: isRead ? 'var(--success)' : 'var(--border)' }}>
      <button
        style={{ width: '100%', textAlign: 'left', padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: 'none', background: 'transparent', cursor: 'pointer' }}
        onClick={() => setExpanded(!expanded)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {isRead && <span style={{ color: 'var(--success)', fontSize: 13 }}>✓</span>}
          <span style={{ color: 'var(--text)', fontWeight: 500 }}>{topic.topic}</span>
        </div>
        <span style={{ color: 'var(--text-2)', fontSize: 13 }}>{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div style={{ padding: '0 1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {!isRead && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ flex: 1, height: 4, background: 'var(--bg-raised)', borderRadius: 'var(--r-full)' }}>
                <div style={{ height: 4, background: 'var(--accent)', borderRadius: 'var(--r-full)', transition: 'width 0.3s', width: `${(readSeconds / 30) * 100}%` }} />
              </div>
              <span style={{ color: 'var(--text-2)', fontSize: 12 }}>{30 - readSeconds}s</span>
            </div>
          )}

          <p style={{ color: 'var(--text-2)', fontSize: 13, lineHeight: 1.7 }}>{topic.explanation}</p>

          <div style={{ background: 'var(--bg-sunken)', borderRadius: 'var(--r-sm)', padding: '0.75rem' }}>
            <div style={{ color: 'var(--accent)', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Real-world example</div>
            <p style={{ color: 'var(--text-2)', fontSize: 13 }}>{topic.example}</p>
          </div>

          <div style={{ background: 'var(--error-dim)', border: '1px solid var(--error)', borderRadius: 'var(--r-sm)', padding: '0.75rem' }}>
            <div style={{ color: 'var(--error)', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>⚠ Exam trap</div>
            <p style={{ color: 'var(--text)', fontSize: 13 }}>{topic.examTrap}</p>
          </div>

          {topic.keyTerms.length > 0 && (
            <div>
              <div style={{ color: 'var(--accent)', fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Key Terms</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {topic.keyTerms.map(({ term, definition }) => (
                  <div key={term} style={{ display: 'flex', gap: 8, fontSize: 13 }}>
                    <span style={{ color: 'var(--text)', fontWeight: 500, minWidth: 0 }}>{term}:</span>
                    <span style={{ color: 'var(--text-2)' }}>{definition}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
