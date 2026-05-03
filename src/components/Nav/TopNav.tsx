import { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import type { AuthUser } from '../../store/authStore'
import { useHistoryStore } from '../../store/historyStore'
import { AVAILABLE_CERTS, COMING_SOON_CERTS, getCert } from '../../data/certifications'

function UserAvatar({ user }: { user: AuthUser }) {
  if (user.avatar) {
    return <img src={user.avatar} alt={user.name ?? user.login} className="w-7 h-7 rounded-full ring-1 ring-white/10" />
  }
  if (user.provider === 'google') {
    return (
      <div className="w-7 h-7 rounded-full flex items-center justify-center bg-white text-xs font-bold" style={{ color: '#4285F4' }}>
        G
      </div>
    )
  }
  return (
    <div className="w-7 h-7 rounded-full flex items-center justify-center bg-gold text-navy text-xs font-bold">
      {(user.name || user.login).charAt(0).toUpperCase()}
    </div>
  )
}

export default function TopNav() {
  const { user, logout } = useAuthStore()
  const location = useLocation()
  const navigate = useNavigate()
  const params = useParams<{ certId?: string }>()
  const attemptCount = useHistoryStore(s => s.attempts.length)

  const certIdFromPath = params.certId ?? location.pathname.split('/').find(seg =>
    AVAILABLE_CERTS.some(c => c.id === seg) || COMING_SOON_CERTS.some(c => c.id === seg)
  ) ?? null

  const currentCert = certIdFromPath ? getCert(certIdFromPath) : null

  const isLearn = location.pathname.includes('/learn')
  const isExam = location.pathname.includes('/exam') || location.pathname.includes('/results')
  const isHistory = location.pathname.includes('/history')
  const isCertPage = !!(currentCert && (isLearn || isExam || isHistory))

  const [switcherOpen, setSwitcherOpen] = useState(false)
  const switcherRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (switcherRef.current && !switcherRef.current.contains(e.target as Node)) {
        setSwitcherOpen(false)
      }
    }
    if (switcherOpen) document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [switcherOpen])

  function switchToCert(id: string) {
    setSwitcherOpen(false)
    if (isLearn) navigate(`/${id}/learn`)
    else if (isExam) navigate(`/${id}/exam`)
    else if (isHistory) navigate(`/${id}/history`)
    else navigate(`/${id}/learn`)
  }

  return (
    <nav className="bg-ink/95 backdrop-blur-md border-b border-white/[0.07] sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-5 h-14 flex items-center justify-between gap-4">
        {/* Left: Logo + cert switcher */}
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="text-gold font-serif text-xl tracking-tight whitespace-nowrap">
            CertPath AI
          </Link>

          {isCertPage && currentCert && (
            <div className="relative" ref={switcherRef}>
              <button
                onClick={() => setSwitcherOpen(p => !p)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.07] hover:bg-white/10 transition-colors text-sm font-medium"
                style={{ color: currentCert.color }}
              >
                <span className="text-base leading-none">{currentCert.icon}</span>
                <span className="tracking-tight">{currentCert.name}</span>
                <svg width="10" height="6" viewBox="0 0 10 6" fill="none" className="text-mist/50 ml-0.5">
                  <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>

              {switcherOpen && (
                <div className="absolute top-full left-0 mt-2 w-52 bg-ink border border-white/15 rounded-xl shadow-ink overflow-hidden z-50">
                  <div className="px-3 py-2 text-[10px] text-mist/50 font-semibold uppercase tracking-wider border-b border-white/[0.07]">
                    Switch certification
                  </div>
                  {AVAILABLE_CERTS.map(cert => (
                    <button
                      key={cert.id}
                      onClick={() => switchToCert(cert.id)}
                      className="w-full text-left px-3 py-2.5 hover:bg-white/[0.05] transition-colors flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm flex-shrink-0">{cert.icon}</span>
                        <span className="text-sm text-cream/90 truncate">{cert.name}</span>
                      </div>
                      {cert.id === currentCert.id && (
                        <span className="text-[9px] text-gold/80 font-semibold uppercase tracking-wide flex-shrink-0">Active</span>
                      )}
                    </button>
                  ))}
                  <div className="border-t border-white/[0.07] px-3 py-2 text-[10px] text-mist/30">
                    More certifications coming soon
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Center: Sub-nav */}
        {isCertPage && currentCert && (
          <div className="flex gap-0.5">
            {[
              { to: `/${currentCert.id}/learn`, label: 'Learn', active: isLearn },
              { to: `/${currentCert.id}/exam`, label: 'Exam', active: isExam },
            ].map(item => (
              <Link
                key={item.label}
                to={item.to}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  item.active
                    ? 'bg-gold/15 text-gold'
                    : 'text-mist/70 hover:text-cream hover:bg-white/[0.05]'
                }`}
              >
                {item.label}
              </Link>
            ))}
            <Link
              to={`/${currentCert.id}/history`}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 flex items-center gap-1.5 ${
                isHistory
                  ? 'bg-gold/15 text-gold'
                  : 'text-mist/70 hover:text-cream hover:bg-white/[0.05]'
              }`}
            >
              History
              {attemptCount > 0 && (
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded tabular ${
                  isHistory ? 'bg-gold/20 text-gold' : 'bg-white/8 text-mist/60'
                }`}>
                  {attemptCount}
                </span>
              )}
            </Link>
          </div>
        )}

        {/* Right: User */}
        {user && (
          <div className="flex items-center gap-3 flex-shrink-0">
            <UserAvatar user={user} />
            <span className="text-mist/60 text-sm hidden sm:block tracking-tight">{user.login}</span>
            <button
              onClick={logout}
              className="text-mist/40 hover:text-mist/70 text-xs transition-colors"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </nav>
  )
}
