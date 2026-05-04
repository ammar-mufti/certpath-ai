import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useThemeContext } from '../context/ThemeContext'
import { AVAILABLE_CERTS, COMING_SOON_CERTS } from '../data/certifications'
import type { Certification } from '../data/certifications'

function CertCard({ cert, onStart }: { cert: Certification; onStart: (id: string) => void }) {
  return (
    <button
      onClick={() => onStart(cert.id)}
      className="group text-left p-5 bg-surface-container rounded-xl border border-outline-variant hover:border-primary/50 hover:bg-surface-container-high transition-all duration-300 hover:-translate-y-0.5"
    >
      <div className="flex items-center gap-3 mb-3">
        <span className="text-3xl">{cert.icon}</span>
        <div className="min-w-0">
          <h3 className="font-serif text-base font-semibold text-on-surface group-hover:text-primary transition-colors">
            {cert.name}
          </h3>
          <p className="text-label text-on-surface-variant text-xs">{cert.issuer}</p>
        </div>
      </div>
      <p className="text-body-sm text-on-surface-variant mb-4 leading-relaxed text-sm line-clamp-2">{cert.about}</p>
      <div className="flex items-center gap-3 text-xs text-on-surface-variant font-medium tabular">
        <span>{cert.examQuestions}Q</span>
        <span className="text-outline-variant">·</span>
        <span>Pass {cert.passingScore}%</span>
        <span className="text-outline-variant">·</span>
        <span className={
          cert.difficulty === 'Beginner' ? 'text-primary' :
          cert.difficulty === 'Intermediate' ? 'text-secondary' : 'text-error'
        }>
          {cert.difficulty}
        </span>
      </div>
    </button>
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
    <div className="text-left p-5 bg-surface-container-low rounded-xl border border-outline-variant opacity-55">
      <div className="flex items-center gap-3 mb-3">
        <span className="text-3xl grayscale opacity-50">{cert.icon}</span>
        <div className="min-w-0">
          <h3 className="font-serif text-base font-semibold text-on-surface-variant">{cert.name}</h3>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full">
            Coming soon
          </span>
        </div>
      </div>
      {saved ? (
        <p className="text-xs text-on-surface-variant">We'll let you know when {cert.name} is ready.</p>
      ) : (
        <form onSubmit={handleNotify} className="flex gap-2 mt-3">
          <input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="flex-1 bg-surface-container border border-outline-variant rounded-lg px-3 py-1.5 text-on-surface text-xs focus:outline-none focus:border-primary/50 placeholder-on-surface-variant/40"
          />
          <button type="submit" className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary text-xs rounded-lg transition-colors whitespace-nowrap font-medium">
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
  const { isDark, toggle } = useThemeContext()

  function handleStart(certId: string) {
    navigate(user ? `/${certId}/learn` : '/login')
  }

  return (
    <div className="min-h-dvh bg-background text-on-surface">

      {/* Nav */}
      <header className="sticky top-0 z-50 bg-surface-container/90 backdrop-blur-md border-b border-outline-variant">
        <div className="max-w-7xl mx-auto px-5 h-14 flex items-center justify-between">
          <span className="text-xl font-bold font-serif text-primary">CertPath AI</span>
          <div className="flex items-center gap-2">
            <button
              onClick={toggle}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface-container-high transition-all text-on-surface-variant hover:text-primary"
              title={isDark ? 'Light mode' : 'Dark mode'}
            >
              <span className="material-symbols-outlined">{isDark ? 'light_mode' : 'dark_mode'}</span>
            </button>
            {user ? (
              <button
                onClick={() => navigate('/dashboard')}
                className="bg-primary text-on-primary font-semibold px-4 py-1.5 rounded-full text-sm hover:brightness-110 transition-all active:scale-[0.98]"
              >
                Dashboard
              </button>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="bg-primary text-on-primary font-semibold px-4 py-1.5 rounded-full text-sm hover:brightness-110 transition-all active:scale-[0.98]"
              >
                Sign in
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden pt-24 pb-20 px-5 text-center">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-primary/[0.05] rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-4xl mx-auto">
          <span className="inline-block font-label text-primary uppercase tracking-widest mb-5 text-xs">
            AI-powered · free forever
          </span>
          <h1 className="font-serif text-display font-bold text-on-surface leading-tight mb-5">
            Ace your next<br />
            <span className="text-primary">certification</span>
          </h1>
          <p className="text-body-lg text-on-surface-variant max-w-xl mx-auto mb-10 leading-relaxed">
            AI study guides, practice exams, and a personal tutor — for the credentials that move your career forward.
          </p>
          <button
            onClick={() => navigate(user ? '/dashboard' : '/login')}
            className="bg-primary text-on-primary font-bold px-10 py-4 rounded-full shadow-primary-btn hover:shadow-[0_0_24px_rgba(242,202,80,0.5)] hover:scale-105 active:scale-95 transition-all text-base uppercase tracking-wide"
          >
            Start studying free →
          </button>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-outline-variant py-5 bg-surface-container">
        <div className="max-w-4xl mx-auto px-5 flex flex-wrap justify-center gap-x-12 gap-y-4 text-center">
          {[
            { n: '5', label: 'certifications' },
            { n: '500+', label: 'practice questions' },
            { n: '4', label: 'learning stages' },
            { n: 'Free', label: 'no credit card' },
          ].map(s => (
            <div key={s.label}>
              <div className="text-primary font-bold text-xl tabular font-serif">{s.n}</div>
              <div className="text-on-surface-variant text-xs mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Cert grid */}
      <section className="max-w-5xl mx-auto px-5 py-16">
        <h2 className="font-serif text-h2 text-on-surface mb-2">Choose your certification</h2>
        <p className="text-on-surface-variant mb-10 text-sm">Start studying today — fully free, no account required to browse.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-14">
          {AVAILABLE_CERTS.map(cert => (
            <CertCard key={cert.id} cert={cert} onStart={handleStart} />
          ))}
        </div>

        <h2 className="font-serif text-h3 text-on-surface-variant mb-2">Coming soon</h2>
        <p className="text-on-surface-variant/60 text-sm mb-8">Join the waitlist and we'll notify you when these launch.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {COMING_SOON_CERTS.map(cert => (
            <ComingSoonCard key={cert.id} cert={cert} />
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-surface-container border-y border-outline-variant py-16">
        <div className="max-w-4xl mx-auto px-5">
          <h2 className="font-serif text-h2 text-on-surface mb-3">How it works</h2>
          <p className="text-on-surface-variant mb-14 text-sm max-w-md">Three stages, one outcome: passing your exam with confidence.</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
            {[
              { n: '01', title: 'Choose your cert', desc: 'Pick from five certifications across CX, project management, cloud, agile, and ITSM.' },
              { n: '02', title: 'Study with AI', desc: 'Domain summaries, key concepts, flashcards, and practice questions generated for your specific exam.' },
              { n: '03', title: 'Pass the exam', desc: 'Track weak domains, run timed mock exams, and go into exam day knowing exactly where you stand.' },
            ].map(s => (
              <div key={s.n}>
                <div className="text-primary/30 font-serif text-5xl font-bold mb-4 leading-none tabular">{s.n}</div>
                <h3 className="font-serif font-semibold text-on-surface text-base mb-2">{s.title}</h3>
                <p className="text-on-surface-variant text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-outline-variant py-10">
        <div className="max-w-4xl mx-auto px-5 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <div className="text-primary font-serif text-lg font-bold mb-1">CertPath AI</div>
            <p className="text-on-surface-variant/50 text-xs">AI-powered prep for the certifications that advance your career.</p>
          </div>
          <div className="flex flex-col items-end gap-1.5 text-xs text-on-surface-variant/50">
            <a href="mailto:muftiammar52@gmail.com" className="hover:text-on-surface-variant transition-colors">muftiammar52@gmail.com</a>
            <a href="https://linkedin.com/in/ammarmufti" target="_blank" rel="noopener noreferrer" className="hover:text-on-surface-variant transition-colors">linkedin.com/in/ammarmufti</a>
            <span className="text-on-surface-variant/30">Built with Claude · GitHub Pages</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
