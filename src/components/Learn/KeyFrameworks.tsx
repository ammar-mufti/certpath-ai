interface Props { domain: string }

function MaturityModel() {
  const stages = ['Ad Hoc', 'Aware', 'Defined', 'Managed', 'Embedded']
  const colors = ['#8DA4B8', '#4A9EDB', '#E8C94A', '#E8904A', '#7BC67A']
  return (
    <div>
      <h4 style={{ color: 'var(--text)', fontWeight: 600, marginBottom: 12, fontSize: 13 }}>CX Maturity Model</h4>
      <div style={{ display: 'flex', gap: 4 }}>
        {stages.map((s, i) => (
          <div key={s} style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'var(--accent-fg)', backgroundColor: colors[i] }}>
              {i + 1}
            </div>
            <div style={{ color: 'var(--text-2)', fontSize: 11, marginTop: 4, lineHeight: 1.3 }}>{s}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', marginTop: 4, gap: 4 }}>
        <div style={{ flex: 1 }} />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} style={{ color: 'var(--text-2)', textAlign: 'center', flex: 1 }}>→</div>
        ))}
      </div>
    </div>
  )
}

function GovernanceModel() {
  return (
    <div>
      <h4 style={{ color: 'var(--text)', fontWeight: 600, marginBottom: 12, fontSize: 13 }}>CX Governance Model</h4>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', height: 160 }}>
        <svg viewBox="0 0 200 160" style={{ width: '100%', maxWidth: 320 }}>
          <circle cx="100" cy="80" r="70" fill="none" stroke="#4A9EDB" strokeWidth="2" opacity="0.3" />
          <circle cx="100" cy="80" r="48" fill="none" stroke="#E8C94A" strokeWidth="2" opacity="0.4" />
          <circle cx="100" cy="80" r="26" fill="#C9A84C" opacity="0.2" />
          <text x="100" y="84" textAnchor="middle" fill="#C9A84C" fontSize="10" fontWeight="bold">Executive</text>
          <text x="100" y="116" textAnchor="middle" fill="#E8C94A" fontSize="9">Operational</text>
          <text x="100" y="155" textAnchor="middle" fill="#4A9EDB" fontSize="9">Frontline</text>
        </svg>
      </div>
    </div>
  )
}

function VoCClosedLoop() {
  const steps = ['Collect', 'Analyze', 'Act', 'Communicate']
  const colors = ['#7BC67A', '#E8C94A', '#E8904A', '#4A9EDB']
  return (
    <div>
      <h4 style={{ color: 'var(--text)', fontWeight: 600, marginBottom: 12, fontSize: 13 }}>VoC Closed Loop</h4>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
        {steps.map((s, i) => (
          <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 80, height: 48, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'var(--accent-fg)', backgroundColor: colors[i] }}>
              {s}
            </div>
            {i < steps.length - 1 && <span style={{ color: 'var(--text-2)' }}>→</span>}
          </div>
        ))}
        <div style={{ color: 'var(--text-2)', fontSize: 11, width: '100%', textAlign: 'center', marginTop: 4 }}>↩ loop back to Collect</div>
      </div>
    </div>
  )
}

function ListeningPostTable() {
  return (
    <div>
      <h4 style={{ color: 'var(--text)', fontWeight: 600, marginBottom: 12, fontSize: 13 }}>Listening Post Types</h4>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {[
          { type: 'Solicited', color: '#7BC67A', examples: 'Surveys, NPS, interviews, focus groups' },
          { type: 'Unsolicited', color: '#E8904A', examples: 'Social media, reviews, complaints, call logs' },
        ].map(({ type, color, examples }) => (
          <div key={type} className="card" style={{ borderLeft: `4px solid ${color}`, padding: 12 }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4, color }}>{type}</div>
            <div style={{ color: 'var(--text-2)', fontSize: 11 }}>{examples}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function JourneyMapAnatomy() {
  const lanes = ['Stages', 'Touchpoints', 'Actions', 'Emotions', 'Pain Points', 'Opportunities']
  const colors = ['#4A9EDB', '#7BC67A', '#E8C94A', '#C97AC9', '#E8904A', '#7AC9C9']
  return (
    <div>
      <h4 style={{ color: 'var(--text)', fontWeight: 600, marginBottom: 12, fontSize: 13 }}>Journey Map Anatomy</h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {lanes.map((lane, i) => (
          <div key={lane} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 112, fontSize: 11, fontWeight: 500, flexShrink: 0, color: colors[i] }}>{lane}</div>
            <div style={{ flex: 1, height: 20, borderRadius: 4, background: colors[i] + '33' }}>
              <div style={{ height: '100%', borderRadius: 4, width: '70%', background: colors[i] + '55' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function DesignThinking() {
  const stages = ['Empathize', 'Define', 'Ideate', 'Prototype', 'Test']
  const colors = ['#4A9EDB', '#7BC67A', '#E8C94A', '#E8904A', '#C97AC9']
  return (
    <div>
      <h4 style={{ color: 'var(--text)', fontWeight: 600, marginBottom: 12, fontSize: 13 }}>Design Thinking Process</h4>
      <div style={{ display: 'flex' }}>
        {stages.map((s, i) => (
          <div key={s} style={{ flex: 1, textAlign: 'center', position: 'relative' }}>
            <div
              style={{
                height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'var(--accent-fg)', position: 'relative', zIndex: 10,
                backgroundColor: colors[i],
                clipPath: i < stages.length - 1 ? 'polygon(0 0, 85% 0, 100% 50%, 85% 100%, 0 100%)' : undefined,
                marginRight: i < stages.length - 1 ? '-4px' : undefined,
              }}
            >
              {i + 1}
            </div>
            <div style={{ color: 'var(--text-2)', fontSize: 11, marginTop: 4, lineHeight: 1.3, padding: '0 4px' }}>{s}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function MetricsTable() {
  const metrics = [
    { name: 'NPS', question: 'Recommend?', scale: '0-10', focus: 'Loyalty' },
    { name: 'CSAT', question: 'Satisfied?', scale: '1-5', focus: 'Satisfaction' },
    { name: 'CES', question: 'Easy?', scale: '1-7', focus: 'Effort' },
  ]
  return (
    <div>
      <h4 style={{ color: 'var(--text)', fontWeight: 600, marginBottom: 12, fontSize: 13 }}>NPS / CSAT / CES Comparison</h4>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', fontSize: 11 }}>
          <thead>
            <tr style={{ color: 'var(--accent)', borderBottom: '1px solid var(--border)' }}>
              <th style={{ textAlign: 'left', padding: '8px 16px 8px 0' }}>Metric</th>
              <th style={{ textAlign: 'left', padding: '8px 16px 8px 0' }}>Question</th>
              <th style={{ textAlign: 'left', padding: '8px 16px 8px 0' }}>Scale</th>
              <th style={{ textAlign: 'left', padding: '8px 0' }}>Focus</th>
            </tr>
          </thead>
          <tbody>
            {metrics.map(m => (
              <tr key={m.name} style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-2)' }}>
                <td style={{ padding: '8px 16px 8px 0', fontWeight: 700, color: 'var(--text)' }}>{m.name}</td>
                <td style={{ padding: '8px 16px 8px 0' }}>{m.question}</td>
                <td style={{ padding: '8px 16px 8px 0' }}>{m.scale}</td>
                <td style={{ padding: '8px 0' }}>{m.focus}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ROILinkage() {
  const steps = ['CX Improvement', 'Behavior Change', 'Financial Outcome']
  const colors = ['#4A9EDB', '#E8C94A', '#7BC67A']
  return (
    <div>
      <h4 style={{ color: 'var(--text)', fontWeight: 600, marginBottom: 12, fontSize: 13 }}>ROI Linkage Chain</h4>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {steps.map((s, i) => (
          <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
            <div style={{ flex: 1, borderRadius: 8, padding: 8, textAlign: 'center', fontSize: 11, fontWeight: 500, color: 'var(--accent-fg)', backgroundColor: colors[i] }}>
              {s}
            </div>
            {i < steps.length - 1 && <span style={{ color: 'var(--text-2)', fontSize: '1.125rem' }}>→</span>}
          </div>
        ))}
      </div>
    </div>
  )
}

function CultureLevers() {
  const items = [
    { label: 'Leadership', color: '#4A9EDB' },
    { label: 'Processes', color: '#E8C94A' },
    { label: 'People', color: '#7BC67A' },
    { label: 'Symbols & Stories', color: '#E8904A' },
  ]
  return (
    <div>
      <h4 style={{ color: 'var(--text)', fontWeight: 600, marginBottom: 12, fontSize: 13 }}>Culture Change Levers</h4>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {items.map(({ label, color }) => (
          <div key={label} style={{ borderRadius: 8, padding: 12, textAlign: 'center', fontSize: 13, fontWeight: 500, color: 'var(--accent-fg)', backgroundColor: color }}>
            {label}
          </div>
        ))}
      </div>
    </div>
  )
}

function EngagementPyramid() {
  const levels = [
    { label: 'Commitment', width: '40%', color: '#7BC67A' },
    { label: 'Understanding', width: '65%', color: '#E8C94A' },
    { label: 'Awareness', width: '100%', color: '#4A9EDB' },
  ]
  return (
    <div>
      <h4 style={{ color: 'var(--text)', fontWeight: 600, marginBottom: 12, fontSize: 13 }}>Employee Engagement Pyramid</h4>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
        {levels.map(({ label, width, color }) => (
          <div key={label} style={{ height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'var(--accent-fg)', width, backgroundColor: color }}>
            {label}
          </div>
        ))}
      </div>
    </div>
  )
}

function RACITable() {
  const roles = ['Responsible', 'Accountable', 'Consulted', 'Informed']
  const descriptions = ['Does the work', 'Owns the outcome', 'Provides input', 'Kept updated']
  return (
    <div>
      <h4 style={{ color: 'var(--text)', fontWeight: 600, marginBottom: 12, fontSize: 13 }}>RACI Template</h4>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {roles.map((r, i) => (
          <div key={r} className="card" style={{ padding: 12 }}>
            <div style={{ color: 'var(--accent)', fontWeight: 700, fontSize: 13 }}>{r[0]} — {r}</div>
            <div style={{ color: 'var(--text-2)', fontSize: 11, marginTop: 4 }}>{descriptions[i]}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ChangeCurve() {
  const points = ['Denial', 'Resistance', 'Exploration', 'Commitment']
  const colors = ['#A63228', '#E8904A', '#E8C94A', '#7BC67A']
  return (
    <div>
      <h4 style={{ color: 'var(--text)', fontWeight: 600, marginBottom: 12, fontSize: 13 }}>Change Curve</h4>
      <div style={{ position: 'relative', height: 96, display: 'flex', alignItems: 'flex-end', gap: 4, padding: '0 8px' }}>
        {[20, 10, 40, 80].map((h, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{ width: '100%', borderRadius: '4px 4px 0 0', height: `${h}%`, backgroundColor: colors[i] }} />
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
        {points.map((p, i) => (
          <div key={p} style={{ flex: 1, textAlign: 'center', fontSize: 11, lineHeight: 1.3, color: colors[i] }}>{p}</div>
        ))}
      </div>
    </div>
  )
}

const FRAMEWORKS: Record<string, React.FC[]> = {
  'CX Strategy': [MaturityModel, GovernanceModel],
  'Voice of Customer': [VoCClosedLoop, ListeningPostTable],
  'Experience Design': [JourneyMapAnatomy, DesignThinking],
  'Metrics & Measurement': [MetricsTable, ROILinkage],
  'Customer-Centric Culture': [CultureLevers, EngagementPyramid],
  'Organizational Adoption': [RACITable, ChangeCurve],
}

export default function KeyFrameworks({ domain }: Props) {
  const components = FRAMEWORKS[domain] ?? []
  if (components.length === 0) return <p style={{ color: 'var(--text-2)', fontSize: 13 }}>No frameworks for this domain.</p>
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {components.map((Framework, i) => (
        <div key={i} className="card" style={{ borderRadius: 12, padding: 20 }}>
          <Framework />
        </div>
      ))}
    </div>
  )
}
