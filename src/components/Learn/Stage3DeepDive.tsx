import type { Stage3DeepDive } from '../../types/content'

interface Props {
  data: Stage3DeepDive
  topic: string
}

export default function Stage3DeepDive({ data, topic }: Props) {
  return (
    <div className="card" style={{ marginTop: 16, padding: 20, display: 'flex', flexDirection: 'column', gap: 20, border: '1px solid var(--accent)', background: 'rgba(201,168,76,0.05)' }}>
      <div className="label" style={{ color: 'var(--accent)', marginBottom: 4 }}>
        🔍 Deep Dive: {topic}
      </div>

      <p style={{ color: 'var(--text)', fontSize: 13, lineHeight: 1.7 }}>{data.overview}</p>

      <div>
        <div className="label" style={{ color: 'var(--text-2)', marginBottom: 8 }}>How It Works</div>
        <ol style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingLeft: 0, listStyle: 'none' }}>
          {data.howItWorks.map((step, i) => (
            <li key={i} style={{ display: 'flex', gap: 12, fontSize: 13, color: 'var(--text-2)', lineHeight: 1.7 }}>
              <span style={{ color: 'var(--accent)', fontWeight: 700, flexShrink: 0, width: 20 }}>{i + 1}.</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </div>

      <div style={{ background: 'var(--bg-sunken)', borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div className="label" style={{ color: 'var(--text-2)', marginBottom: 4 }}>🏢 Real World Example</div>
        <div>
          <span style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600 }}>Scenario: </span>
          <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{data.realWorldExample.scenario}</span>
        </div>
        <div>
          <span style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600 }}>Application: </span>
          <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{data.realWorldExample.application}</span>
        </div>
        <div>
          <span style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600 }}>Outcome: </span>
          <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{data.realWorldExample.outcome}</span>
        </div>
      </div>

      <div style={{ background: 'var(--bg-sunken)', borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div className="label" style={{ color: 'var(--text-2)', marginBottom: 4 }}>📝 Exam Scenario</div>
        <p style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>{data.examScenario.question}</p>
        <div style={{ display: 'flex', gap: 8, fontSize: 13 }}>
          <span style={{ color: 'var(--error)', flexShrink: 0 }}>❌</span>
          <div><span style={{ color: 'var(--error)', fontWeight: 600 }}>Wrong: </span><span style={{ color: 'var(--text-2)' }}>{data.examScenario.wrongAnswer}</span></div>
        </div>
        <div style={{ display: 'flex', gap: 8, fontSize: 13 }}>
          <span style={{ color: 'var(--success)', flexShrink: 0 }}>✅</span>
          <div><span style={{ color: 'var(--success)', fontWeight: 600 }}>Correct: </span><span style={{ color: 'var(--text-2)' }}>{data.examScenario.correctAnswer}</span></div>
        </div>
      </div>

      {data.frameworks && data.frameworks.length > 0 && (
        <div>
          <div className="label" style={{ color: 'var(--text-2)', marginBottom: 8 }}>🔧 Frameworks</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {data.frameworks.map((fw, i) => (
              <div key={i} className="card" style={{ padding: '8px 12px', fontSize: 11, flex: '1 1 auto', minWidth: 120 }}>
                <div style={{ color: 'var(--accent)', fontWeight: 600, marginBottom: 2 }}>{fw.name}</div>
                <div style={{ color: 'var(--text-2)' }}>{fw.description}</div>
                {fw.stages.length > 0 && (
                  <div style={{ color: 'var(--text-3)', marginTop: 4, fontSize: 10 }}>{fw.stages.join(' → ')}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {data.memoryAid && (
        <div className="card" style={{ border: '1px solid var(--accent)', background: 'rgba(201,168,76,0.1)', padding: '12px 16px' }}>
          <span style={{ color: 'var(--accent)', fontSize: 11, fontWeight: 700 }}>💡 Memory Aid: </span>
          <span style={{ color: 'var(--text)', fontSize: 13 }}>{data.memoryAid}</span>
        </div>
      )}
    </div>
  )
}
