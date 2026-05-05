export default function MaintenancePage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 1rem' }}>
      <div style={{ textAlign: 'center', maxWidth: 448 }}>
        <div style={{ fontSize: '3.75rem', marginBottom: 24 }}>🔧</div>
        <h1 style={{ fontFamily: 'Noto Serif, Georgia, serif', fontSize: '1.875rem', color: 'var(--text)', marginBottom: 12 }}>Under Maintenance</h1>
        <p style={{ color: 'var(--text-2)', marginBottom: 8 }}>CertPath AI is temporarily unavailable.</p>
        <p style={{ color: 'var(--text-2)', fontSize: 13, marginBottom: 32 }}>We'll be back shortly. Check back in a few minutes.</p>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 'var(--r-full)', background: 'var(--bg-raised)', color: 'var(--text-2)', fontSize: 13 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--error)', animation: 'pulse 1.5s ease-in-out infinite' }} />
          Scheduled maintenance in progress
        </div>
      </div>
    </div>
  )
}
