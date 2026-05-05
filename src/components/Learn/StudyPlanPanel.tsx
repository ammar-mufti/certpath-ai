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
  const total = plan.reduce((s, d) => s + d.tasks.length,0)
  const done = Object.values(checks).filter(Boolean).length

  return (
    <div className="card" style={{ borderRadius: 16, padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h2 style={{ color: 'var(--text)', fontFamily: 'Noto Serif, Georgia, serif', fontSize: '1.25rem' }}>{cert.name} 3-Day Study Plan</h2>
        <span style={{ color: 'var(--text-2)', fontSize: 13 }}>{done}/{total} completed</span>
      </div>

      <div className="progress-bar" style={{ height: 6, marginBottom: 24 }}>
        <div className="progress-fill" style={{ width: `${total > 0 ? (done / total) * 100 : 0}%` }} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {plan.map(day => (
          <div key={day.label}>
            <h3 style={{ color: 'var(--accent)', fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>{day.label}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {day.tasks.map(task => (
                <label key={task.id} style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={!!checks[task.id]}
                    onChange={e => setChecks(p => ({ ...p, [task.id]: e.target.checked }))}
                    style={{ width: 16, height: 16, borderRadius: 4, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--accent)', accentColor: 'var(--accent)' }}
                  />
                  <span style={{
                    fontSize: 13, transition: 'all 0.15s',
                    ...(checks[task.id] ? { textDecoration: 'line-through', color: 'var(--text-3)' } : { color: 'var(--text-2)' }),
                  }}>
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
