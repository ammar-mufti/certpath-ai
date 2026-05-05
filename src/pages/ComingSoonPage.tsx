import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getCert } from '../data/certifications'
import TopNav from '../components/Nav/TopNav'

export default function ComingSoonPage() {
  const { certId } = useParams<{ certId: string }>()
  const navigate = useNavigate()
  const cert = getCert(certId ?? '')

  const [email, setEmail] = useState('')
  const [saved, setSaved] = useState(false)

  if (!cert) {
    navigate('/dashboard', { replace: true })
    return null
  }

  function handleNotify(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    try {
      const key = 'certpath_waitlist'
      const existing = JSON.parse(localStorage.getItem(key) ?? '[]') as { cert: string; email: string; date: string }[]
      const already = existing.some(item => item.cert === cert!.id && item.email === email)
      if (!already) {
        existing.push({ cert: cert!.id, email, date: new Date().toISOString() })
        localStorage.setItem(key, JSON.stringify(existing))
      }
    } catch { /* silent */ }
    setSaved(true)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <TopNav />
      <div style={{ maxWidth: 512, marginLeft: 'auto', marginRight: 'auto', padding: '5rem 1rem', textAlign: 'center' }}>
        <div style={{ fontSize: '3.75rem', marginBottom: 24, filter: 'grayscale(1)', opacity: 0.6 }}>{cert.icon}</div>
        <h1 style={{ fontFamily: 'Noto Serif, Georgia, serif', fontSize: '1.875rem', color: 'var(--text)', marginBottom: 8 }}>{cert.name}</h1>
        <p style={{ color: 'var(--text-2)', marginBottom: 4 }}>{cert.fullName}</p>
        <p style={{ color: 'var(--text-3)', fontSize: 13, marginBottom: 40 }}>Issued by {cert.issuer}</p>

        <div className="card" style={{ padding: '2rem', marginBottom: 24 }}>
          <h2 style={{ color: 'var(--text)', fontWeight: 600, fontSize: '1.125rem', marginBottom: 12 }}>This certification is coming soon to CertPath AI</h2>
          <p style={{ color: 'var(--text-2)', fontSize: 13, marginBottom: 24, lineHeight: 1.7 }}>
            We're building comprehensive study content for {cert.name}.
            Join the waitlist to be notified when it launches.
          </p>

          {saved ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: 'var(--success)' }}>
              <span>✓</span>
              <span style={{ fontWeight: 600 }}>You're on the list! We'll notify you when {cert.name} launches.</span>
            </div>
          ) : (
            <form onSubmit={handleNotify} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="input"
              />
              <button
                type="submit"
                className="btn btn-primary"
              >
                Notify Me →
              </button>
            </form>
          )}
        </div>

        <button
          onClick={() => navigate('/dashboard')}
          style={{ background: 'none', border: 'none', color: 'var(--text-2)', fontSize: 13, cursor: 'pointer', transition: 'color 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--text)' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-2)' }}
        >
          ← Back to Dashboard
        </button>
      </div>
    </div>
  )
}
