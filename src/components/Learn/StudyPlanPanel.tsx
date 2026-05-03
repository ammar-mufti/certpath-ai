import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { getCert } from '../../data/certifications'
import type { CertDomain } from '../../data/certifications'

function planKey(userId: string, certId: string): string {
  return `${userId}_${certId}_plan_checks`
}

function buildPlan(domains: CertDomain[], examQuestions: number) {
  const n = domains.length
  const day1Count = Math.ceil(n / 3)
  const day2Count = Math.ceil((n - day1Count) / 2)

  const day1 = domains.slice(0, day1Count)
  const day2 = domains.slice(day1Count, day1Count + day2Count)
  const day3 = domains.slice(day1Count + day2Count)

  return [
    {
      label: 'Day 1 — Foundation',
      tasks: [
        ...day1.map(d => ({ id: `d1_${d.name}`, label: `${d.name} — full study` })),
        { id: 'd1_mini', label: '20Q Mini Drill' },
        { id: 'd1_review', label: 'Review wrong answers' },
      ],
    },
    {
      label: 'Day 2 — Deep Dive',
      tasks: [
        ...day2.map(d => ({ id: `d2_${d.name}`, label: `${d.name} — full study` })),
        { id: 'd2_mock', label: `Full ${examQuestions}Q timed mock exam` },
        { id: 'd2_review', label: 'Review all wrong answers' },
      ],
    },
    {
      label: 'Day 3 — Consolidation',
      tasks: [
        ...day3.map(d => ({ id: `d3_${d.name}`, label: `${d.name} — full study` })),
        { id: 'd3_mock2', label: `Second full ${examQuestions}Q timed exam` },
        { id: 'd3_weak', label: 'Review weak domains only' },
        { id: 'd3_frameworks', label: 'Key frameworks quick review' },
      ],
    },
    {
      label: 'Exam Day',
      tasks: [
        { id: 'exam_flash', label: 'Flashcard review only (30 min max)' },
        { id: 'exam_nonew', label: 'No new material today' },
      ],
    },
  ]
}

export default function StudyPlanPanel() {
  const { certId: certIdParam } = useParams<{ certId?: string }>()
  const certId = certIdParam ?? 'ccxp'
  const cert = getCert(certId)
  const userId = useAuthStore.getState().user?.id ?? 'anonymous'
  const key = planKey(userId, certId)

  const [checks, setChecks] = useState<Record<string, boolean>>(() => {
    try { return JSON.parse(localStorage.getItem(key) ?? '{}') } catch { return {} }
  })

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(checks))
  }, [checks, key])

  if (!cert) return null

  const plan = buildPlan(cert.domains, cert.examQuestions)
  const total = plan.reduce((s, d) => s + d.tasks.length, 0)
  const done = Object.values(checks).filter(Boolean).length

  return (
    <div className="bg-ink rounded-2xl border border-white/10 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-cream font-serif text-xl">{cert.name} 3-Day Study Plan</h2>
        <span className="text-mist text-sm">{done}/{total} completed</span>
      </div>

      <div className="h-1.5 bg-navy rounded-full mb-6">
        <div className="h-1.5 bg-gold rounded-full transition-all" style={{ width: `${total > 0 ? (done / total) * 100 : 0}%` }} />
      </div>

      <div className="space-y-6">
        {plan.map(day => (
          <div key={day.label}>
            <h3 className="text-gold text-sm font-semibold uppercase tracking-wider mb-3">{day.label}</h3>
            <div className="space-y-2">
              {day.tasks.map(task => (
                <label key={task.id} className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={!!checks[task.id]}
                    onChange={e => setChecks(p => ({ ...p, [task.id]: e.target.checked }))}
                    className="w-4 h-4 rounded border-white/30 bg-navy text-gold accent-gold"
                  />
                  <span className={`text-sm transition-colors ${checks[task.id] ? 'line-through text-mist/50' : 'text-mist group-hover:text-cream'}`}>
                    {task.label}
                  </span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
