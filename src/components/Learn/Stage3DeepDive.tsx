import { useState } from 'react'
import { useParams } from 'react-router-dom'
import type { Stage3DeepDive } from '../../types/content'
import { useLearnStore } from '../../store/learnStore'
import { stripMarker } from '../../utils/stripMarker'

interface Props {
  data: Stage3DeepDive
  topic: string
}

function StepAccordion({ steps, certId, domain, topic }: { steps: string[]; certId: string; domain: string; topic: string }) {
  const [expanded, setExpanded] = useState<Set<number>>(new Set([0]))
  const completedSteps = useLearnStore(state => state.getCompletedSteps(certId, domain, topic))
  const markStepComplete = useLearnStore(state => state.markStepComplete)

  function toggleStep(i: number) {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      return next
    })
  }

  function handleCheck(i: number) {
    markStepComplete(certId, domain, topic, i)
  }

  const completedCount = completedSteps.length

  return (
    <div>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12,
      }}>
        <div className="label" style={{ color: 'var(--text-2)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>settings</span>
          How It Works
        </div>
        <span className="badge badge-accent">{completedCount} / {steps.length}</span>
      </div>

      <div className="progress-bar" style={{ marginBottom: 12, height: 4 }}>
        <div className="progress-fill" style={{ width: `${(completedCount / steps.length) * 100}%` }} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {steps.map((step, i) => {
          const isExpanded = expanded.has(i)
          const isCompleted = completedSteps.includes(i)
          const title = step.split('.')[0]?.trim() || `Step ${i + 1}`

          return (
            <div
              key={i}
              className="card"
              style={{
                border: `1px solid ${isExpanded ? 'var(--accent)' : 'var(--border)'}`,
                overflow: 'hidden',
                transition: 'all 0.2s',
              }}
            >
              <button
                onClick={() => toggleStep(i)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 14px',
                  background: isExpanded ? 'var(--bg-raised)' : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div style={{
                  width: 26, height: 26, flexShrink: 0, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: isCompleted ? 'var(--success)' : isExpanded ? 'var(--accent)' : 'var(--bg-sunken)',
                  color: isCompleted || isExpanded ? '#fff' : 'var(--text-3)',
                  fontSize: 12, fontWeight: 700,
                  transition: 'all 0.2s',
                }}>
                  {isCompleted ? (
                    <span className="material-symbols-outlined" style={{ fontSize: 16, fontVariationSettings: "'FILL' 1" }}>check</span>
                  ) : (
                    i + 1
                  )}
                </div>

                <span style={{
                  flex: 1, fontSize: 13, fontWeight: 500,
                  color: isCompleted ? 'var(--success)' : 'var(--text)',
                  textDecoration: isCompleted ? 'line-through' : 'none',
                  opacity: isCompleted ? 0.7 : 1,
                }}>
                  {title}
                </span>

                <span className="material-symbols-outlined" style={{
                  color: 'var(--text-3)', fontSize: 18, flexShrink: 0,
                  transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)',
                  transition: 'transform 0.2s',
                }}>
                  expand_more
                </span>
              </button>

              {isExpanded && (
                <div style={{ padding: '0 14px 12px' }}>
                  <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.7, marginBottom: 10 }}>
                    {stripMarker(step)}
                  </p>
                  <label style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    cursor: 'pointer', fontSize: 12, color: 'var(--text-2)',
                  }}>
                    <input
                      type="checkbox"
                      checked={isCompleted}
                      onChange={() => handleCheck(i)}
                      style={{ accentColor: 'var(--accent)', width: 16, height: 16 }}
                    />
                    {isCompleted ? 'Completed' : 'Mark as completed'}
                  </label>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ScenarioDecision({ data }: { data: Stage3DeepDive['examScenario'] & { scenario: Stage3DeepDive['realWorldExample'] } }) {
  const [choice, setChoice] = useState<'wrong' | 'correct' | null>(null)
  const [shuffled] = useState(() => Math.random() > 0.5)

  const options = [
    { key: 'wrong' as const, label: 'A', text: data.wrongAnswer },
    { key: 'correct' as const, label: 'B', text: data.correctAnswer },
  ]

  const order = shuffled ? [options[1], options[0]] : options

  return (
    <div className="card" style={{ padding: 16, border: '1px solid var(--border)' }}>
      <div className="label" style={{ color: 'var(--text-2)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>business_center</span>
        Real World Scenario
      </div>

      <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.7, marginBottom: 14 }}>
        {data.scenario.scenario}
      </p>

      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        What would you do?
      </div>

      {!choice ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {order.map(opt => (
            <button
              key={opt.key}
              onClick={() => setChoice(opt.key)}
              className="card"
              style={{
                padding: '10px 14px',
                border: '1px solid var(--border)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s',
                background: 'var(--bg-raised)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'var(--accent)'
                e.currentTarget.style.background = 'var(--accent-dim)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--border)'
                e.currentTarget.style.background = 'var(--bg-raised)'
              }}
            >
              <span style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: 22, height: 22, borderRadius: '50%',
                background: 'var(--bg-sunken)', color: 'var(--text-3)',
                fontSize: 11, fontWeight: 700, marginRight: 10, flexShrink: 0,
              }}>
                {opt.label}
              </span>
              <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{opt.text}</span>
            </button>
          ))}
        </div>
      ) : (
        <div>
          {choice === 'correct' ? (
            <div style={{
              padding: 14, borderRadius: 10,
              background: 'rgba(82,183,136,0.1)',
              border: '1px solid var(--success)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span className="badge badge-success">Correct!</span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.7 }}>
                {data.scenario.outcome}
              </p>
            </div>
          ) : (
            <div style={{
              padding: 14, borderRadius: 10,
              background: 'var(--error-dim)',
              border: '1px solid var(--error)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span className="badge badge-error">Not quite</span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.7, marginBottom: 10 }}>
                That approach would not address the core issue. The correct action is:
              </p>
              <p style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500, marginBottom: 10 }}>
                {data.correctAnswer}
              </p>
              <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.7 }}>
                {data.scenario.outcome}
              </p>
              <button
                onClick={() => setChoice(null)}
                className="btn btn-ghost"
                style={{ fontSize: 12, marginTop: 10 }}
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function Stage3DeepDive({ data, topic }: Props) {
  const { certId } = useParams<{ certId: string }>()
  const resolvedCertId = certId ?? 'ccxp'

  const paragraphs = data.overview.split(/\n\n+/).filter(Boolean)

  return (
    <div className="card" style={{ marginTop: 16, padding: 20, display: 'flex', flexDirection: 'column', gap: 24, border: '1px solid var(--accent)', background: 'rgba(201,168,76,0.05)' }}>
      <div className="label" style={{ color: 'var(--accent)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>expand_circle_down</span>
        Deep Dive: {topic}
      </div>

      {/* Overview */}
      <div>
        <div className="label" style={{ color: 'var(--text-2)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>article</span>
          Overview
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {paragraphs.map((p, i) => (
            <p key={i} style={{ color: 'var(--text)', fontSize: 13, lineHeight: 1.7 }}>{stripMarker(p)}</p>
          ))}
        </div>
      </div>

      {/* How It Works - Accordion */}
      <StepAccordion steps={data.howItWorks} certId={resolvedCertId} domain={topic} topic={topic} />

      {/* Real World Scenario - Interactive */}
      <ScenarioDecision data={{ ...data.examScenario, scenario: data.realWorldExample }} />

      {/* Exam Scenario */}
      <div className="card" style={{ padding: 16, border: '1px solid var(--border)' }}>
        <div className="label" style={{ color: 'var(--text-2)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>quiz</span>
          Exam Scenario
        </div>
        <p style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500, marginBottom: 10 }}>
          {stripMarker(data.examScenario.question)}
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{
            display: 'flex', gap: 10, padding: '8px 12px',
            background: 'var(--error-dim)', borderRadius: 8,
            border: '1px solid var(--error)',
          }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--error)', fontSize: 18, flexShrink: 0 }}>cancel</span>
            <div>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--error)', textTransform: 'uppercase' }}>Wrong </span>
              <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{stripMarker(data.examScenario.wrongAnswer)}</span>
            </div>
          </div>
          <div style={{
            display: 'flex', gap: 10, padding: '8px 12px',
            background: 'rgba(82,183,136,0.1)', borderRadius: 8,
            border: '1px solid var(--success)',
          }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--success)', fontSize: 18, flexShrink: 0 }}>check_circle</span>
            <div>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--success)', textTransform: 'uppercase' }}>Correct </span>
              <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{stripMarker(data.examScenario.correctAnswer)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Frameworks */}
      {data.frameworks && data.frameworks.length > 0 && (
        <div>
          <div className="label" style={{ color: 'var(--text-2)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>hub</span>
            Frameworks
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {data.frameworks.map((fw, i) => (
              <div key={i} className="card" style={{ padding: '10px 14px', fontSize: 12, flex: '1 1 auto', minWidth: 140, border: '1px solid var(--border)' }}>
                <div style={{ color: 'var(--accent)', fontWeight: 600, marginBottom: 4, fontSize: 13 }}>{fw.name}</div>
                <div style={{ color: 'var(--text-2)', lineHeight: 1.5 }}>{stripMarker(fw.description)}</div>
                {fw.stages.length > 0 && (
                  <div style={{ color: 'var(--text-3)', marginTop: 6, fontSize: 10 }}>
                    {fw.stages.join(' → ')}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Memory Aid */}
      {data.memoryAid && (
        <div className="card" style={{ border: '1px solid var(--accent)', background: 'rgba(201,168,76,0.1)', padding: '12px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--accent)', fontSize: 18, flexShrink: 0 }}>lightbulb</span>
            <div>
              <span style={{ color: 'var(--accent)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>Memory Aid </span>
              <span style={{ color: 'var(--text)', fontSize: 13 }}>{stripMarker(data.memoryAid)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
