import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { AVAILABLE_CERTS, COMING_SOON_CERTS } from '../data/certifications'
import type { Certification } from '../data/certifications'

function DifficultyBar({ level }: { level: Certification['difficulty'] }) {
  const bars = level === 'Beginner' ? 1 : level === 'Intermediate' ? 2 : 3
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-0.5">
        {[1, 2, 3].map(i => (
          <div
            key={i}
            className="w-5 h-1 rounded-full transition-colors"
            style={{ backgroundColor: i <= bars ? '#C9A84C' : '#1A2B3C' }}
          />
        ))}
      </div>
      <span className="text-mist/70 text-xs">{level}</span>
    </div>
  )
}

function CertCard({ cert, onStart }: { cert: Certification; onStart: (id: string) => void }) {
  return (
    <div
      className="bg-ink border border-white/[0.07] hover:border-white/20 rounded-2xl p-6 flex flex-col gap-4 transition-all duration-300 group cursor-pointer hover:-translate-y-0.5 hover:shadow-ink card-spotlight"
      style={{ borderTopColor: cert.color + '50', borderTopWidth: '2px' }}
      onClick={() => onStart(cert.id)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 mb-1.5">
            <span className="text-2xl">{cert.icon}</span>
            <span className="font-bold text-lg tracking-tight group-hover:opacity-90 transition-opacity" style={{ color: cert.color }}>{cert.name}</span>
          </div>
          <div className="text-cream/70 text-sm leading-snug">{cert.fullName}</div>
          <div className="text-mist/40 text-xs mt-0.5">{cert.issuer}</div>
        </div>
        <div
          className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5 opacity-60"
          style={{ backgroundColor: cert.color }}
        />
      </div>

      <div className="flex items-center gap-3 text-xs text-mist/60 tabular">
        <span>{cert.examQuestions}Q</span>
        <span className="text-white/15">·</span>
        <span>{cert.examDuration}min</span>
        <span className="text-white/15">·</span>
        <span>Pass {cert.passingScore}%</span>
      </div>

      <DifficultyBar level={cert.difficulty} />

      <button
        className="mt-auto w-full py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 hover:brightness-110 active:scale-[0.98]"
        style={{ backgroundColor: cert.color + 'ee', color: '#0D1B2A' }}
      >
        Start studying
      </button>
    </div>
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
    <div className="bg-ink/50 border border-white/[0.04] rounded-2xl p-6 flex flex-col gap-3 opacity-60">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 mb-1.5">
            <span className="text-2xl grayscale opacity-50">{cert.icon}</span>
            <span className="font-bold text-mist text-lg tracking-tight">{cert.name}</span>
          </div>
          <div className="text-mist/50 text-sm leading-snug">{cert.fullName}</div>
          <div className="text-mist/30 text-xs mt-0.5">{cert.issuer}</div>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-mist/50 flex-shrink-0 whitespace-nowrap tracking-wide uppercase font-medium">
          Soon
        </span>
      </div>

      {saved ? (
        <div className="text-pass/80 text-xs">We'll let you know when {cert.name} is ready.</div>
      ) : (
        <form onSubmit={handleNotify} className="flex gap-2">
          <input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="flex-1 bg-navy/80 border border-white/10 rounded-lg px-3 py-1.5 text-cream text-xs focus:outline-none focus:border-gold/40 placeholder-mist/30"
          />
          <button
            type="submit"
            className="px-3 py-1.5 bg-white/8 hover:bg-white/12 text-mist/70 text-xs rounded-lg transition-colors whitespace-nowrap"
          >
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

  function handleStart(certId: string) {
    navigate(user ? `/${certId}/learn` : '/login')
  }

  function handleCTA() {
    navigate(user ? '/dashboard' : '/login')
  }

  return (
    <div className="min-h-dvh bg-navy text-cream">

      {/* Nav */}
      <nav className="border-b border-white/[0.07] sticky top-0 z-50 bg-navy/96 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-5 h-14 flex items-center justify-between">
          <span className="text-gold font-serif text-xl tracking-tight">CertPath AI</span>
          <div className="flex items-center gap-3">
            {user ? (
              <>
                {user.avatar && <img src={user.avatar} alt={user.name ?? user.login} className="w-7 h-7 rounded-full ring-1 ring-white/10" />}
                <button
                  onClick={() => navigate('/dashboard')}
                  className="bg-gold text-navy font-semibold px-4 py-1.5 rounded-lg text-sm hover:brightness-110 transition-all duration-200 active:scale-[0.98]"
                >
                  Dashboard
                </button>
              </>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="bg-gold text-navy font-semibold px-4 py-1.5 rounded-lg text-sm hover:brightness-110 transition-all duration-200 active:scale-[0.98]"
              >
                Sign in
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gold/[0.04] rounded-full blur-3xl" />
          <div className="absolute top-20 right-0 w-96 h-96 bg-domain-strategy/[0.03] rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-4xl mx-auto px-5 pt-24 pb-20 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-gold/20 bg-gold/5 text-gold text-xs font-medium mb-8 tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
            AI-powered certification prep
          </div>

          <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl mb-6 leading-[1.05] tracking-tight">
            Ace your next<br />
            <span className="text-gold">certification</span>
          </h1>
          <p className="text-mist text-lg sm:text-xl max-w-xl mx-auto mb-10 leading-relaxed">
            AI study guides, practice exams, and a personal tutor — for the credentials that move your career forward.
          </p>
          <button
            onClick={handleCTA}
            className="bg-gold text-navy font-bold px-8 py-4 rounded-xl text-base hover:brightness-110 transition-all duration-200 shadow-gold hover:-translate-y-0.5 active:translate-y-0 active:shadow-none"
          >
            Start studying — it's free
          </button>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-y border-white/[0.06] py-5 bg-ink/30">
        <div className="max-w-4xl mx-auto px-5 flex flex-wrap justify-center gap-x-12 gap-y-4 text-center">
          {[
            { n: '5', label: 'certifications' },
            { n: '500+', label: 'practice questions' },
            { n: '4', label: 'learning stages' },
            { n: 'Free', label: 'no credit card' },
          ].map(s => (
            <div key={s.label}>
              <div className="text-gold font-bold text-xl tabular">{s.n}</div>
              <div className="text-mist/60 text-xs mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Cert grid */}
      <section className="max-w-6xl mx-auto px-5 py-20">
        <div className="mb-12">
          <h2 className="font-serif text-3xl mb-2 tracking-tight">Available now</h2>
          <p className="text-mist/70">Choose your certification and start today.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-16">
          {AVAILABLE_CERTS.map(cert => (
            <CertCard key={cert.id} cert={cert} onStart={handleStart} />
          ))}
        </div>

        <div className="mb-10">
          <h2 className="font-serif text-2xl mb-2 text-mist/70 tracking-tight">Coming soon</h2>
          <p className="text-mist/40 text-sm">Join the waitlist and we'll let you know when these launch.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {COMING_SOON_CERTS.map(cert => (
            <ComingSoonCard key={cert.id} cert={cert} />
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-ink/20 border-y border-white/[0.06] py-20">
        <div className="max-w-4xl mx-auto px-5">
          <h2 className="font-serif text-3xl mb-3 tracking-tight">How it works</h2>
          <p className="text-mist/60 mb-14 max-w-md">Three stages, one outcome: passing your exam with confidence.</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
            {[
              {
                n: '01',
                title: 'Choose your cert',
                desc: 'Pick from five certifications across CX, project management, cloud, agile, and ITSM.',
              },
              {
                n: '02',
                title: 'Study with AI',
                desc: 'Domain summaries, key concepts, flashcards, and practice questions — generated for your specific exam.',
              },
              {
                n: '03',
                title: 'Pass the exam',
                desc: 'Track weak domains, run timed mock exams, and go into exam day knowing exactly where you stand.',
              },
            ].map(s => (
              <div key={s.n} className="flex flex-col">
                <div className="text-gold/40 font-serif text-5xl font-bold mb-4 leading-none tabular">{s.n}</div>
                <h3 className="font-semibold text-cream text-base mb-2">{s.title}</h3>
                <p className="text-mist/70 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] py-12">
        <div className="max-w-4xl mx-auto px-5 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <div className="text-gold font-serif text-lg mb-1">CertPath AI</div>
            <p className="text-mist/40 text-xs">AI-powered prep for the certifications that advance your career.</p>
          </div>
          <div className="flex flex-col items-end gap-2 text-xs text-mist/40">
            <a href="mailto:muftiammar52@gmail.com" className="hover:text-mist/70 transition-colors">muftiammar52@gmail.com</a>
            <a href="https://linkedin.com/in/ammarmufti" target="_blank" rel="noopener noreferrer" className="hover:text-mist/70 transition-colors">linkedin.com/in/ammarmufti</a>
            <span className="text-mist/25">Built with Claude · GitHub Pages</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
