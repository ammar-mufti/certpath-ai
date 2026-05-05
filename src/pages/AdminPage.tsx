import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import TopNav from '../components/Nav/TopNav'
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'

const WORKER_URL = import.meta.env.VITE_WORKER_URL as string

interface AdminUser {
  id: string
  name: string
  email: string
  provider: string
  createdAt: string
  lastActive: string | null
  certsStudied: string[]
  examsCompleted: number
  lastExamScore: number | null
  lastExamCert: string | null
}

interface AdminStats {
  users: {
    total: number
    newThisWeek: number
    newThisMonth: number
    byProvider: { google: number; github: number; email: number }
  }
  activity: {
    totalExams: number
    avgScore: number
    activeThisWeek: number
  }
  list: AdminUser[]
}

interface Settings {
  maintenance: boolean
  featuredCert: string
  banner: string
}

function formatDate(iso: string | null) {
  if (!iso) return 'Never'
  const d = new Date(iso)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  if (diff < 60_000) return 'Just now'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`
  if (diff < 7 * 86_400_000) return `${Math.floor(diff / 86_400_000)}d ago`
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function ProviderBadge({ provider }: { provider: string }) {
  const styles: Record<string, { bg: string; color: string }> = {
    google: { bg: 'rgba(66,133,244,0.15)', color: '#4285F4' },
    github: { bg: 'var(--bg-raised)', color: 'var(--text-2)' },
    email:  { bg: 'var(--accent-dim)', color: 'var(--accent)' },
  }
  const s = styles[provider] ?? styles.email
  return (
    <span style={{
      fontSize: 10,
      fontWeight: 600,
      letterSpacing: '0.05em',
      textTransform: 'uppercase',
      padding: '2px 8px',
      borderRadius: 9999,
      background: s.bg,
      color: s.color,
    }}>
      {provider}
    </span>
  )
}

function StatCard({ label, value, icon, accent = 'var(--accent)' }: { label: string; value: string | number; icon: string; accent?: string }) {
  return (
    <div className="card" style={{ padding: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span className="material-symbols-outlined" style={{ color: accent, fontSize: 20 }}>{icon}</span>
        <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-3)' }}>{label}</span>
      </div>
      <p style={{ fontFamily: 'Noto Serif, serif', fontSize: '1.5rem', fontWeight: 700, color: accent }} className="tabular">
        {value}
      </p>
    </div>
  )
}

function UserModal({ user, onClose, onDelete }: { user: AdminUser; onClose: () => void; onDelete: (email: string) => void }) {
  const [confirming, setConfirming] = useState(false)
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 100, padding: '0 16px',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="card"
        style={{ width: '100%', maxWidth: 440, padding: '1.5rem' }}
      >
        {/* User header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 20 }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            background: 'var(--accent-dim)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--accent)', fontWeight: 700, fontSize: 18,
            flexShrink: 0, fontFamily: 'Noto Serif, serif',
          }}>
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ fontFamily: 'Noto Serif, serif', fontWeight: 600, color: 'var(--text)' }}>{user.name}</h3>
            <p style={{ color: 'var(--text-2)', fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
              <ProviderBadge provider={user.provider} />
              <span style={{ color: 'var(--text-3)', fontSize: 12 }}>Joined {formatDate(user.createdAt)}</span>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', display: 'flex' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
          </button>
        </div>

        {/* Activity */}
        <div style={{ background: 'var(--bg-raised)', borderRadius: 12, padding: '1rem', marginBottom: 16 }}>
          <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 8 }}>Activity</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <p style={{ color: 'var(--text-3)', fontSize: 11 }}>Last active</p>
              <p style={{ color: 'var(--text)', fontSize: 13 }}>{formatDate(user.lastActive)}</p>
            </div>
            <div>
              <p style={{ color: 'var(--text-3)', fontSize: 11 }}>Exams completed</p>
              <p style={{ color: 'var(--text)' }} className="tabular">{user.examsCompleted}</p>
            </div>
          </div>
        </div>

        {/* Certs studied */}
        {user.certsStudied.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 8 }}>Certifications studied</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {user.certsStudied.map(c => (
                <span key={c} style={{
                  padding: '4px 10px', borderRadius: 8,
                  background: 'var(--accent-dim)', color: 'var(--accent)',
                  fontSize: 12, fontWeight: 600,
                }}>
                  {c.toUpperCase()}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Last exam */}
        {user.lastExamCert && (
          <p style={{ color: 'var(--text-2)', fontSize: 13, marginBottom: 16 }}>
            Last exam: <span style={{ color: 'var(--text)', fontWeight: 500 }}>{user.lastExamCert.toUpperCase()}</span>
            {user.lastExamScore !== null && (
              <> · <span style={{ color: user.lastExamScore >= 70 ? 'var(--success)' : 'var(--error)', fontWeight: 600 }}>{user.lastExamScore}% {user.lastExamScore >= 70 ? 'PASS' : 'FAIL'}</span></>
            )}
          </p>
        )}

        {/* Delete confirmation */}
        {confirming ? (
          <div style={{
            background: 'var(--error-dim)', border: '1px solid var(--error)',
            borderRadius: 12, padding: '1rem',
          }}>
            <p style={{ color: 'var(--error)', fontSize: 13, marginBottom: 12 }}>Delete {user.name}&apos;s account? This cannot be undone.</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setConfirming(false)} className="btn btn-secondary" style={{ flex: 1, fontSize: 13 }}>Cancel</button>
              <button onClick={() => onDelete(user.email)} className="btn btn-danger" style={{ flex: 1, fontSize: 13 }}>Delete</button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onClose} className="btn btn-secondary" style={{ flex: 1, fontSize: 13 }}>Close</button>
            <button onClick={() => setConfirming(true)} style={{
              padding: '6px 16px', borderRadius: 8,
              border: '1px solid var(--error)', background: 'transparent',
              color: 'var(--error)', fontSize: 13, cursor: 'pointer', fontWeight: 500,
            }}>
              Delete account
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function AdminPage() {
  const { token } = useAuthStore()
  const navigate = useNavigate()
  const [tab, setTab] = useState<'overview' | 'users' | 'activity' | 'settings'>('overview')
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)
  const [settings, setSettings] = useState<Settings>({ maintenance: false, featuredCert: '', banner: '' })
  const [settingsSaved, setSettingsSaved] = useState(false)

  const PER_PAGE = 20

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const [statsRes, settingsRes] = await Promise.all([
          fetch(`${WORKER_URL}/api/admin/stats`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${WORKER_URL}/api/admin/settings`, { headers: { Authorization: `Bearer ${token}` } }),
        ])
        if (statsRes.ok) setStats(await statsRes.json())
        if (settingsRes.ok) setSettings(await settingsRes.json())
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [token])

  async function deleteUser(email: string) {
    await fetch(`${WORKER_URL}/api/admin/users/${encodeURIComponent(email)}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    setSelectedUser(null)
    setStats(prev => prev
      ? { ...prev, list: prev.list.filter(u => u.email !== email), users: { ...prev.users, total: prev.users.total - 1 } }
      : prev
    )
  }

  async function saveSettings() {
    await fetch(`${WORKER_URL}/api/admin/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(settings),
    })
    setSettingsSaved(true)
    setTimeout(() => setSettingsSaved(false), 2000)
  }

  const filteredUsers = (stats?.list ?? []).filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )
  const pageUsers = filteredUsers.slice(page * PER_PAGE, (page + 1) * PER_PAGE)
  const totalPages = Math.ceil(filteredUsers.length / PER_PAGE)

  const activityChartData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    const dayStart = new Date(d.setHours(0, 0, 0, 0)).getTime()
    const dayEnd = dayStart + 86_400_000
    const count = (stats?.list ?? []).filter(u => {
      if (!u.lastActive) return false
      const t = new Date(u.lastActive).getTime()
      return t >= dayStart && t < dayEnd
    }).length
    return { day: d.toLocaleDateString('en-GB', { weekday: 'short' }), users: count }
  })

  const scoreBuckets = [
    { label: '0–50%', min: 0, max: 50 },
    { label: '51–60%', min: 51, max: 60 },
    { label: '61–70%', min: 61, max: 70 },
    { label: '71–80%', min: 71, max: 80 },
    { label: '81–90%', min: 81, max: 90 },
    { label: '91–100%', min: 91, max: 100 },
  ]
  const scoreDistData = scoreBuckets.map(b => ({
    label: b.label,
    count: (stats?.list ?? []).filter(u => u.lastExamScore !== null && u.lastExamScore >= b.min && u.lastExamScore <= b.max).length,
  }))

  const certCounts: Record<string, number> = {}
  for (const u of stats?.list ?? []) {
    for (const c of u.certsStudied) certCounts[c] = (certCounts[c] ?? 0) + 1
  }
  const certChartData = Object.entries(certCounts)
    .map(([cert, count]) => ({ cert: cert.toUpperCase(), count }))
    .sort((a, b) => b.count - a.count)

  const TABS = [
    { id: 'overview', label: 'Overview', icon: 'home' },
    { id: 'users', label: 'Users', icon: 'group' },
    { id: 'activity', label: 'Activity', icon: 'analytics' },
    { id: 'settings', label: 'Settings', icon: 'settings' },
  ] as const

  const tooltipStyle = {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    color: 'var(--text)',
    fontSize: 12,
  }

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)' }}>
      <TopNav />

      <div style={{ display: 'flex' }}>
        {/* Sidebar */}
        <aside style={{
          width: 208,
          background: 'var(--bg-card)',
          borderRight: '1px solid var(--border)',
          flexShrink: 0,
          height: 'calc(100dvh - 56px)',
          position: 'sticky',
          top: 56,
          display: 'flex',
          flexDirection: 'column',
        }}>
          <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent)' }}>Admin</span>
            <p style={{ fontFamily: 'Noto Serif, serif', fontWeight: 600, color: 'var(--text)', marginTop: 4, fontSize: 14 }}>Platform Management</p>
          </div>
          <nav style={{ padding: 8, display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '10px 12px',
                  borderRadius: 12,
                  fontSize: 14,
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  background: tab === t.id ? 'var(--accent-dim)' : 'transparent',
                  color: tab === t.id ? 'var(--accent)' : 'var(--text-2)',
                }}
                onMouseEnter={e => {
                  if (tab !== t.id) e.currentTarget.style.background = 'var(--bg-raised)'
                }}
                onMouseLeave={e => {
                  if (tab !== t.id) e.currentTarget.style.background = 'transparent'
                }}
              >
                <span className="material-symbols-outlined" style={{
                  fontSize: 18,
                  fontVariationSettings: tab === t.id ? "'FILL' 1" : "'FILL' 0",
                }}>
                  {t.icon}
                </span>
                {t.label}
              </button>
            ))}
          </nav>
          <div style={{ padding: 8, borderTop: '1px solid var(--border)' }}>
            <button
              onClick={() => navigate('/dashboard')}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 12px',
                borderRadius: 8,
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                color: 'var(--text-3)',
                fontSize: 13,
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-raised)'; e.currentTarget.style.color = 'var(--text-2)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-3)' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_back</span>
              Back to app
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main style={{ flex: 1, overflow: 'auto' }}>
          <div style={{ maxWidth: 800, margin: '0 auto', padding: '2rem 1.5rem' }}>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 256, gap: 12 }}>
                <div style={{
                  width: 32, height: 32,
                  border: '2px solid var(--accent-dim)', borderTopColor: 'var(--accent)',
                  borderRadius: '50%',
                  animation: 'spin 0.6s linear infinite',
                }} />
                <p style={{ color: 'var(--text-2)', fontSize: 14 }}>Loading admin data…</p>
              </div>
            ) : (
              <>
                {/* OVERVIEW */}
                {tab === 'overview' && stats && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    <div>
                      <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--accent)' }}>Overview</span>
                      <h1 style={{ fontFamily: 'Noto Serif, serif', fontSize: '1.75rem', color: 'var(--text)', marginTop: 4 }}>Platform dashboard</h1>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
                      <StatCard label="Total Users" value={stats.users.total} icon="group" />
                      <StatCard label="New This Week" value={stats.users.newThisWeek} icon="person_add" accent="var(--text-2)" />
                      <StatCard label="Exams Taken" value={stats.activity.totalExams} icon="edit_note" accent="var(--text-3)" />
                      <StatCard label="Avg Score" value={`${stats.activity.avgScore}%`} icon="analytics" />
                    </div>

                    {/* Sign-up providers */}
                    <div className="card" style={{ padding: '1.25rem' }}>
                      <h2 style={{ fontFamily: 'Noto Serif, serif', fontWeight: 600, color: 'var(--text)', marginBottom: 16 }}>Sign-up providers</h2>
                      {[
                        { label: 'Google', count: stats.users.byProvider.google, color: '#4285F4' },
                        { label: 'GitHub', count: stats.users.byProvider.github, color: 'var(--text-3)' },
                        { label: 'Email', count: stats.users.byProvider.email, color: 'var(--accent)' },
                      ].map(p => (
                        <div key={p.label} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                          <span style={{ color: 'var(--text-2)', fontSize: 13, width: 56 }}>{p.label}</span>
                          <div style={{ flex: 1, height: 6, background: 'var(--bg-sunken)', borderRadius: 9999 }}>
                            <div
                              style={{ height: '100%', borderRadius: 9999, background: p.color, width: `${stats.users.total ? (p.count / stats.users.total) * 100 : 0}%` }}
                            />
                          </div>
                          <span style={{ color: 'var(--text-3)', fontSize: 12, width: 80, textAlign: 'right' }} className="tabular">
                            {p.count} ({stats.users.total ? Math.round((p.count / stats.users.total) * 100) : 0}%)
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Active users chart */}
                    <div className="card" style={{ padding: '1.25rem' }}>
                      <h2 style={{ fontFamily: 'Noto Serif, serif', fontWeight: 600, color: 'var(--text)', marginBottom: 16 }}>Active users — last 7 days</h2>
                      <ResponsiveContainer width="100%" height={160}>
                        <LineChart data={activityChartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.4} />
                          <XAxis dataKey="day" tick={{ fill: 'var(--text-3)', fontSize: 11 }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fill: 'var(--text-3)', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                          <Tooltip contentStyle={tooltipStyle} />
                          <Line type="monotone" dataKey="users" stroke="var(--accent)" strokeWidth={2} dot={{ fill: 'var(--accent)', r: 3 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Cert popularity */}
                    {certChartData.length > 0 && (
                      <div className="card" style={{ padding: '1.25rem' }}>
                        <h2 style={{ fontFamily: 'Noto Serif, serif', fontWeight: 600, color: 'var(--text)', marginBottom: 16 }}>Most popular certifications</h2>
                        {certChartData.map(c => (
                          <div key={c.cert} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                            <span style={{ color: 'var(--text-2)', fontSize: 13, width: 80, fontWeight: 500 }}>{c.cert}</span>
                            <div style={{ flex: 1, height: 6, background: 'var(--bg-sunken)', borderRadius: 9999 }}>
                              <div
                                style={{ height: '100%', borderRadius: 9999, background: 'var(--accent)', width: `${certChartData[0].count ? (c.count / certChartData[0].count) * 100 : 0}%` }}
                              />
                            </div>
                            <span style={{ color: 'var(--text-3)', fontSize: 12, width: 64, textAlign: 'right' }} className="tabular">{c.count} users</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* USERS */}
                {tab === 'users' && stats && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                      <div>
                        <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--accent)' }}>Users</span>
                        <h1 style={{ fontFamily: 'Noto Serif, serif', fontSize: '1.5rem', color: 'var(--text)', marginTop: 4 }}>{stats.users.total} registered users</h1>
                      </div>
                      <div style={{ position: 'relative' }}>
                        <span className="material-symbols-outlined" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', fontSize: 18 }}>search</span>
                        <input
                          type="text"
                          placeholder="Search by name or email…"
                          value={search}
                          onChange={e => { setSearch(e.target.value); setPage(0) }}
                          className="input"
                          style={{ paddingLeft: 40, width: 260 }}
                        />
                      </div>
                    </div>

                    {/* User table */}
                    <div className="card" style={{ overflow: 'hidden' }}>
                      <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--border)' }}>
                            {['Name / Email', 'Via', 'Joined', 'Last active', 'Exams', 'Score', ''].map(h => (
                              <th key={h} style={{
                                textAlign: 'left', padding: '12px 16px',
                                fontSize: 10, fontWeight: 600, letterSpacing: '0.08em',
                                textTransform: 'uppercase', color: 'var(--text-3)',
                              }}>
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {pageUsers.map(u => (
                            <tr key={u.id} style={{
                              borderBottom: '1px solid var(--border-2)',
                              transition: 'background 0.15s',
                            }}
                              onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-raised)' }}
                              onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                            >
                              <td style={{ padding: '12px 16px' }}>
                                <p style={{ color: 'var(--text)', fontWeight: 500, fontSize: 13 }}>{u.name}</p>
                                <p style={{ color: 'var(--text-3)', fontSize: 12 }}>{u.email}</p>
                              </td>
                              <td style={{ padding: '12px 16px' }}><ProviderBadge provider={u.provider} /></td>
                              <td style={{ padding: '12px 16px', color: 'var(--text-3)', fontSize: 12 }}>{formatDate(u.createdAt)}</td>
                              <td style={{ padding: '12px 16px', color: 'var(--text-3)', fontSize: 12 }}>{formatDate(u.lastActive)}</td>
                              <td style={{ padding: '12px 16px', color: 'var(--text)' }} className="tabular">{u.examsCompleted}</td>
                              <td style={{ padding: '12px 16px' }}>
                                {u.lastExamScore !== null
                                  ? <span style={{ fontWeight: 600, color: u.lastExamScore >= 70 ? 'var(--success)' : 'var(--error)' }} className="tabular">{u.lastExamScore}%</span>
                                  : <span style={{ color: 'var(--text-3)' }}>—</span>
                                }
                              </td>
                              <td style={{ padding: '12px 16px' }}>
                                <button
                                  onClick={() => setSelectedUser(u)}
                                  style={{
                                    background: 'none', border: 'none', cursor: 'pointer',
                                    color: 'var(--accent)', fontSize: 12, fontWeight: 600,
                                  }}
                                >
                                  View
                                </button>
                              </td>
                            </tr>
                          ))}
                          {pageUsers.length === 0 && (
                            <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)' }}>No users found</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        <button
                          disabled={page === 0}
                          onClick={() => setPage(p => p - 1)}
                          style={{
                            width: 32, height: 32, borderRadius: 8,
                            border: '1px solid var(--border)', background: 'transparent',
                            cursor: 'pointer', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', color: 'var(--text-2)',
                            opacity: page === 0 ? 0.3 : 1,
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>chevron_left</span>
                        </button>
                        <span style={{ color: 'var(--text-3)', fontSize: 13 }} className="tabular">{page + 1} / {totalPages}</span>
                        <button
                          disabled={page >= totalPages - 1}
                          onClick={() => setPage(p => p + 1)}
                          style={{
                            width: 32, height: 32, borderRadius: 8,
                            border: '1px solid var(--border)', background: 'transparent',
                            cursor: 'pointer', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', color: 'var(--text-2)',
                            opacity: page >= totalPages - 1 ? 0.3 : 1,
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>chevron_right</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* ACTIVITY */}
                {tab === 'activity' && stats && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    <div>
                      <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--accent)' }}>Activity</span>
                      <h1 style={{ fontFamily: 'Noto Serif, serif', fontSize: '1.5rem', color: 'var(--text)', marginTop: 4 }}>Exam analytics</h1>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
                      <StatCard label="Active This Week" value={stats.activity.activeThisWeek} icon="trending_up" />
                      <StatCard label="Total Exams" value={stats.activity.totalExams} icon="edit_note" />
                      <StatCard label="Avg Score" value={`${stats.activity.avgScore}%`} icon="analytics" />
                    </div>

                    <div className="card" style={{ padding: '1.25rem' }}>
                      <h2 style={{ fontFamily: 'Noto Serif, serif', fontWeight: 600, color: 'var(--text)', marginBottom: 16 }}>Certification popularity</h2>
                      {certChartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={200}>
                          <BarChart data={certChartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.4} />
                            <XAxis dataKey="cert" tick={{ fill: 'var(--text-3)', fontSize: 11 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: 'var(--text-3)', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                            <Tooltip contentStyle={tooltipStyle} />
                            <Bar dataKey="count" fill="var(--accent)" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <p style={{ color: 'var(--text-3)', fontSize: 14, textAlign: 'center', padding: 32 }}>No exam data yet</p>
                      )}
                    </div>

                    <div className="card" style={{ padding: '1.25rem' }}>
                      <h2 style={{ fontFamily: 'Noto Serif, serif', fontWeight: 600, color: 'var(--text)', marginBottom: 16 }}>Score distribution</h2>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={scoreDistData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.4} />
                          <XAxis dataKey="label" tick={{ fill: 'var(--text-3)', fontSize: 10 }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fill: 'var(--text-3)', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                          <Tooltip contentStyle={tooltipStyle} />
                          <Bar dataKey="count" fill="var(--text-2)" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* SETTINGS */}
                {tab === 'settings' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 480 }}>
                    <div>
                      <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--accent)' }}>Settings</span>
                      <h1 style={{ fontFamily: 'Noto Serif, serif', fontSize: '1.5rem', color: 'var(--text)', marginTop: 4 }}>Platform settings</h1>
                    </div>

                    <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: 20 }}>
                      {/* Maintenance toggle */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <p style={{ color: 'var(--text)', fontSize: 14, fontWeight: 500 }}>Maintenance mode</p>
                          <p style={{ color: 'var(--text-3)', fontSize: 12, marginTop: 2 }}>Blocks all non-admin users</p>
                        </div>
                        <button
                          onClick={() => setSettings(s => ({ ...s, maintenance: !s.maintenance }))}
                          style={{
                            width: 44, height: 24, borderRadius: 12,
                            border: 'none', cursor: 'pointer',
                            background: settings.maintenance ? 'var(--accent)' : 'var(--bg-sunken)',
                            position: 'relative', flexShrink: 0,
                            transition: 'background 0.2s',
                          }}
                        >
                          <div style={{
                            width: 18, height: 18, background: 'white',
                            borderRadius: '50%', position: 'absolute',
                            top: 3, left: settings.maintenance ? 23 : 3,
                            transition: 'left 0.2s',
                          }} />
                        </button>
                      </div>

                      {/* Banner */}
                      <div>
                        <label style={{ color: 'var(--text)', fontSize: 14, fontWeight: 500, display: 'block', marginBottom: 6 }}>Announcement banner</label>
                        <input
                          type="text"
                          value={settings.banner}
                          onChange={e => setSettings(s => ({ ...s, banner: e.target.value }))}
                          placeholder="Leave blank to hide banner"
                          className="input"
                          style={{ width: '100%' }}
                        />
                      </div>

                      {/* Featured cert */}
                      <div>
                        <label style={{ color: 'var(--text)', fontSize: 14, fontWeight: 500, display: 'block', marginBottom: 6 }}>Featured certification</label>
                        <input
                          type="text"
                          value={settings.featuredCert}
                          onChange={e => setSettings(s => ({ ...s, featuredCert: e.target.value }))}
                          placeholder="e.g. ccxp"
                          className="input"
                          style={{ width: '100%' }}
                        />
                      </div>

                      <button
                        onClick={saveSettings}
                        className="btn btn-primary"
                        style={{ width: '100%' }}
                      >
                        {settingsSaved ? '✓ Saved' : 'Save settings'}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>

      {selectedUser && (
        <UserModal user={selectedUser} onClose={() => setSelectedUser(null)} onDelete={deleteUser} />
      )}
    </div>
  )
}
