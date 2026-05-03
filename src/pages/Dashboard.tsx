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
      <circle cx="22" cy="22" r={r} fill="none" stroke="#1A2B3C" strokeWidth="3.5" />
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

  const hasProgress = totalProgress > 0

  return (
    <button
      onClick={() => navigate(`/${cert.id}/learn`)}
      className="bg-ink border border-white/[0.07] hover:border-white/20 rounded-2xl p-5 text-left transition-all duration-300 group w-full hover:-translate-y-0.5 hover:shadow-ink card-spotlight"
      style={{ borderTopColor: cert.color + '50', borderTopWidth: '2px' }}
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{cert.icon}</span>
            <span className="font-bold text-sm tracking-tight group-hover:opacity-80 transition-opacity" style={{ color: cert.color }}>{cert.name}</span>
          </div>
          <div className="text-mist/70 text-xs leading-snug truncate">{cert.fullName}</div>
          <div className="text-mist/35 text-[10px] mt-0.5">{cert.issuer}</div>
        </div>
        <ProgressRing pct={totalProgress} color={cert.color} />
      </div>

      <div className="h-0.5 bg-white/8 rounded-full mb-2.5">
        <div
          className="h-0.5 rounded-full transition-all duration-700"
          style={{ width: `${totalProgress}%`, backgroundColor: cert.color }}
        />
      </div>

      <div className="flex items-center justify-between">
        <span className="text-mist/60 text-xs tabular">{totalProgress}% ready</span>
        {!hasProgress && (
          <span className="text-[10px] px-2 py-0.5 rounded-md bg-gold/15 text-gold font-medium">Begin →</span>
        )}
      </div>
    </button>
  )
}

function ComingSoonDashCard({ cert }: { cert: Certification }) {
  return (
    <div className="bg-ink/30 border border-white/[0.04] rounded-2xl p-5 opacity-40 cursor-not-allowed select-none">
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-lg grayscale opacity-50">{cert.icon}</span>
        <span className="font-bold text-mist/70 text-sm tracking-tight">{cert.name}</span>
      </div>
      <div className="text-mist/40 text-xs leading-snug">{cert.fullName}</div>
      <div className="mt-3">
        <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-mist/40 uppercase tracking-wide font-medium">Coming soon</span>
      </div>
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
    <div className="min-h-dvh bg-navy">
      <TopNav />

      <div className="max-w-4xl mx-auto px-5 py-12">
        {/* Header */}
        <div className="mb-10">
          <h1 className="font-serif text-3xl text-cream mb-1 tracking-tight">
            Welcome back, {firstName}
          </h1>
          <p className="text-mist/70 text-sm">Which certification are you preparing for today?</p>
        </div>

        {/* Cert cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
          {AVAILABLE_CERTS.map(cert => (
            <CertCard key={cert.id} cert={cert} />
          ))}
          {COMING_SOON_CERTS.map(cert => (
            <ComingSoonDashCard key={cert.id} cert={cert} />
          ))}
        </div>

        {/* Recent activity */}
        {recentAttempts.length > 0 && (
          <div className="bg-ink/60 border border-white/[0.07] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-cream/80 font-semibold text-sm tracking-wide uppercase text-[11px]">Recent activity</h2>
              <button
                onClick={() => navigate('/history')}
                className="text-gold/70 text-xs hover:text-gold transition-colors"
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
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: passed ? '#2E7D5A' : '#A63228' }}
                      />
                      <div className="min-w-0">
                        <div className="text-cream/90 text-xs font-medium truncate">
                          {a.certName} — {modeLabel}
                        </div>
                        <div className="text-mist/40 text-[10px] mt-0.5">{formatRelative(a.date)}</div>
                      </div>
                    </div>
                    <span className={`text-xs font-bold tabular flex-shrink-0 ${passed ? 'text-pass' : 'text-fail'}`}>
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
