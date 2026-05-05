import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useHistoryStore } from '../store/historyStore'
import { useLearnStore } from '../store/learnStore'
import { AVAILABLE_CERTS, COMING_SOON_CERTS, getCert } from '../data/certifications'
import TopNav from '../components/Nav/TopNav'
import { AppShell } from '../components/Layout/AppShell'

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const h = Math.floor(diff / 3_600_000)
  if (h < 1) return 'just now'
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return d === 1 ? 'yesterday' : `${d} days ago`
}

export default function Dashboard() {
  const navigate   = useNavigate()
  const user       = useAuthStore(s => s.user)
  const { attempts, getBestScore, getAverageScore } = useHistoryStore()
  const { getDomainProgress } = useLearnStore()

  const firstName  = (user?.name ?? user?.login ?? 'there').split(' ')[0]
  const totalExams = attempts.length
  const bestScore  = totalExams > 0 ? (getBestScore() ?? 0) : 0
  const avgScore   = totalExams > 0 ? (getAverageScore() ?? 0) : 0
  const lastAttempt = attempts[0]
  const activeCert = lastAttempt ? getCert(lastAttempt.certId) : null

  return (
    <>
      <TopNav />
      <AppShell>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>

          {/* Welcome banner */}
          <div className="card" style={{
            padding: '1.75rem 2rem',
            marginBottom: '2rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '2rem',
            flexWrap: 'wrap',
            background: 'var(--bg-card)',
          }}>
            <div style={{ flex: 1, minWidth: 240 }}>
              <p className="label" style={{ marginBottom: 8 }}>YOUR DASHBOARD</p>
              <h1 style={{ fontSize: '1.75rem', marginBottom: 10 }}>
                Welcome back, {firstName}
              </h1>
              <p style={{ color: 'var(--text-2)', fontSize: 14, marginBottom: '1.25rem' }}>
                {activeCert
                  ? `Continue studying ${activeCert.name} — you're ${bestScore >= 70 ? 'looking exam ready' : 'making great progress'}.`
                  : 'Pick a certification below to start your AI-powered study session.'}
              </p>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {activeCert && (
                  <button
                    className="btn btn-primary"
                    onClick={() => navigate(`/${lastAttempt!.certId}/learn`)}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>play_arrow</span>
                    Resume Study
                  </button>
                )}
                {activeCert && (
                  <button
                    className="btn btn-secondary"
                    onClick={() => navigate(`/${lastAttempt!.certId}/exam`)}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit_note</span>
                    Practice Exam
                  </button>
                )}
              </div>
            </div>

            {/* Stats */}
            <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
              {[
                { label: 'BEST SCORE', value: totalExams ? `${bestScore}%` : '—', sub: totalExams ? (bestScore >= 70 ? 'Exam ready' : 'Keep going') : 'No exams yet' },
                { label: 'EXAMS TAKEN', value: totalExams, sub: 'Total attempts' },
                { label: 'AVG SCORE', value: totalExams ? `${avgScore}%` : '—', sub: 'All exams' },
              ].map(s => (
                <div key={s.label} style={{ textAlign: 'center', minWidth: 80 }}>
                  <p className="label" style={{ marginBottom: 6 }}>{s.label}</p>
                  <div style={{ fontSize: '1.75rem', fontWeight: 700, fontFamily: 'Noto Serif, serif', color: 'var(--accent)' }}>
                    {s.value}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>{s.sub}</div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Insight */}
          {totalExams > 0 && (
            <div className="ai-insight" style={{ marginBottom: '2rem' }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--accent)', marginTop: 1, fontSize: 20 }}>
                auto_awesome
              </span>
              <div>
                <p className="label" style={{ color: 'var(--accent)', marginBottom: 4 }}>AI PERFORMANCE INSIGHT</p>
                <p style={{ fontSize: 14, color: 'var(--text-2)' }}>
                  {lastAttempt?.pct >= 70
                    ? `Your last exam scored ${lastAttempt.pct}% — you passed! Reinforce weak domains before exam day.`
                    : `Your last exam scored ${lastAttempt?.pct ?? 0}%. Focus on ${lastAttempt?.domainScores?.sort((a,b) => a.pct - b.pct)[0]?.domain ?? 'weak domains'} to reach the pass mark.`
                  }
                </p>
              </div>
            </div>
          )}

          {/* Cert grid */}
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.25rem' }}>Certifications</h2>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '1rem',
            }}>
              {AVAILABLE_CERTS.map(cert => {
                const certAttempts = attempts.filter(a => a.certId === cert.id)
                const certBest = certAttempts.length ? Math.max(...certAttempts.map(a => a.pct)) : 0
                const overallProgress = cert.domains.length > 0
                  ? Math.round(cert.domains.reduce((s, d) => s + getDomainProgress(cert.id, d.name), 0) / cert.domains.length)
                  : 0
                const isActive = cert.id === lastAttempt?.certId

                return (
                  <button
                    key={cert.id}
                    onClick={() => navigate(`/${cert.id}/learn`)}
                    className="card"
                    style={{
                      padding: '1.25rem',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      border: isActive ? '1px solid var(--accent)' : '1px solid var(--border)',
                      width: '100%',
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'
                      ;(e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-lg)'
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
                      ;(e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                       <span className={`badge ${certAttempts.length > 0 || overallProgress > 0 ? 'badge-accent' : 'badge-gray'}`}>
                         {certAttempts.length > 0 || overallProgress > 0 ? 'IN PROGRESS' : 'NOT STARTED'}
                      </span>
                      <span style={{ fontSize: 24 }}>{cert.icon}</span>
                    </div>

                    <div style={{ fontFamily: 'Noto Serif, serif', fontWeight: 700, fontSize: '1.05rem', marginBottom: 6, color: 'var(--text)' }}>
                      {cert.fullName}
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 12, lineHeight: 1.5 }}>
                      {cert.about.substring(0, 85)}…
                    </p>

                    <div style={{ display: 'flex', gap: 8, fontSize: 12, color: 'var(--text-3)', marginBottom: 12, flexWrap: 'wrap' }}>
                      <span>{cert.examQuestions}Q</span>
                      <span>·</span>
                      <span>{cert.examDuration} min</span>
                      <span>·</span>
                      <span>Pass {cert.passingScore}%</span>
                      <span>·</span>
                      <span style={{ color: cert.difficulty === 'Beginner' ? 'var(--success)' : cert.difficulty === 'Intermediate' ? 'var(--accent)' : 'var(--error)' }}>
                        {cert.difficulty}
                      </span>
                    </div>

                    {(certAttempts.length > 0 || overallProgress > 0) && (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                          <span style={{ color: 'var(--text-3)' }}>Study progress</span>
                          <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{overallProgress}%</span>
                        </div>
                        <div className="progress-bar">
                          <div className="progress-fill" style={{ width: `${overallProgress}%` }} />
                        </div>
                        {certBest > 0 && (
                          <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-3)' }}>
                            Best exam score: <span style={{ color: certBest >= cert.passingScore ? 'var(--success)' : 'var(--error)', fontWeight: 600 }}>{certBest}%</span>
                          </div>
                        )}
                      </>
                    )}

                    {certAttempts.length === 0 && overallProgress === 0 && (
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <span style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600 }}>Start studying →</span>
                      </div>
                    )}
                  </button>
                )
              })}

              {COMING_SOON_CERTS.map(cert => (
                <div key={cert.id} className="card" style={{ padding: '1.25rem', opacity: 0.45 }}>
                  <div style={{ marginBottom: 8 }}>
                    <span className="badge badge-gray">COMING SOON</span>
                  </div>
                  <div style={{ fontFamily: 'Noto Serif, serif', fontWeight: 700, fontSize: '1.05rem', marginBottom: 6, color: 'var(--text)' }}>
                    {cert.fullName}
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-3)' }}>Coming soon to CertPath AI</p>
                </div>
              ))}
            </div>
          </div>

          {/* Recent activity */}
          {attempts.length > 0 && (
            <div className="card" style={{ padding: '1.25rem 1.5rem', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 style={{ fontSize: '1.1rem' }}>Recent Activity</h2>
                <button
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)', fontSize: 13, fontWeight: 600 }}
                  onClick={() => lastAttempt && navigate(`/${lastAttempt.certId}/history`)}
                >
                  View all →
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {attempts.slice(0, 5).map(a => {
                  const passed = a.pct >= (getCert(a.certId)?.passingScore ?? 70)
                  return (
                    <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                        background: passed ? 'var(--success)' : 'var(--error)',
                      }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {a.certName} — {a.mode === 'full' ? 'Full exam' : a.mode === 'mini' ? 'Mini drill' : `Domain: ${a.selectedDomain ?? ''}`}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>{formatRelative(a.date)}</div>
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 700, color: passed ? 'var(--success)' : 'var(--error)', flexShrink: 0 }}>
                        {a.pct}%
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Footer */}
          <footer style={{
            borderTop: '1px solid var(--border)', paddingTop: '1.5rem',
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '1.5rem', fontSize: 13, color: 'var(--text-3)',
          }}>
            <div>
              <div style={{ fontFamily: 'Noto Serif, serif', fontWeight: 700, fontSize: 15, color: 'var(--accent)', marginBottom: 6 }}>
                CertPath AI
              </div>
              <div style={{ fontSize: 11 }}>© 2026 — AI-powered certification prep.</div>
            </div>
            <div>
              <p className="label" style={{ marginBottom: 8 }}>LEGAL</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <a href="#" style={{ color: 'var(--text-3)' }}>Privacy Policy</a>
                <a href="#" style={{ color: 'var(--text-3)' }}>Terms of Service</a>
              </div>
            </div>
            <div>
              <p className="label" style={{ marginBottom: 8 }}>CONTACT</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <a href="mailto:muftiammar52@gmail.com" style={{ color: 'var(--text-3)' }}>muftiammar52@gmail.com</a>
                <a href="https://linkedin.com/in/ammarmufti" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-3)' }}>linkedin.com/in/ammarmufti</a>
              </div>
            </div>
          </footer>
        </div>
      </AppShell>
    </>
  )
}
