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
  const styles: Record<string, string> = {
    google: 'bg-blue-500/15 text-blue-400',
    github: 'bg-surface-container-highest text-on-surface-variant',
    email:  'bg-primary/15 text-primary',
  }
  return (
    <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${styles[provider] ?? styles.email}`}>
      {provider}
    </span>
  )
}

function StatCard({ label, value, icon, color = 'text-primary' }: { label: string; value: string | number; icon: string; color?: string }) {
  return (
    <div className="bg-surface-container rounded-xl p-5 border border-outline-variant">
      <div className="flex items-center justify-between mb-3">
        <span className={`material-symbols-outlined ${color}`}>{icon}</span>
        <span className="font-label text-on-surface-variant text-[10px]">{label}</span>
      </div>
      <p className={`font-serif text-2xl font-bold tabular ${color}`}>{value}</p>
    </div>
  )
}

function UserModal({ user, onClose, onDelete }: { user: AdminUser; onClose: () => void; onDelete: (email: string) => void }) {
  const [confirming, setConfirming] = useState(false)
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4">
      <div className="bg-surface-container border border-outline-variant rounded-2xl p-6 w-full max-w-md space-y-4 shadow-xl">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-lg flex-shrink-0">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-on-surface font-semibold font-serif">{user.name}</h3>
            <p className="text-on-surface-variant text-sm truncate">{user.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <ProviderBadge provider={user.provider} />
              <span className="text-on-surface-variant/50 text-xs">Joined {formatDate(user.createdAt)}</span>
            </div>
          </div>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface transition-colors">
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        <div className="bg-surface-container-high rounded-xl p-4 space-y-2">
          <p className="font-label text-on-surface-variant text-[10px]">ACTIVITY</p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-on-surface-variant/60 text-xs">Last active</p>
              <p className="text-on-surface">{formatDate(user.lastActive)}</p>
            </div>
            <div>
              <p className="text-on-surface-variant/60 text-xs">Exams completed</p>
              <p className="text-on-surface tabular">{user.examsCompleted}</p>
            </div>
          </div>
        </div>

        {user.certsStudied.length > 0 && (
          <div>
            <p className="font-label text-on-surface-variant text-[10px] mb-2">CERTIFICATIONS STUDIED</p>
            <div className="flex flex-wrap gap-2">
              {user.certsStudied.map(c => (
                <span key={c} className="px-2 py-0.5 rounded-lg bg-primary/15 text-primary text-xs font-semibold">{c.toUpperCase()}</span>
              ))}
            </div>
          </div>
        )}

        {user.lastExamCert && (
          <p className="text-sm text-on-surface-variant">
            Last exam: <span className="text-on-surface font-medium">{user.lastExamCert.toUpperCase()}</span>
            {user.lastExamScore !== null && (
              <> &middot; <span className={user.lastExamScore >= 70 ? 'text-primary' : 'text-error'}>{user.lastExamScore}% {user.lastExamScore >= 70 ? 'PASS' : 'FAIL'}</span></>
            )}
          </p>
        )}

        {confirming ? (
          <div className="bg-error-container/20 border border-error/30 rounded-xl p-3 space-y-3">
            <p className="text-error text-sm">Delete {user.name}&apos;s account? This cannot be undone.</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirming(false)} className="flex-1 py-2 rounded-lg border border-outline-variant text-on-surface-variant text-sm hover:text-on-surface transition-colors">Cancel</button>
              <button onClick={() => onDelete(user.email)} className="flex-1 py-2 rounded-lg bg-error-container text-on-error text-sm font-semibold hover:opacity-90 transition-opacity">Delete</button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <button onClick={onClose} className="flex-1 py-2 rounded-xl border border-outline-variant text-on-surface-variant hover:text-on-surface transition-colors text-sm">Close</button>
            <button onClick={() => setConfirming(true)} className="px-4 py-2 rounded-xl border border-error/40 text-error hover:bg-error/10 transition-colors text-sm">Delete account</button>
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
    background: 'var(--surface-container)',
    border: '1px solid var(--outline-variant)',
    borderRadius: '8px',
  }

  return (
    <div className="min-h-dvh bg-background">
      <TopNav />

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-52 bg-surface-container border-r border-outline-variant flex-shrink-0 flex flex-col h-[calc(100vh-56px)] sticky top-14">
          <div className="p-4 border-b border-outline-variant">
            <span className="font-label text-primary text-[10px] uppercase tracking-widest">Admin</span>
            <p className="text-on-surface font-serif font-semibold mt-0.5">Platform Management</p>
          </div>
          <nav className="p-2 space-y-0.5 flex-1">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2.5 ${
                  tab === t.id
                    ? 'bg-primary/15 text-primary'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
                }`}
              >
                <span className="material-symbols-outlined text-base"
                  style={tab === t.id ? { fontVariationSettings: "'FILL' 1" } : {}}>
                  {t.icon}
                </span>
                {t.label}
              </button>
            ))}
          </nav>
          <div className="p-2 border-t border-outline-variant">
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full flex items-center gap-2 px-3 py-2 text-on-surface-variant/60 text-xs hover:text-on-surface-variant transition-colors rounded-lg hover:bg-surface-container-high"
            >
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              Back to app
            </button>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 overflow-auto">
          <div className="max-w-5xl mx-auto px-6 py-8">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-64 gap-3">
                <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                <p className="text-on-surface-variant text-sm">Loading admin data…</p>
              </div>
            ) : (
              <>
                {/* OVERVIEW */}
                {tab === 'overview' && stats && (
                  <div className="space-y-6">
                    <div>
                      <span className="font-label text-primary text-[10px] uppercase tracking-widest">Overview</span>
                      <h1 className="font-serif text-h1 text-on-surface mt-1">Platform dashboard</h1>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      <StatCard label="TOTAL USERS" value={stats.users.total} icon="group" />
                      <StatCard label="NEW THIS WEEK" value={stats.users.newThisWeek} icon="person_add" color="text-secondary" />
                      <StatCard label="EXAMS TAKEN" value={stats.activity.totalExams} icon="edit_note" color="text-tertiary" />
                      <StatCard label="AVG SCORE" value={`${stats.activity.avgScore}%`} icon="analytics" />
                    </div>

                    <div className="bg-surface-container rounded-xl border border-outline-variant p-5">
                      <h2 className="font-serif font-semibold text-on-surface mb-4">Sign-up providers</h2>
                      {[
                        { label: 'Google', count: stats.users.byProvider.google, color: '#4285F4' },
                        { label: 'GitHub', count: stats.users.byProvider.github, color: '#8B949E' },
                        { label: 'Email', count: stats.users.byProvider.email, color: '#f2ca50' },
                      ].map(p => (
                        <div key={p.label} className="flex items-center gap-3 mb-3">
                          <span className="text-on-surface-variant text-sm w-14">{p.label}</span>
                          <div className="flex-1 bg-surface-container-highest rounded-full h-1.5">
                            <div
                              className="h-1.5 rounded-full transition-all"
                              style={{ width: `${stats.users.total ? (p.count / stats.users.total) * 100 : 0}%`, backgroundColor: p.color }}
                            />
                          </div>
                          <span className="text-on-surface-variant/60 text-xs w-24 text-right tabular">
                            {p.count} ({stats.users.total ? Math.round((p.count / stats.users.total) * 100) : 0}%)
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="bg-surface-container rounded-xl border border-outline-variant p-5">
                      <h2 className="font-serif font-semibold text-on-surface mb-4">Active users — last 7 days</h2>
                      <ResponsiveContainer width="100%" height={160}>
                        <LineChart data={activityChartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--outline-variant)" opacity={0.4} />
                          <XAxis dataKey="day" tick={{ fill: 'var(--on-surface-variant)', fontSize: 11 }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fill: 'var(--on-surface-variant)', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                          <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: 'var(--on-surface)' }} itemStyle={{ color: 'var(--primary)' }} />
                          <Line type="monotone" dataKey="users" stroke="var(--primary)" strokeWidth={2} dot={{ fill: 'var(--primary)', r: 3 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    {certChartData.length > 0 && (
                      <div className="bg-surface-container rounded-xl border border-outline-variant p-5">
                        <h2 className="font-serif font-semibold text-on-surface mb-4">Most popular certifications</h2>
                        {certChartData.map(c => (
                          <div key={c.cert} className="flex items-center gap-3 mb-3">
                            <span className="text-on-surface-variant text-sm w-20 font-medium">{c.cert}</span>
                            <div className="flex-1 bg-surface-container-highest rounded-full h-1.5">
                              <div
                                className="h-1.5 rounded-full bg-primary transition-all"
                                style={{ width: `${certChartData[0].count ? (c.count / certChartData[0].count) * 100 : 0}%` }}
                              />
                            </div>
                            <span className="text-on-surface-variant/60 text-xs w-16 text-right tabular">{c.count} users</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* USERS */}
                {tab === 'users' && stats && (
                  <div className="space-y-5">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <span className="font-label text-primary text-[10px] uppercase tracking-widest">Users</span>
                        <h1 className="font-serif text-h2 text-on-surface mt-0.5">{stats.users.total} registered users</h1>
                      </div>
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-base">search</span>
                        <input
                          type="text"
                          placeholder="Search by name or email…"
                          value={search}
                          onChange={e => { setSearch(e.target.value); setPage(0) }}
                          className="bg-surface-container border border-outline-variant rounded-xl pl-10 pr-4 py-2 text-on-surface text-sm placeholder-on-surface-variant/40 w-64 focus:outline-none focus:border-primary/50"
                        />
                      </div>
                    </div>

                    <div className="bg-surface-container border border-outline-variant rounded-xl overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-outline-variant">
                            {['Name / Email', 'Via', 'Joined', 'Last active', 'Exams', 'Score', ''].map(h => (
                              <th key={h} className="text-left px-4 py-3 font-label text-on-surface-variant text-[10px] uppercase tracking-wider">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {pageUsers.map(u => (
                            <tr key={u.id} className="border-b border-outline-variant/50 hover:bg-surface-container-high transition-colors">
                              <td className="px-4 py-3">
                                <p className="text-on-surface font-medium text-sm">{u.name}</p>
                                <p className="text-on-surface-variant/60 text-xs">{u.email}</p>
                              </td>
                              <td className="px-4 py-3"><ProviderBadge provider={u.provider} /></td>
                              <td className="px-4 py-3 text-on-surface-variant text-xs">{formatDate(u.createdAt)}</td>
                              <td className="px-4 py-3 text-on-surface-variant text-xs">{formatDate(u.lastActive)}</td>
                              <td className="px-4 py-3 text-on-surface tabular text-sm">{u.examsCompleted}</td>
                              <td className="px-4 py-3">
                                {u.lastExamScore !== null
                                  ? <span className={`font-semibold tabular text-sm ${u.lastExamScore >= 70 ? 'text-primary' : 'text-error'}`}>{u.lastExamScore}%</span>
                                  : <span className="text-on-surface-variant/30">—</span>
                                }
                              </td>
                              <td className="px-4 py-3">
                                <button
                                  onClick={() => setSelectedUser(u)}
                                  className="text-primary/70 hover:text-primary text-xs transition-colors font-medium"
                                >
                                  View
                                </button>
                              </td>
                            </tr>
                          ))}
                          {pageUsers.length === 0 && (
                            <tr><td colSpan={7} className="px-4 py-10 text-center text-on-surface-variant/40 text-sm">No users found</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {totalPages > 1 && (
                      <div className="flex items-center justify-center gap-2">
                        <button disabled={page === 0} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 rounded-lg border border-outline-variant text-on-surface-variant text-sm disabled:opacity-30 hover:text-on-surface transition-colors">
                          <span className="material-symbols-outlined text-base">chevron_left</span>
                        </button>
                        <span className="text-on-surface-variant text-sm tabular">{page + 1} / {totalPages}</span>
                        <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 rounded-lg border border-outline-variant text-on-surface-variant text-sm disabled:opacity-30 hover:text-on-surface transition-colors">
                          <span className="material-symbols-outlined text-base">chevron_right</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* ACTIVITY */}
                {tab === 'activity' && stats && (
                  <div className="space-y-6">
                    <div>
                      <span className="font-label text-primary text-[10px] uppercase tracking-widest">Activity</span>
                      <h1 className="font-serif text-h2 text-on-surface mt-0.5">Exam analytics</h1>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <StatCard label="ACTIVE THIS WEEK" value={stats.activity.activeThisWeek} icon="trending_up" />
                      <StatCard label="TOTAL EXAMS" value={stats.activity.totalExams} icon="edit_note" />
                      <StatCard label="AVG SCORE" value={`${stats.activity.avgScore}%`} icon="analytics" />
                    </div>

                    <div className="bg-surface-container rounded-xl border border-outline-variant p-5">
                      <h2 className="font-serif font-semibold text-on-surface mb-4">Certification popularity</h2>
                      {certChartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={200}>
                          <BarChart data={certChartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--outline-variant)" opacity={0.4} />
                            <XAxis dataKey="cert" tick={{ fill: 'var(--on-surface-variant)', fontSize: 11 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: 'var(--on-surface-variant)', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                            <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: 'var(--on-surface)' }} itemStyle={{ color: 'var(--primary)' }} />
                            <Bar dataKey="count" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <p className="text-on-surface-variant/40 text-sm text-center py-8">No exam data yet</p>
                      )}
                    </div>

                    <div className="bg-surface-container rounded-xl border border-outline-variant p-5">
                      <h2 className="font-serif font-semibold text-on-surface mb-4">Score distribution</h2>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={scoreDistData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--outline-variant)" opacity={0.4} />
                          <XAxis dataKey="label" tick={{ fill: 'var(--on-surface-variant)', fontSize: 10 }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fill: 'var(--on-surface-variant)', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                          <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: 'var(--on-surface)' }} itemStyle={{ color: 'var(--secondary)' }} />
                          <Bar dataKey="count" fill="var(--secondary)" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* SETTINGS */}
                {tab === 'settings' && (
                  <div className="space-y-6 max-w-lg">
                    <div>
                      <span className="font-label text-primary text-[10px] uppercase tracking-widest">Settings</span>
                      <h1 className="font-serif text-h2 text-on-surface mt-0.5">Platform settings</h1>
                    </div>

                    <div className="bg-surface-container border border-outline-variant rounded-xl p-5 space-y-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-on-surface text-sm font-medium">Maintenance mode</p>
                          <p className="text-on-surface-variant/60 text-xs mt-0.5">Blocks all non-admin users</p>
                        </div>
                        <button
                          onClick={() => setSettings(s => ({ ...s, maintenance: !s.maintenance }))}
                          className={`w-12 h-6 rounded-full transition-colors relative flex-shrink-0 ${settings.maintenance ? 'bg-primary' : 'bg-surface-container-highest'}`}
                        >
                          <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-sm ${settings.maintenance ? 'right-1' : 'left-1'}`} />
                        </button>
                      </div>

                      <div>
                        <label className="text-on-surface text-sm font-medium block mb-1.5">Announcement banner</label>
                        <input
                          type="text"
                          value={settings.banner}
                          onChange={e => setSettings(s => ({ ...s, banner: e.target.value }))}
                          placeholder="Leave blank to hide banner"
                          className="w-full bg-surface-container-high border border-outline-variant rounded-xl px-4 py-2.5 text-on-surface text-sm placeholder-on-surface-variant/40 focus:outline-none focus:border-primary/50"
                        />
                      </div>

                      <div>
                        <label className="text-on-surface text-sm font-medium block mb-1.5">Featured certification</label>
                        <input
                          type="text"
                          value={settings.featuredCert}
                          onChange={e => setSettings(s => ({ ...s, featuredCert: e.target.value }))}
                          placeholder="e.g. ccxp"
                          className="w-full bg-surface-container-high border border-outline-variant rounded-xl px-4 py-2.5 text-on-surface text-sm placeholder-on-surface-variant/40 focus:outline-none focus:border-primary/50"
                        />
                      </div>

                      <button
                        onClick={saveSettings}
                        className="w-full bg-primary text-on-primary font-bold py-2.5 rounded-xl hover:brightness-110 transition-all text-sm shadow-primary-btn"
                      >
                        {settingsSaved ? 'Saved' : 'Save settings'}
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
