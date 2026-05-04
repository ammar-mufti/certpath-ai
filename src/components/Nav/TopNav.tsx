import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import type { AuthUser } from '../../store/authStore'
import { useHistoryStore } from '../../store/historyStore'
import { useThemeContext } from '../../context/ThemeContext'
import { AVAILABLE_CERTS, COMING_SOON_CERTS, getCert } from '../../data/certifications'

function UserAvatar({ user, onClick }: { user: AuthUser; onClick: () => void }) {
  if (user.avatar) {
    return (
      <img
        src={user.avatar}
        alt={user.name ?? user.login}
        onClick={onClick}
        className="w-8 h-8 rounded-full border border-outline-variant object-cover cursor-pointer hover:ring-2 hover:ring-primary/40 transition-all"
      />
    )
  }
  return (
    <button
      onClick={onClick}
      className="w-8 h-8 rounded-full bg-primary text-on-primary font-bold text-sm flex items-center justify-center hover:brightness-110 transition-all"
    >
      {(user.name || user.login).charAt(0).toUpperCase()}
    </button>
  )
}

export default function TopNav() {
  const { user, logout } = useAuthStore()
  const location = useLocation()
  const navigate = useNavigate()
  const params = useParams<{ certId?: string }>()
  const attemptCount = useHistoryStore(s => s.attempts.length)
  const { isDark, toggle } = useThemeContext()

  const certIdFromPath = params.certId ?? location.pathname.split('/').find(seg =>
    AVAILABLE_CERTS.some(c => c.id === seg) || COMING_SOON_CERTS.some(c => c.id === seg)
  ) ?? null

  const currentCert = certIdFromPath ? getCert(certIdFromPath) : null

  const isLearn = location.pathname.includes('/learn')
  const isExam = location.pathname.includes('/exam') || location.pathname.includes('/results')
  const isHistory = location.pathname.includes('/history')
  const isCertPage = !!(currentCert && (isLearn || isExam || isHistory))

  const [switcherOpen, setSwitcherOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const switcherRef = useRef<HTMLDivElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (switcherRef.current && !switcherRef.current.contains(e.target as Node)) setSwitcherOpen(false)
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false)
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [])

  function switchToCert(id: string) {
    setSwitcherOpen(false)
    if (isLearn) navigate(`/${id}/learn`)
    else if (isExam) navigate(`/${id}/exam`)
    else if (isHistory) navigate(`/${id}/history`)
    else navigate(`/${id}/learn`)
  }

  const navTabs = isCertPage && currentCert ? [
    { label: 'Learn', icon: 'menu_book', path: `/${currentCert.id}/learn`, active: isLearn },
    { label: 'Exam', icon: 'edit_note', path: `/${currentCert.id}/exam`, active: isExam },
  ] : []

  return (
    <header className="bg-surface-container/90 backdrop-blur-md border-b border-outline-variant sticky top-0 z-50 shadow-sm">
      <div className="flex justify-between items-center w-full px-5 h-14 max-w-7xl mx-auto">

        {/* Left: Logo + cert switcher */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(user ? '/dashboard' : '/')}
            className="text-xl font-bold font-serif text-primary hover:opacity-80 transition-opacity whitespace-nowrap"
          >
            CertPath AI
          </button>

          {isCertPage && currentCert && (
            <div className="relative" ref={switcherRef}>
              <button
                onClick={() => setSwitcherOpen(p => !p)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 border border-primary/30 rounded-full text-primary text-sm font-semibold hover:bg-primary/20 transition-all"
              >
                <span>{currentCert.icon}</span>
                <span className="hidden sm:inline">{currentCert.name}</span>
                <span className="material-symbols-outlined text-base">expand_more</span>
              </button>

              {switcherOpen && (
                <div className="absolute top-full left-0 mt-2 bg-surface-container border border-outline-variant rounded-xl shadow-xl min-w-48 z-50 overflow-hidden">
                  <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant border-b border-outline-variant">
                    Switch certification
                  </div>
                  {AVAILABLE_CERTS.map(cert => (
                    <button
                      key={cert.id}
                      onClick={() => switchToCert(cert.id)}
                      className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-surface-container-high text-left text-sm text-on-surface transition-colors first:rounded-t-none last:rounded-b-xl"
                    >
                      <span>{cert.icon}</span>
                      <span>{cert.name}</span>
                      {cert.id === currentCert.id && (
                        <span className="ml-auto text-primary text-xs font-semibold">Active</span>
                      )}
                    </button>
                  ))}
                  <div className="border-t border-outline-variant px-3 py-2 text-[10px] text-on-surface-variant/60">
                    More certifications coming soon
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: nav tabs + controls */}
        <div className="flex items-center gap-1">

          {/* Nav tabs (desktop only) */}
          {isCertPage && currentCert && (
            <nav className="hidden md:flex items-center gap-0.5 mr-2">
              {navTabs.map(tab => (
                <button
                  key={tab.label}
                  onClick={() => navigate(tab.path)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    tab.active
                      ? 'bg-primary/15 text-primary'
                      : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
                  }`}
                >
                  <span className="material-symbols-outlined text-base">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
              <button
                onClick={() => navigate(`/${currentCert.id}/history`)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  isHistory
                    ? 'bg-primary/15 text-primary'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
                }`}
              >
                <span className="material-symbols-outlined text-base">history</span>
                History
                {attemptCount > 0 && (
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded tabular ${
                    isHistory ? 'bg-primary/20 text-primary' : 'bg-surface-container-highest text-on-surface-variant'
                  }`}>
                    {attemptCount}
                  </span>
                )}
              </button>
            </nav>
          )}

          {/* Theme toggle */}
          <button
            onClick={toggle}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface-container-high transition-all text-on-surface-variant hover:text-primary"
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            <span className="material-symbols-outlined">{isDark ? 'light_mode' : 'dark_mode'}</span>
          </button>

          {/* User avatar + dropdown */}
          {user && (
            <div className="relative" ref={userMenuRef}>
              <UserAvatar user={user} onClick={() => setUserMenuOpen(p => !p)} />

              {userMenuOpen && (
                <div className="absolute top-full right-0 mt-2 bg-surface-container border border-outline-variant rounded-xl shadow-xl min-w-48 z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-outline-variant">
                    <p className="text-sm font-semibold text-on-surface truncate">{user.name ?? user.login}</p>
                    <p className="text-xs text-on-surface-variant truncate">{user.email}</p>
                  </div>
                  {user.isAdmin && (
                    <button
                      onClick={() => { navigate('/admin'); setUserMenuOpen(false) }}
                      className="w-full flex items-center gap-2 px-4 py-3 hover:bg-surface-container-high text-sm text-on-surface transition-colors"
                    >
                      <span className="material-symbols-outlined text-base">admin_panel_settings</span>
                      Admin dashboard
                    </button>
                  )}
                  <button
                    onClick={() => { navigate('/dashboard'); setUserMenuOpen(false) }}
                    className="w-full flex items-center gap-2 px-4 py-3 hover:bg-surface-container-high text-sm text-on-surface transition-colors"
                  >
                    <span className="material-symbols-outlined text-base">home</span>
                    Dashboard
                  </button>
                  <button
                    onClick={() => { logout(); setUserMenuOpen(false) }}
                    className="w-full flex items-center gap-2 px-4 py-3 hover:bg-surface-container-high text-sm text-error transition-colors rounded-b-xl"
                  >
                    <span className="material-symbols-outlined text-base">logout</span>
                    Sign out
                  </button>
                </div>
              )}
            </div>
          )}

          {!user && (
            <button
              onClick={() => navigate('/login')}
              className="ml-1 bg-primary text-on-primary font-semibold px-4 py-1.5 rounded-full text-sm hover:brightness-110 transition-all active:scale-[0.98]"
            >
              Sign in
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
