import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { callLLM } from '../../services/llm'
import type { Question } from '../../store/examStore'
import { useLearnStore } from '../../store/learnStore'
import { useAuthStore } from '../../store/authStore'
import { stripMarker } from '../../utils/stripMarker'

interface Tip { domain: string; tips: string[] }

interface Props {
  questions: Question[]
  answers: Record<string, string>
}

export default function StudyPlan({ questions, answers }: Props) {
  const [plan, setPlan] = useState<Tip[] | null>(null)
  const navigate = useNavigate()
  const { setActiveDomain } = useLearnStore()
  const token = useAuthStore(s => s.token) ?? ''
  const startedRef = useRef(false)

  const weakDomains = (() => {
    const domains = [...new Set(questions.map(q => q.domain))]
    return domains
      .map(d => {
        const qs = questions.filter(q => q.domain === d)
        const correct = qs.filter(q => answers[q.id] === q.correct).length
        return { domain: d, pct: correct / qs.length }
      })
      .sort((a, b) => a.pct - b.pct)
      .slice(0, 3)
      .map(d => d.domain)
  })()

  useEffect(() => {
    if (weakDomains.length === 0 || startedRef.current) return
    startedRef.current = true
    callLLM({
      type: 'study-plan',
      domain: weakDomains.join(','),
    }, token).then(raw => {
      let result: Tip[] = []
      try {
        const data = Array.isArray(raw) ? raw
          : typeof raw === 'string'
          ? JSON.parse((raw.match(/\[[\s\S]*\]/) ?? ['[]'])[0])
          : (raw as { content?: unknown })?.content ?? []
        result = Array.isArray(data) ? data as Tip[] : []
      } catch { /* use fallback */ }

      setPlan(result.length > 0 ? result : weakDomains.map(d => ({
        domain: d,
        tips: [
          `Review core concepts and frameworks in ${d}`,
          'Practice scenario-based questions for this domain',
          'Study the CXPA body of knowledge for this area',
        ],
      })))
    }).catch(() => {
      setPlan(weakDomains.map(d => ({
        domain: d,
        tips: [
          `Review core concepts and frameworks in ${d}`,
          'Practice scenario-based questions for this domain',
          'Study the CXPA body of knowledge for this area',
        ],
      })))
    })
  }, [token, weakDomains.length])

  function goStudy(domain: string) {
    setActiveDomain(domain)
    navigate('/learn/' + encodeURIComponent(domain))
  }

  const isLoading = plan === null && weakDomains.length > 0

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
        <div style={{ color: 'var(--text-2)', fontSize: 13, animation: 'pulse 1.5s ease-in-out infinite' }}>Generating personalized study plan…</div>
      </div>
    )
  }

  if (!plan) return null

  return (
    <div>
      <h3 style={{ color: 'var(--text)', fontWeight: 600, marginBottom: 16 }}>Personalized Study Plan</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {plan.map(({ domain, tips }) => (
          <div key={domain} className="card" style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <h4 style={{ color: 'var(--text)', fontWeight: 500, fontSize: 14 }}>{domain}</h4>
              <button
                onClick={() => goStudy(domain)}
                style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: 12, cursor: 'pointer', fontWeight: 500 }}
              >
                Study this domain →
              </button>
            </div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {tips.map((tip, i) => (
                <li key={i} style={{ display: 'flex', gap: 8, fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5 }}>
                  <span style={{ color: 'var(--accent)', flexShrink: 0, marginTop: 2, fontSize: 10 }}>●</span>
                  {stripMarker(tip)}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}
