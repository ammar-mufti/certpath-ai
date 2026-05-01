import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
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
  if (provider === 'google') return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-400">G</span>
  if (provider === 'github') return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-white/10 text-mist">GH</span>
  return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-white/5 text-mist/60">✉</span>
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-ink border border-white/10 rounded-2xl p-5">
      <p className="text-mist text-xs mb-1">{label}</p>
      <p className="text-cream font-serif text-3xl">{value}</p>
      {sub && <p className="text-mist/60 text-xs mt-1">{sub}</p>}
    </div>
  )
}

function UserModal({ user, onClose, onDelete }: { user: AdminUser; onClose: () => void; onDelete: (email: string) => void }) {
  const [confirming, setConfirming] = useState(false)
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
      <div className="bg-ink border border-white/20 rounded-2xl p-6 w-full max-w-md space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center text-gold font-bold text-lg flex-shrink-0">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="text-cream font-semibold">{user.name}</h3>
            <p className="text-mist text-sm">{user.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <ProviderBadge provider={user.provider} />
              <span className="text-mist/60 text-xs">Joined {formatDate(user.createdAt)}</span>
            </div>
          </div>
        </div>

        <div className="bg-white/5 rounded-xl p-4 space-y-2">
          <p className="text-mist text-xs font-semibold uppercase tracking-wider">Activity</p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-mist/60 text-xs">Last active</p>
              <p className="text-cream">{formatDate(user.lastActive)}</p>
            </div>
            <div>
              <p className="text-mist/60 text-xs">Exams completed</p>
              <p className="text-cream">{user.examsCompleted}</p>
            </div>
          </div>
        </div>

        {user.certsStudied.length > 0 && (
          <div>
            <p className="text-mist text-xs font-semibold uppercase tracking-wider mb-2">Certifications Studied</p>
            <div className="flex flex-wrap gap-2">
              {user.certsStudied.map(c => (
                <span key={c} className="px-2 py-1 rounded-lg bg-gold/10 text-gold text-xs font-medium">{c.toUpperCase()}</span>
              ))}
            </div>
          </div>
        )}

        {user.lastExamCert && (
          <p className="text-sm text-mist">
            Last exam: <span className="text-cream">{user.lastExamCert.toUpperCase()}</span>
            {user.lastExamScore !== null && (
              <> &middot; <span className={user.lastExamScore >= 70 ? 'text-green-400' : 'text-red-400'}>{user.lastExamScore}% {user.lastExamScore >= 70 ? 'PASS' : 'FAIL'}</span></>
            )}
          </p>
        )}

        {confirming ? (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 space-y-3">
            <p className="text-red-400 text-sm">Delete {user.name}&apos;s account? This cannot be undone.</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirming(false)} className="flex-1 py-2 rounded-lg border border-white/20 text-mist text-sm hover:text-cream transition-colors">Cancel</button>
              <button onClick={() => onDelete(user.email)} className="flex-1 py-2 rounded-lg bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors">Yes, Delete</button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <button onClick={onClose} className="flex-1 py-2 rounded-xl border border-white/20 text-mist hover:text-cream transition-colors text-sm">Close</button>
            <button onClick={() => setConfirming(true)} className="px-4 py-2 rounded-xl border border-red-500/40 text-red-400 hover:bg-red-500/10 transition-colors text-sm">Delete Account</button>
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
    { label: '0-50%', min: 0, max: 50 },
    { label: '51-60%', min: 51, max: 60 },
    { label: '61-70%', min: 61, max: 70 },
    { label: '71-80%', min: 71, max: 80 },
    { label: '81-90%', min: 81, max: 90 },
    { label: '91-100%', min: 91, max: 100 },
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
    { id: 'overview', label: 'Overview', icon: '🏠' },
    { id: 'users', label: 'Users', icon: '👥' },
    { id: 'activity', label: 'Activity', icon: '📊' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ] as const

  return (
    <div className="min-h-screen bg-navy flex">
      {/* Sidebar */}
      <aside className="w-48 bg-ink border-r border-white/10 flex-shrink-0 flex flex-col">
        <div className="p-4 border-b border-white/10">
          <button onClick={() => navigate('/dashboard')} className="text-gold font-serif text-lg">CertPath AI</button>
          <p className="text-mist/60 text-xs mt-0.5">Admin Dashboard</p>
        </div>
        <nav className="p-3 space-y-1 flex-1">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 ${
                tab === t.id ? 'bg-gold text-navy' : 'text-mist hover:text-cream hover:bg-white/5'
              }`}
            >
              <span>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-white/10">
          <button onClick={() => navigate('/dashboard')} className="w-full text-left px-3 py-2 text-mist/60 text-xs hover:text-mist transition-colors">
            Back to App
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto px-6 py-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-mist text-sm animate-pulse">Loading admin data…</div>
            </div>
          ) : (
            <>
              {/* OVERVIEW */}
              {tab === 'overview' && stats && (
                <div className="space-y-6">
                  <h1 className="text-cream font-serif text-2xl">Overview</h1>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard label="Total Users" value={stats.users.total} />
                    <StatCard label="New This Week" value={stats.users.newThisWeek} />
                    <StatCard label="Exams Taken" value={stats.activity.totalExams} />
                    <StatCard label="Avg Score" value={`${stats.activity.avgScore}%`} />
                  </div>

                  <div className="bg-ink border border-white/10 rounded-2xl p-5">
                    <h2 className="text-cream font-semibold mb-4">Sign-up Providers</h2>
                    {[
                      { label: 'Google', count: stats.users.byProvider.google, color: '#4285F4' },
                      { label: 'GitHub', count: stats.users.byProvider.github, color: '#8B949E' },
                      { label: 'Email', count: stats.users.byProvider.email, color: '#C9A84C' },
                    ].map(p => (
                      <div key={p.label} className="flex items-center gap-3 mb-3">
                        <span className="text-mist text-sm w-14">{p.label}</span>
                        <div className="flex-1 bg-white/5 rounded-full h-2">
                          <div
                            className="h-2 rounded-full transition-all"
                            style={{ width: `${stats.users.total ? (p.count / stats.users.total) * 100 : 0}%`, backgroundColor: p.color }}
                          />
                        </div>
                        <span className="text-mist/60 text-xs w-20 text-right">
                          {p.count} ({stats.users.total ? Math.round((p.count / stats.users.total) * 100) : 0}%)
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="bg-ink border border-white/10 rounded-2xl p-5">
                    <h2 className="text-cream font-semibold mb-4">Active Users — Last 7 Days</h2>
                    <ResponsiveContainer width="100%" height={160}>
                      <LineChart data={activityChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="day" tick={{ fill: '#8B9AB0', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: '#8B9AB0', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                        <Tooltip contentStyle={{ background: '#0D1B2A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} labelStyle={{ color: '#E8E8D0' }} itemStyle={{ color: '#C9A84C' }} />
                        <Line type="monotone" dataKey="users" stroke="#C9A84C" strokeWidth={2} dot={{ fill: '#C9A84C', r: 3 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {certChartData.length > 0 && (
                    <div className="bg-ink border border-white/10 rounded-2xl p-5">
                      <h2 className="text-cream font-semibold mb-4">Most Popular Certifications</h2>
                      {certChartData.map(c => (
                        <div key={c.cert} className="flex items-center gap-3 mb-3">
                          <span className="text-mist text-sm w-20">{c.cert}</span>
                          <div className="flex-1 bg-white/5 rounded-full h-2">
                            <div
                              className="h-2 rounded-full bg-gold"
                              style={{ width: `${certChartData[0].count ? (c.count / certChartData[0].count) * 100 : 0}%` }}
                            />
                          </div>
                          <span className="text-mist/60 text-xs w-16 text-right">{c.count} users</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* USERS */}
              {tab === 'users' && stats && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h1 className="text-cream font-serif text-2xl">Users ({stats.users.total})</h1>
                    <input
                      type="text"
                      placeholder="Search by name or email…"
                      value={search}
                      onChange={e => { setSearch(e.target.value); setPage(0) }}
                      className="bg-ink border border-white/20 rounded-xl px-4 py-2 text-cream text-sm placeholder-mist/40 w-64 focus:outline-none focus:border-gold/60"
                    />
                  </div>

                  <div className="bg-ink border border-white/10 rounded-2xl overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/10">
                          {['Name', 'Email', 'Via', 'Joined', 'Last Active', 'Exams', 'Score', ''].map(h => (
                            <th key={h} className="text-left px-4 py-3 text-mist/60 text-xs font-semibold">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {pageUsers.map(u => (
                          <tr key={u.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                            <td className="px-4 py-3 text-cream font-medium">{u.name}</td>
                            <td className="px-4 py-3 text-mist text-xs">{u.email}</td>
                            <td className="px-4 py-3"><ProviderBadge provider={u.provider} /></td>
                            <td className="px-4 py-3 text-mist text-xs">{formatDate(u.createdAt)}</td>
                            <td className="px-4 py-3 text-mist text-xs">{formatDate(u.lastActive)}</td>
                            <td className="px-4 py-3 text-cream">{u.examsCompleted}</td>
                            <td className="px-4 py-3">
                              {u.lastExamScore !== null
                                ? <span className={u.lastExamScore >= 70 ? 'text-green-400' : 'text-red-400'}>{u.lastExamScore}%</span>
                                : <span className="text-mist/40">—</span>}
                            </td>
                            <td className="px-4 py-3">
                              <button onClick={() => setSelectedUser(u)} className="text-gold/80 hover:text-gold text-xs transition-colors">View</button>
                            </td>
                          </tr>
                        ))}
                        {pageUsers.length === 0 && (
                          <tr><td colSpan={8} className="px-4 py-8 text-center text-mist/40 text-sm">No users found</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2">
                      <button disabled={page === 0} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 rounded-lg border border-white/20 text-mist text-sm disabled:opacity-30 hover:text-cream transition-colors">←</button>
                      <span className="text-mist text-sm">{page + 1} / {totalPages}</span>
                      <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 rounded-lg border border-white/20 text-mist text-sm disabled:opacity-30 hover:text-cream transition-colors">→</button>
                    </div>
                  )}
                </div>
              )}

              {/* ACTIVITY */}
              {tab === 'activity' && stats && (
                <div className="space-y-6">
                  <h1 className="text-cream font-serif text-2xl">Activity</h1>

                  <div className="bg-ink border border-white/10 rounded-2xl p-5">
                    <h2 className="text-cream font-semibold mb-4">Certification Popularity</h2>
                    {certChartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={certChartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                          <XAxis dataKey="cert" tick={{ fill: '#8B9AB0', fontSize: 11 }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fill: '#8B9AB0', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                          <Tooltip contentStyle={{ background: '#0D1B2A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} labelStyle={{ color: '#E8E8D0' }} itemStyle={{ color: '#C9A84C' }} />
                          <Bar dataKey="count" fill="#C9A84C" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-mist/40 text-sm text-center py-8">No exam data yet</p>
                    )}
                  </div>

                  <div className="bg-ink border border-white/10 rounded-2xl p-5">
                    <h2 className="text-cream font-semibold mb-4">Score Distribution</h2>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={scoreDistData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="label" tick={{ fill: '#8B9AB0', fontSize: 10 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: '#8B9AB0', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                        <Tooltip contentStyle={{ background: '#0D1B2A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} labelStyle={{ color: '#E8E8D0' }} itemStyle={{ color: '#7BC67A' }} />
                        <Bar dataKey="count" fill="#7BC67A" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <StatCard label="Active This Week" value={stats.activity.activeThisWeek} />
                    <StatCard label="Total Exams Taken" value={stats.activity.totalExams} />
                    <StatCard label="Platform Avg Score" value={`${stats.activity.avgScore}%`} />
                  </div>
                </div>
              )}

              {/* SETTINGS */}
              {tab === 'settings' && (
                <div className="space-y-6 max-w-lg">
                  <h1 className="text-cream font-serif text-2xl">Platform Settings</h1>

                  <div className="bg-ink border border-white/10 rounded-2xl p-5 space-y-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-cream text-sm font-medium">Maintenance Mode</p>
                        <p className="text-mist/60 text-xs mt-0.5">Blocks all non-admin users with a maintenance page</p>
                      </div>
                      <button
                        onClick={() => setSettings(s => ({ ...s, maintenance: !s.maintenance }))}
                        className={`w-12 h-6 rounded-full transition-colors relative flex-shrink-0 ${settings.maintenance ? 'bg-gold' : 'bg-white/10'}`}
                      >
                        <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${settings.maintenance ? 'right-1' : 'left-1'}`} />
                      </button>
                    </div>

                    <div>
                      <label className="text-cream text-sm font-medium block mb-1.5">Announcement Banner</label>
                      <input
                        type="text"
                        value={settings.banner}
                        onChange={e => setSettings(s => ({ ...s, banner: e.target.value }))}
                        placeholder="Leave blank to hide banner"
                        className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-2.5 text-cream text-sm placeholder-mist/40 focus:outline-none focus:border-gold/60"
                      />
                    </div>

                    <div>
                      <label className="text-cream text-sm font-medium block mb-1.5">Featured Certification</label>
                      <input
                        type="text"
                        value={settings.featuredCert}
                        onChange={e => setSettings(s => ({ ...s, featuredCert: e.target.value }))}
                        placeholder="e.g. ccxp"
                        className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-2.5 text-cream text-sm placeholder-mist/40 focus:outline-none focus:border-gold/60"
                      />
                    </div>

                    <button
                      onClick={saveSettings}
                      className="w-full bg-gold text-navy font-bold py-2.5 rounded-xl hover:bg-amber-400 transition-colors text-sm"
                    >
                      {settingsSaved ? '✓ Saved!' : 'Save Settings'}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {selectedUser && (
        <UserModal user={selectedUser} onClose={() => setSelectedUser(null)} onDelete={deleteUser} />
      )}
    </div>
  )
}
