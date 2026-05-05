import { useState } from 'react'
import type { Flashcard } from '../../store/learnStore'

interface Props {
  flashcards: Flashcard[]
  knownIndices: number[]
  onMarkKnown: (index: number) => void
}

export default function FlashcardDeck({ flashcards, knownIndices, onMarkKnown }: Props) {
  const [current, setCurrent] = useState(0)
  const [flipped, setFlipped] = useState(false)

  if (flashcards.length === 0) return null

  const card = flashcards[current]
  const isKnown = knownIndices.includes(current)
  const known = knownIndices.length

  function next() { setFlipped(false); setTimeout(() => setCurrent(c => (c + 1) % flashcards.length), 150) }
  function prev() { setFlipped(false); setTimeout(() => setCurrent(c => (c - 1 + flashcards.length) % flashcards.length), 150) }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', maxWidth: 512, marginBottom: 16 }}>
        <span style={{ color: 'var(--text-2)', fontSize: 13 }}>{current + 1} / {flashcards.length}</span>
        <span style={{ color: 'var(--success)', fontSize: 13 }}>{known} known</span>
      </div>

      <div className="flip-card w-full max-w-lg h-52" onClick={() => setFlipped(!flipped)} style={{ cursor: 'pointer' }}>
        <div className={`flip-card-inner w-full h-full ${flipped ? 'flipped' : ''}`}>
          <div className="flip-card-front w-full h-full" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center' }}>
            <div style={{ color: 'var(--text-2)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Question</div>
            <p style={{ color: 'var(--text)', fontSize: '1.125rem', fontWeight: 500, lineHeight: 1.7 }}>{card.front}</p>
            <p style={{ color: 'var(--text-2)', fontSize: 11, marginTop: 16 }}>Tap to reveal</p>
          </div>
          <div className="flip-card-back w-full h-full" style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.4)', borderRadius: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center' }}>
            <div style={{ color: 'var(--accent)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Answer</div>
            <p style={{ color: 'var(--text)', fontSize: 15, lineHeight: 1.7 }}>{card.back}</p>
            {card.why && <p style={{ color: 'var(--text-2)', fontSize: 11, marginTop: 12, fontStyle: 'italic' }}>{card.why}</p>}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 24 }}>
        <button onClick={prev} className="btn btn-ghost" style={{ fontSize: 13, padding: '8px 16px' }}>
          ← Prev
        </button>
        <button
          onClick={() => { onMarkKnown(current); next() }}
          disabled={isKnown}
          className={isKnown ? "btn" : "btn btn-primary"}
          style={{
            fontSize: 13, padding: '8px 20px', fontWeight: 500,
            ...(isKnown ? { background: 'rgba(var(--success),0.2)', color: 'var(--success)', cursor: 'default' } : {}),
          }}
        >
          {isKnown ? '✓ Known' : 'I know this'}
        </button>
        <button onClick={next} className="btn btn-ghost" style={{ fontSize: 13, padding: '8px 16px' }}>
          Next →
        </button>
      </div>

      <div style={{ display: 'flex', gap: 6, marginTop: 16, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 320 }}>
        {flashcards.map((_, i) => (
          <div
            key={i}
            style={{
              width: 8, height: 8, borderRadius: '50%', transition: 'all 0.15s',
              ...(i === current ? { background: 'var(--accent)' } : knownIndices.includes(i) ? { background: 'var(--success)' } : { background: 'var(--bg-raised)' }),
            }}
          />
        ))}
      </div>
    </div>
  )
}
