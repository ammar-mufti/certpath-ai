export default function EmptyHistory() {
  return (
    <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
      <div style={{ fontSize: '3rem', marginBottom: 16 }}>📊</div>
      <h2 style={{ color: 'var(--text)', fontFamily: 'Noto Serif, Georgia, serif', fontSize: '1.25rem', marginBottom: 8 }}>No exam history yet</h2>
      <p style={{ color: 'var(--text-2)', fontSize: 13 }}>Complete a practice exam to start tracking your progress</p>
    </div>
  )
}
