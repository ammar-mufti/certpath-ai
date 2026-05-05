import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useLearnStore } from '../../store/learnStore'
import { useHistoryStore } from '../../store/historyStore'
import { contentCache } from '../../services/contentCache'
import { getCert } from '../../data/certifications'
import { toDomainSlug, getDomainIcon } from '../../utils/domainUtils'
import { AppShell } from '../Layout/AppShell'
import { CertSidebar } from '../Layout/CertSidebar'
import TopNav from '../Nav/TopNav'

export default function LearnHome() {
  const { certId } = useParams<{ certId: string }>()
  const navigate = useNavigate()
  const cert = getCert(certId ?? '')
  const { getDomainProgress, resetProgress } = useLearnStore()
  const { attempts } = useHistoryStore()
  const [resetMode, setResetMode] = useState<null | 'all' | 'content'>(null)
  const [toast, setToast] = useState<string | null>(null)

  if (!cert) return null

  const userId     = useAuthStore.getState().user?.id ?? 'anonymous'
  const examDateKey = `${userId}_${certId}_exam_date`
  const examDate   = localStorage.getItem(examDateKey)

  const overallProgress = cert.domains.length > 0
    ? Math.round(cert.domains.reduce((s, d) => s + getDomainProgress(certId ?? '', d.name), 0) / cert.domains.length)
    : 0

  const certAttempts = attempts.filter(a => a.certId === certId)
  let weakDomain: string | null = null
  if (certAttempts.length > 0 && certAttempts[0].domainScores?.length > 0) {
    weakDomain = [...certAttempts[0].domainScores].sort((a, b) => a.pct - b.pct)[0].domain
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  function handleResetAll() {
    contentCache.clearCert(certId ?? '')
    resetProgress()
    setResetMode(null)
    showToast('Progress reset — fresh content generates as you study')
    setTimeout(() => window.location.reload(), 1500)
  }

  function handleResetContent() {
    contentCache.clearCert(certId ?? '')
    setResetMode(null)
    showToast('AI content cleared — will regenerate as you study')
    setTimeout(() => window.location.reload(), 1500)
  }

  return (
    <>
      <TopNav />
      <AppShell sidebar={<CertSidebar />}>
        {toast && (
          <div style={{
            position: 'fixed', top: 70, left: '50%', transform: 'translateX(-50%)',
            zIndex: 200, background: 'var(--bg-card)', color: 'var(--text)',
            fontSize: 13, fontWeight: 500, padding: '10px 20px',
            borderRadius: 'var(--r)', boxShadow: 'var(--shadow-lg)',
            border: '1px solid var(--border)',
          }}>
            {toast}
          </div>
        )}

        <div style={{ maxWidth: 760 }}>
          {/* Header */}
          <div style={{ marginBottom: '2rem' }}>
            <p className="label" style={{ marginBottom: 8 }}>{cert.issuer} · {new Date().getFullYear()}</p>
            <h1 style={{ fontSize: '2rem', marginBottom: 8 }}>{cert.name} Study Guide</h1>
            <p style={{ color: 'var(--text-2)', fontSize: 14, maxWidth: 500, lineHeight: 1.6 }}>{cert.about}</p>
          </div>

          {/* AI Insight */}
          <div className="ai-insight" style={{ marginBottom: '1.75rem' }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--accent)', fontSize: 20 }}>
              auto_awesome
            </span>
            <div>
              <p className="label" style={{ color: 'var(--accent)', marginBottom: 4 }}>AI RECOMMENDED FOCUS</p>
              <p style={{ fontSize: 14, color: 'var(--text-2)' }}>
                {weakDomain
                  ? `Focus on "${weakDomain}" — it was your weakest domain in your last exam.`
                  : cert.domains[0]
                    ? `Start with ${cert.domains[0].name} — it's worth ${cert.domains[0].percentage}% of your exam.`
                    : 'Begin with the first domain to build foundational knowledge.'
                }
              </p>
            </div>
          </div>

          {/* Progress card */}
          <div className="card" style={{ padding: '1.25rem 1.5rem', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
              <div>
                <p className="label" style={{ marginBottom: 4 }}>OVERALL READINESS</p>
                <div style={{ fontFamily: 'Noto Serif, serif', fontSize: '1.75rem', fontWeight: 700, color: 'var(--text)' }}>
                  {overallProgress}%
                  <span style={{ fontSize: '0.9rem', fontWeight: 400, color: 'var(--text-3)' }}> / 100%</span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p className="label" style={{ marginBottom: 4 }}>EXAM INFO</p>
                <p style={{ color: 'var(--accent)', fontWeight: 600, fontSize: 14 }}>
                  {cert.examQuestions}Q · Pass {cert.passingScore}%
                </p>
                {examDate && (
                  <p style={{ fontSize: 12, marginTop: 2, color: 'var(--text-3)' }}>
                    Exam: {new Date(examDate).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${overallProgress}%` }} />
            </div>

            {!examDate && (
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 17, color: 'var(--accent)' }}>calendar_today</span>
                <span style={{ fontSize: 13, color: 'var(--text-2)', flex: 1 }}>Set your exam date for a countdown</span>
                <input
                  type="date"
                  className="input"
                  style={{ width: 'auto', padding: '4px 10px', fontSize: 13 }}
                  onChange={e => { localStorage.setItem(examDateKey, e.target.value); window.location.reload() }}
                />
              </div>
            )}
          </div>

          {/* Domain modules */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: '2rem' }}>
            {cert.domains.map((domain, idx) => {
              const hasContent  = contentCache.hasContent(certId ?? '', domain.name)
              const generatedDate = contentCache.getGeneratedDate(certId ?? '', domain.name)
              const progress    = getDomainProgress(certId ?? '', domain.name)
              const isFirst     = idx === 0 && !hasContent

              return (
                <div key={domain.name}>
                  <button
                    type="button"
                    onClick={() => navigate(`/${certId}/learn/${toDomainSlug(domain.name)}`)}
                    className="card"
                    style={{
                      width: '100%', textAlign: 'left',
                      padding: '1rem 1.25rem',
                      display: 'flex', alignItems: 'center',
                      justifyContent: 'space-between', gap: '1rem',
                      cursor: 'pointer', transition: 'all 0.2s',
                      border: isFirst ? '1px solid var(--accent)' : '1px solid var(--border)',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = isFirst ? 'var(--accent)' : 'var(--border)' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{
                        width: 40, height: 40, flexShrink: 0,
                        background: hasContent ? 'var(--accent-dim)' : 'var(--bg-raised)',
                        border: `1px solid ${hasContent ? 'var(--accent)' : 'var(--border)'}`,
                        borderRadius: 10,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: hasContent ? 'var(--accent)' : 'var(--text-3)',
                      }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 19 }}>
                          {getDomainIcon(domain.name)}
                        </span>
                      </div>
                      <div>
                        <p className="label" style={{ marginBottom: 2 }}>
                          MODULE {String(idx + 1).padStart(2, '0')} · {domain.percentage}% OF EXAM
                        </p>
                        <div style={{ fontFamily: 'Noto Serif, serif', fontWeight: 600, fontSize: '1.05rem', color: 'var(--text)' }}>
                          {domain.name}
                        </div>
                        <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
                          {domain.topics.length} topics · {domain.weight} questions
                          {generatedDate && <span> · {generatedDate}</span>}
                        </p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                      {progress > 0 && (
                        <span style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600 }}>{progress}%</span>
                      )}
                      <span className="material-symbols-outlined" style={{ color: 'var(--text-3)', fontSize: 18 }}>
                        chevron_right
                      </span>
                    </div>
                  </button>

                  {progress > 0 && (
                    <div style={{ padding: '4px 1.25rem 0' }}>
                      <div className="progress-bar" style={{ height: 3 }}>
                        <div className="progress-fill" style={{ width: `${progress}%`, height: '100%' }} />
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Take exam CTA */}
          <button
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.875rem', fontSize: 14, marginBottom: '2rem' }}
            onClick={() => navigate(`/${certId}/exam`)}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>edit_note</span>
            Take {cert.name} practice exam
          </button>

          {/* Reset section */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
            {resetMode === null && (
              <div style={{ display: 'flex', gap: 16 }}>
                <button
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', fontSize: 13 }}
                  onClick={() => setResetMode('all')}
                >
                  ↺ Reset study progress
                </button>
                <span style={{ color: 'var(--border)' }}>·</span>
                <button
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', fontSize: 13 }}
                  onClick={() => setResetMode('content')}
                >
                  ↺ Regenerate AI content
                </button>
              </div>
            )}

            {resetMode === 'all' && (
              <div className="card" style={{ padding: '1rem 1.25rem', border: '1px solid var(--error-dim)' }}>
                <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>Reset {cert.name} study progress?</p>
                <p style={{ color: 'var(--text-2)', fontSize: 13, marginBottom: 12 }}>
                  Clears AI content, topic read marks, and quiz scores. Exam history is kept.
                </p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-ghost" style={{ fontSize: 13 }} onClick={() => setResetMode(null)}>Cancel</button>
                  <button className="btn btn-danger" style={{ fontSize: 13 }} onClick={handleResetAll}>Yes, reset</button>
                </div>
              </div>
            )}

            {resetMode === 'content' && (
              <div className="card" style={{ padding: '1rem 1.25rem' }}>
                <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>Regenerate {cert.name} AI content?</p>
                <p style={{ color: 'var(--text-2)', fontSize: 13, marginBottom: 12 }}>
                  Clears cached AI content only. Progress and exam history are kept.
                </p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-ghost" style={{ fontSize: 13 }} onClick={() => setResetMode(null)}>Cancel</button>
                  <button className="btn btn-primary" style={{ fontSize: 13 }} onClick={handleResetContent}>Yes, regenerate</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </AppShell>
    </>
  )
}
