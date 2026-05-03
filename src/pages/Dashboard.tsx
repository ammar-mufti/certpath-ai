import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useLearnStore } from '../store/learnStore'
import { useHistoryStore } from '../store/historyStore'
import { AVAILABLE_CERTS, COMING_SOON_CERTS } from '../data/certifications'
import type { Certification } from '../data/certifications'
import TopNav from '../components/Nav/TopNav'

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const hours = Math.floor(diff / 3_600_000)
  if (hours < 1) return 'just now'
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'yesterday'
  return `${days} days ago`
}

function ProgressRing({ pct, color }: { pct: number; color: string }) {
  const r = 18
  const circumference = 2 * Math.PI * r
  const offset = circumference - (pct / 100) * circumference
  return (
    <svg width="44" height="44" className="-rotate-90 flex-shrink-0">
      <circle cx="22" cy="22" r={r} fill="none" stroke="var(--surface-container-highest)" strokeWidth="3.5" />
      <circle
        cx="22" cy="22" r={r} fill="none" stroke={color} strokeWidth="3.5"
        strokeDasharray={circumference} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.34,1.56,0.64,1)' }}
      />
    </svg>
  )
}

function CertCard({ cert }: { cert: Certification }) {
  const navigate = useNavigate()
  const { getDomainProgress } = useLearnStore()

  const totalProgress = cert.domains.length > 0
    ? Math.round(cert.domains.reduce((sum, d) => sum + getDomainProgress(cert.id, d.name), 0) / cert.domains.length)
    : 0

  return (
    <button
      onClick={() => navigate(`/${cert.id}/learn`)}
      className="group text-left p-5 bg-surface-container rounded-xl border border-outline-variant hover:border-primary/50 hover:bg-surface-container-high transition-all duration-200 w-full hover:-translate-y-0.5"
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{cert.icon}</span>
            <span className="font-serif font-semibold text-sm text-on-surface group-hover:text-primary transition-colors">{cert.name}</span>
          </div>
          <div className="text-on-surface-variant text-xs leading-snug truncate">{cert.fullName}</div>
          <div className="text-on-surface-variant/40 text-[10px] mt-0.5">{cert.issuer}</div>
        </div>
        <ProgressRing pct={totalProgress} color={cert.color} />
      </div>

      <div className="h-0.5 bg-surface-container-highest rounded-full mb-2">
        <div
          className="h-0.5 rounded-full transition-all duration-700"
          style={{ width: `${totalProgress}%`, backgroundColor: cert.color }}
        />
      </div>

      <div className="flex items-center justify-between">
        <span className="text-on-surface-variant text-xs tabular">{totalProgress}% ready</span>
        {totalProgress === 0 && (
          <span className="text-[10px] px-2 py-0.5 rounded-md bg-primary/15 text-primary font-semibold">Begin →</span>
        )}
      </div>
    </button>
  )
}

function ComingSoonDashCard({ cert }: { cert: Certification }) {
  return (
    <div className="text-left p-5 bg-surface-container-low rounded-xl border border-outline-variant opacity-40 cursor-not-allowed select-none">
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-lg grayscale opacity-50">{cert.icon}</span>
        <span className="font-serif font-semibold text-on-surface-variant text-sm">{cert.name}</span>
      </div>
      <div className="text-on-surface-variant/50 text-xs leading-snug mb-3">{cert.fullName}</div>
      <span className="text-[10px] px-2 py-0.5 rounded bg-surface-container-highest text-on-surface-variant/50 uppercase tracking-wide font-semibold">
        Coming soon
      </span>
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const user = useAuthStore(s => s.user)
  const { attempts } = useHistoryStore()

  const recentAttempts = attempts.slice(0, 3)
  const firstName = (user?.name ?? user?.login ?? 'there').split(' ')[0]

  return (
    <div className="min-h-dvh bg-background">
      <TopNav />

      <div className="max-w-4xl mx-auto px-5 py-10 pb-24 md:pb-10">
        {/* Header */}
        <div className="mb-10">
          <span className="font-label text-primary uppercase tracking-widest text-xs">Your dashboard</span>
          <h1 className="font-serif text-h1 text-on-surface mt-1 mb-1">
            Welcome back, {firstName}
          </h1>
          <p className="text-on-surface-variant text-sm">Which certification are you preparing for today?</p>
        </div>

        {/* Cert cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
          {AVAILABLE_CERTS.map(cert => (
            <CertCard key={cert.id} cert={cert} />
          ))}
          {COMING_SOON_CERTS.map(cert => (
            <ComingSoonDashCard key={cert.id} cert={cert} />
          ))}
        </div>

        {/* Recent activity */}
        {recentAttempts.length > 0 && (
          <div className="bg-surface-container rounded-xl border border-outline-variant p-5">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-label text-on-surface-variant uppercase tracking-wider text-xs">Recent activity</h2>
              <button
                onClick={() => navigate('/history')}
                className="text-primary text-xs font-medium hover:opacity-80 transition-opacity"
              >
                View all →
              </button>
            </div>
            <div className="space-y-4">
              {recentAttempts.map(a => {
                const passed = a.pct >= 70
                const modeLabel = a.mode === 'full' ? 'Full exam' : a.mode === 'mini' ? 'Mini drill' : `Domain: ${a.selectedDomain ?? ''}`
                return (
                  <div key={a.id} className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-0.5"
                        style={{ backgroundColor: passed ? 'var(--pass, #2E7D5A)' : 'var(--error, #ffb4ab)' }}
                      />
                      <div className="min-w-0">
                        <div className="text-on-surface text-xs font-medium truncate">
                          {a.certName} — {modeLabel}
                        </div>
                        <div className="text-on-surface-variant/50 text-[10px] mt-0.5">{formatRelative(a.date)}</div>
                      </div>
                    </div>
                    <span className={`text-xs font-bold tabular flex-shrink-0 ${passed ? 'text-pass' : 'text-error'}`}>
                      {a.pct}%
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
