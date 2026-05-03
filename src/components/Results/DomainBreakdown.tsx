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
      <h3 className="text-cream font-semibold mb-4">Domain Breakdown</h3>
      <div className="space-y-3">
        {stats.map(({ domain, correct, total, pct }) => (
          <div key={domain}>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-mist">{domain}</span>
              <span className="text-cream font-medium">{correct}/{total} ({pct}%)</span>
            </div>
            <div className="h-2 bg-ink rounded-full overflow-hidden">
              <div
                className="h-2 rounded-full transition-all duration-700"
                style={{ width: `${pct}%`, backgroundColor: color }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
