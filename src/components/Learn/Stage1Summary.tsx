import type { Stage1Summary } from '../../types/content'
import { stripMarker } from '../../utils/stripMarker'

interface Props {
  data: Stage1Summary
}

export default function Stage1Summary({ data }: Props) {
  return (
    <div className="card" style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 4 }}>Domain Snapshot</div>
          <p style={{ color: 'var(--text)', fontSize: 15, lineHeight: 1.7 }}>{data.tagline}</p>
        </div>
        <span style={{
          fontSize: 11, padding: '3px 10px', borderRadius: 9999,
          background: 'var(--accent-dim)', color: 'var(--accent)',
          fontWeight: 500, whiteSpace: 'nowrap', flexShrink: 0,
        }}>
          {data.examWeight}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 20 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 8 }}>⚡ Must Know</div>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {data.mustKnow.map((item, i) => (
              <li key={i} style={{ display: 'flex', gap: 8, fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6 }}>
                <span style={{ color: 'var(--accent)', flexShrink: 0, marginTop: 3, fontSize: 10 }}>●</span>
                <span>{stripMarker(item)}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--error)', marginBottom: 8 }}>⚠️ Common Mistakes</div>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {data.commonMistakes.map((item, i) => (
              <li key={i} style={{ display: 'flex', gap: 8, fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6 }}>
                <span style={{ color: 'var(--error)', flexShrink: 0, marginTop: 3, fontSize: 10 }}>●</span>
                <span>{stripMarker(item)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {data.connectedDomains && data.connectedDomains.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 8 }}>🔗 Connected To</div>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {data.connectedDomains.map((item, i) => (
              <li key={i} style={{ display: 'flex', gap: 8, fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6 }}>
                <span style={{ color: 'var(--text-3)', flexShrink: 0, marginTop: 2 }}>→</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
