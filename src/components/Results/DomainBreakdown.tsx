import { useParams } from 'react-router-dom'
import type { Question } from '../../store/examStore'
import { getCert } from '../../data/certifications'

interface Props {
  questions: Question[]
  answers: Record<string, string>
}

export default function DomainBreakdown({ questions, answers }: Props) {
  const { certId: certIdParam } = useParams<{ certId?: string }>()
  const certId = certIdParam ?? 'ccxp'
  const color = getCert(certId)?.color ?? '#C9A84C'

  const domains = [...new Set(questions.map(q => q.domain))]

  const stats = domains.map(domain => {
    const qs = questions.filter(q => q.domain === domain)
    const correct = qs.filter(q => answers[q.id] === q.correct).length
    return { domain, correct, total: qs.length, pct: Math.round((correct / qs.length) * 100) }
  })

  return (
    <div>
      <h3 style={{ color: 'var(--text)', fontWeight: 600, marginBottom: 16 }}>Domain Breakdown</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {stats.map(({ domain, correct, total, pct }) => (
          <div key={domain}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
              <span style={{ color: 'var(--text-2)' }}>{domain}</span>
              <span style={{ color: 'var(--text)', fontWeight: 500 }}>{correct}/{total} ({pct}%)</span>
            </div>
            <div style={{ height: 8, background: 'var(--bg-card)', borderRadius: 'var(--r-full)', overflow: 'hidden', border: '1px solid var(--border)' }}>
              <div
                style={{ height: '100%', borderRadius: 'var(--r-full)', transition: 'width 0.7s', width: `${pct}%`, backgroundColor: color }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
