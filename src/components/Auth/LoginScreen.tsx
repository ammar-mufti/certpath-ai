import { startGithubLogin } from '../../services/auth'

export default function LoginScreen() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 1rem' }}>
      <div style={{ maxWidth: 448, width: '100%', textAlign: 'center' }}>
        <div style={{ marginBottom: 32 }}>
          <div style={{ color: 'var(--accent)', fontSize: '3rem', fontFamily: 'Noto Serif, Georgia, serif', marginBottom: 8 }}>CCXP</div>
          <div style={{ color: 'var(--text-2)', fontSize: 13, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Exam Simulator</div>
        </div>

        <div className="card" style={{ padding: '2rem' }}>
          <h1 style={{ color: 'var(--text)', fontFamily: 'Noto Serif, Georgia, serif', fontSize: '1.5rem', marginBottom: 8 }}>Welcome, Ammar</h1>
          <p style={{ color: 'var(--text-2)', fontSize: 13, marginBottom: 32 }}>
            Your CCXP exam prep platform. Study, practice, and pass.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 32, textAlign: 'center' }}>
            {[
              { label: '6', sub: 'Domains' },
              { label: '100+', sub: 'Questions' },
              { label: 'AI', sub: 'Powered' },
            ].map(item => (
              <div key={item.sub} style={{ background: 'var(--bg-raised)', borderRadius: 12, padding: '0.75rem' }}>
                <div style={{ color: 'var(--accent)', fontSize: '1.25rem', fontWeight: 700 }}>{item.label}</div>
                <div style={{ color: 'var(--text-2)', fontSize: 12 }}>{item.sub}</div>
              </div>
            ))}
          </div>

          <button
            onClick={startGithubLogin}
            style={{ width: '100%', background: 'var(--accent)', color: 'var(--accent-fg)', fontWeight: 700, padding: '12px 24px', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, border: 'none', cursor: 'pointer', transition: 'opacity 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.opacity = '0.88' }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
          >
            <svg style={{ width: 20, height: 20 }} fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
            </svg>
            Sign in with GitHub
          </button>

          <p style={{ color: 'var(--text-2)', fontSize: 12, marginTop: 16 }}>
            Used only for authentication. No data is stored.
          </p>
        </div>

        <p style={{ color: 'var(--text-3)', fontSize: 12, marginTop: 24 }}>
          CCXP exam is Saturday — you've got this.
        </p>
      </div>
    </div>
  )
}
