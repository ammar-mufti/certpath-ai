import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useThemeContext } from '../context/ThemeContext'
import { AVAILABLE_CERTS, COMING_SOON_CERTS } from '../data/certifications'
import type { Certification } from '../data/certifications'

function CertCard({ cert, onStart }: { cert: Certification; onStart: (id: string) => void }) {
  return (
    <button
      onClick={() => onStart(cert.id)}
      className="card"
      style={{
        padding: '1.25rem', textAlign: 'left', cursor: 'pointer',
        transition: 'all 0.2s', width: '100%', border: '1px solid var(--border)',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)'
        ;(e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'
        ;(e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-lg)'
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'
        ;(e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
        ;(e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <span style={{ fontSize: '2rem' }}>{cert.icon}</span>
        <div>
          <h3 style={{ fontSize: '1rem', marginBottom: 2 }}>{cert.name}</h3>
          <p style={{ fontSize: 11, color: 'var(--text-3)' }}>{cert.issuer}</p>
        </div>
      </div>
      <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 14, lineHeight: 1.5 }}>
        {cert.about.substring(0, 90)}…
      </p>
      <div style={{ display: 'flex', gap: 8, fontSize: 12, color: 'var(--text-3)', flexWrap: 'wrap' }}>
        <span>{cert.examQuestions}Q</span>
        <span>·</span>
        <span>Pass {cert.passingScore}%</span>
        <span>·</span>
        <span style={{
          color: cert.difficulty === 'Beginner' ? 'var(--success)' :
                 cert.difficulty === 'Intermediate' ? 'var(--accent)' : 'var(--error)',
        }}>
          {cert.difficulty}
        </span>
      </div>
    </button>
  )
}

function ComingSoonCard({ cert }: { cert: Certification }) {
  const [email, setEmail] = useState('')
  const [saved, setSaved] = useState(false)

  function handleNotify(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    try {
      const key = 'certpath_waitlist'
      const existing = JSON.parse(localStorage.getItem(key) ?? '[]') as { cert: string; email: string; date: string }[]
      existing.push({ cert: cert.id, email, date: new Date().toISOString() })
      localStorage.setItem(key, JSON.stringify(existing))
    } catch { /* silent */ }
    setSaved(true)
  }

  return (
    <div className="card" style={{ padding: '1.25rem', opacity: 0.55 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <span style={{ fontSize: '2rem', filter: 'grayscale(1)', opacity: 0.5 }}>{cert.icon}</span>
        <div>
          <h3 style={{ fontSize: '1rem' }}>{cert.name}</h3>
          <span className="badge badge-gray" style={{ fontSize: 10 }}>Coming soon</span>
        </div>
      </div>
      {saved ? (
        <p style={{ fontSize: 12, color: 'var(--text-2)' }}>We'll let you know when {cert.name} is ready.</p>
      ) : (
        <form onSubmit={handleNotify} style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <input
            type="email" placeholder="your@email.com" value={email}
            onChange={e => setEmail(e.target.value)}
            className="input" style={{ fontSize: 12, padding: '5px 10px' }}
          />
          <button type="submit" className="btn btn-secondary" style={{ fontSize: 12, padding: '5px 12px', flexShrink: 0 }}>
            Notify me
          </button>
        </form>
      )}
    </div>
  )
}

export default function LandingPage() {
  const navigate = useNavigate()
  const user = useAuthStore(s => s.user)
  const { isDark, toggle } = useThemeContext()

  function handleStart(certId: string) {
    navigate(user ? `/${certId}/learn` : '/login')
  }

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)', color: 'var(--text)' }}>

      {/* Nav */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: isDark ? 'rgba(35,31,23,0.92)' : 'rgba(255,255,255,0.92)',
        borderBottom: '1px solid var(--border)',
        backdropFilter: 'blur(12px)',
      }}>
        <div style={{
          maxWidth: 1200, margin: '0 auto', padding: '0 1.5rem',
          height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{ fontFamily: 'Noto Serif, serif', fontSize: '1.2rem', fontWeight: 700, color: 'var(--accent)' }}>
            CertPath AI
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={toggle}
              title={isDark ? 'Light mode' : 'Dark mode'}
              style={{
                width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: 'var(--r-full)', border: '1px solid var(--border)',
                background: 'var(--bg-raised)', color: 'var(--text-2)', cursor: 'pointer',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 17 }}>
                {isDark ? 'light_mode' : 'dark_mode'}
              </span>
            </button>
            {user ? (
              <button className="btn btn-primary" style={{ padding: '6px 16px', fontSize: 13 }} onClick={() => navigate('/dashboard')}>
                Dashboard
              </button>
            ) : (
              <button className="btn btn-primary" style={{ padding: '6px 16px', fontSize: 13 }} onClick={() => navigate('/login')}>
                Sign in
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section style={{ position: 'relative', overflow: 'hidden', padding: '5rem 1.5rem 4rem', textAlign: 'center' }}>
        <div style={{
          position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
          width: 700, height: 400, background: 'var(--accent-dim)',
          borderRadius: '50%', filter: 'blur(80px)', pointerEvents: 'none',
        }} />
        <div style={{ position: 'relative', maxWidth: 640, margin: '0 auto' }}>
          <p className="label" style={{ marginBottom: 16, color: 'var(--accent)' }}>AI-POWERED · FREE FOREVER</p>
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.25rem)', marginBottom: 16, lineHeight: 1.2 }}>
            Ace your next<br />
            <span style={{ color: 'var(--accent)' }}>certification</span>
          </h1>
          <p style={{ fontSize: '1.1rem', color: 'var(--text-2)', maxWidth: 500, margin: '0 auto 2rem', lineHeight: 1.7 }}>
            AI study guides, practice exams, and a personal tutor — for the credentials that move your career forward.
          </p>
          <button
            className="btn btn-primary"
            style={{ padding: '0.875rem 2.5rem', fontSize: '1rem', borderRadius: 'var(--r-full)' }}
            onClick={() => navigate(user ? '/dashboard' : '/login')}
          >
            Start studying free →
          </button>
        </div>
      </section>

      {/* Stats bar */}
      <section style={{
        borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)',
        padding: '1.25rem 1.5rem', background: 'var(--bg-raised)',
      }}>
        <div style={{
          maxWidth: 800, margin: '0 auto',
          display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '2rem 3rem', textAlign: 'center',
        }}>
          {[
            { n: '5', label: 'certifications' },
            { n: '500+', label: 'practice questions' },
            { n: '4', label: 'learning stages' },
            { n: 'Free', label: 'no credit card' },
          ].map(s => (
            <div key={s.label}>
              <div style={{ fontFamily: 'Noto Serif, serif', fontWeight: 700, fontSize: '1.25rem', color: 'var(--accent)' }}>{s.n}</div>
              <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Cert grid */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '4rem 1.5rem' }}>
        <h2 style={{ fontSize: '1.75rem', marginBottom: 8 }}>Choose your certification</h2>
        <p style={{ color: 'var(--text-2)', marginBottom: '2.5rem', fontSize: 14 }}>
          Start studying today — fully free, no account required to browse.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem', marginBottom: '3rem' }}>
          {AVAILABLE_CERTS.map(cert => (
            <CertCard key={cert.id} cert={cert} onStart={handleStart} />
          ))}
        </div>

        <h2 style={{ fontSize: '1.4rem', color: 'var(--text-2)', marginBottom: 6 }}>Coming soon</h2>
        <p style={{ color: 'var(--text-3)', fontSize: 13, marginBottom: '1.5rem' }}>
          Join the waitlist and we'll notify you when these launch.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
          {COMING_SOON_CERTS.map(cert => (
            <ComingSoonCard key={cert.id} cert={cert} />
          ))}
        </div>
      </section>

      {/* How it works */}
      <section style={{
        background: 'var(--bg-raised)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)',
        padding: '4rem 1.5rem',
      }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <h2 style={{ fontSize: '1.75rem', marginBottom: 8 }}>How it works</h2>
          <p style={{ color: 'var(--text-2)', marginBottom: '3rem', fontSize: 14 }}>
            Three stages, one outcome: passing your exam with confidence.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '2.5rem' }}>
            {[
              { n: '01', title: 'Choose your cert', desc: 'Pick from five certifications across CX, project management, cloud, agile, and ITSM.' },
              { n: '02', title: 'Study with AI', desc: 'Domain summaries, key concepts, flashcards, and practice questions generated for your specific exam.' },
              { n: '03', title: 'Pass the exam', desc: 'Track weak domains, run timed mock exams, and go into exam day knowing exactly where you stand.' },
            ].map(s => (
              <div key={s.n}>
                <div style={{ fontFamily: 'Noto Serif, serif', fontSize: '3rem', fontWeight: 700, color: 'var(--accent-dim)', marginBottom: '1rem', lineHeight: 1 }}>
                  {s.n}
                </div>
                <h3 style={{ fontSize: '1.05rem', marginBottom: 8 }}>{s.title}</h3>
                <p style={{ color: 'var(--text-2)', fontSize: 13, lineHeight: 1.6 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border)', padding: '2.5rem 1.5rem' }}>
        <div style={{
          maxWidth: 900, margin: '0 auto',
          display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '1.5rem',
          fontSize: 13, color: 'var(--text-3)',
        }}>
          <div>
            <div style={{ fontFamily: 'Noto Serif, serif', fontWeight: 700, fontSize: '1.1rem', color: 'var(--accent)', marginBottom: 6 }}>
              CertPath AI
            </div>
            <p style={{ fontSize: 11 }}>AI-powered prep for the certifications that advance your career.</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, textAlign: 'right' }}>
            <a href="mailto:muftiammar52@gmail.com" style={{ color: 'var(--text-3)' }}>muftiammar52@gmail.com</a>
            <a href="https://linkedin.com/in/ammarmufti" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-3)' }}>
              linkedin.com/in/ammarmufti
            </a>
            <span style={{ color: 'var(--border)', fontSize: 11 }}>Built with Claude · GitHub Pages</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
