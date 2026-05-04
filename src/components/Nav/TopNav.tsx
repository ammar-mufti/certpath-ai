import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useThemeContext } from '../../context/ThemeContext'
import { AVAILABLE_CERTS, getCert } from '../../data/certifications'

export default function TopNav() {
  const { user, logout } = useAuthStore()
  const { isDark, toggle } = useThemeContext()
  const navigate = useNavigate()
  const location = useLocation()
  const { certId } = useParams<{ certId?: string }>()
  const cert = getCert(certId ?? '')

  const [certMenu,  setCertMenu]  = useState(false)
  const [userMenu,  setUserMenu]  = useState(false)
  const certRef = useRef<HTMLDivElement>(null)
  const userRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (certRef.current && !certRef.current.contains(e.target as Node)) setCertMenu(false)
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserMenu(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const navBg = isDark ? 'rgba(35,31,23,0.92)' : 'rgba(255,255,255,0.92)'

  const isLearn   = location.pathname.includes('/learn')
  const isExam    = location.pathname.includes('/exam') || location.pathname.includes('/results')
  const isHistory = location.pathname.includes('/history')

  return (
    <header style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      height: 56,
      display: 'flex', alignItems: 'center',
      padding: '0 1.25rem', gap: '0.75rem',
      background: navBg,
      borderBottom: '1px solid var(--border)',
      backdropFilter: 'blur(12px)',
    }}>

      {/* Logo */}
      <button
        onClick={() => navigate(user ? '/dashboard' : '/')}
        style={{
          fontFamily: 'Noto Serif, Georgia, serif',
          fontSize: '1.125rem', fontWeight: 700,
          color: 'var(--accent)',
          background: 'none', border: 'none', cursor: 'pointer',
          whiteSpace: 'nowrap', padding: 0, flexShrink: 0,
        }}
      >
        CertPath AI
      </button>

      {/* Cert badge / switcher */}
      {cert && (
        <div ref={certRef} style={{ position: 'relative', flexShrink: 0 }}>
          <button
            onClick={() => setCertMenu(p => !p)}
            className="badge badge-accent"
            style={{ cursor: 'pointer', gap: 5 }}
          >
            <span>{cert.icon}</span>
            <span style={{ fontSize: 12 }}>{cert.name}</span>
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>expand_more</span>
          </button>

          {certMenu && (
            <div className="card" style={{
              position: 'absolute', top: '110%', left: 0,
              minWidth: 200, zIndex: 200, padding: '0.5rem', overflow: 'hidden',
            }}>
              <div className="label" style={{ padding: '4px 8px 8px', display: 'block' }}>Switch cert</div>
              {AVAILABLE_CERTS.map(c => (
                <button key={c.id}
                  className="sidebar-item"
                  style={{ fontSize: 13 }}
                  onClick={() => { navigate(`/${c.id}/learn`); setCertMenu(false) }}
                >
                  <span style={{ fontSize: 16 }}>{c.icon}</span>
                  <span>{c.name}</span>
                  {c.id === certId && (
                    <span style={{ marginLeft: 'auto', color: 'var(--accent)', fontSize: 14 }}>●</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Nav tabs — only when on a cert page */}
      {certId && cert && (
        <nav style={{ display: 'flex', gap: 2, marginLeft: 4 }}>
          {[
            { label: 'Study', icon: 'menu_book',  path: `/${certId}/learn`,   active: isLearn },
            { label: 'Exam',  icon: 'edit_note',  path: `/${certId}/exam`,    active: isExam },
            { label: 'History', icon: 'history',  path: `/${certId}/history`, active: isHistory },
          ].map(t => (
            <button key={t.label}
              onClick={() => navigate(t.path)}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '4px 10px',
                borderRadius: 'var(--r-sm)',
                border: 'none',
                background: t.active ? 'var(--accent-dim)' : 'transparent',
                color: t.active ? 'var(--accent)' : 'var(--text-2)',
                fontSize: 13, fontWeight: 500, cursor: 'pointer',
                transition: 'all 0.15s', whiteSpace: 'nowrap',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>{t.icon}</span>
              <span className="hidden-mobile">{t.label}</span>
            </button>
          ))}
        </nav>
      )}

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Theme toggle */}
      <button
        onClick={toggle}
        title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        style={{
          width: 34, height: 34,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          borderRadius: 'var(--r-full)',
          border: '1px solid var(--border)',
          background: 'var(--bg-raised)',
          color: 'var(--text-2)',
          cursor: 'pointer',
          transition: 'all 0.15s', flexShrink: 0,
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 17 }}>
          {isDark ? 'light_mode' : 'dark_mode'}
        </span>
      </button>

      {/* User avatar */}
      {user && (
        <div ref={userRef} style={{ position: 'relative', flexShrink: 0 }}>
          <button
            onClick={() => setUserMenu(p => !p)}
            style={{
              width: 34, height: 34, borderRadius: '50%',
              border: '2px solid var(--accent)',
              overflow: 'hidden', cursor: 'pointer',
              background: 'var(--accent)', color: 'var(--accent-fg)',
              fontWeight: 700, fontSize: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: 0, flexShrink: 0,
            }}
          >
            {user.avatar
              ? <img src={user.avatar} alt={user.name ?? user.login} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : (user.name ?? user.login).charAt(0).toUpperCase()
            }
          </button>

          {userMenu && (
            <div className="card" style={{
              position: 'absolute', top: '110%', right: 0,
              minWidth: 200, zIndex: 200, overflow: 'hidden',
            }}>
              <div style={{ padding: '0.875rem 1rem', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>{user.name ?? user.login}</div>
                <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>{user.email}</div>
              </div>
              <div style={{ padding: '0.5rem' }}>
                <button className="sidebar-item" onClick={() => { navigate('/dashboard'); setUserMenu(false) }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 17 }}>dashboard</span>
                  Dashboard
                </button>
                {user.isAdmin && (
                  <button className="sidebar-item" onClick={() => { navigate('/admin'); setUserMenu(false) }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 17 }}>admin_panel_settings</span>
                    Admin
                  </button>
                )}
                <button
                  className="sidebar-item"
                  style={{ color: 'var(--error)' }}
                  onClick={() => { logout(); setUserMenu(false) }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 17 }}>logout</span>
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {!user && (
        <button
          className="btn btn-primary"
          style={{ padding: '6px 16px', fontSize: 13 }}
          onClick={() => navigate('/login')}
        >
          Sign in
        </button>
      )}
    </header>
  )
}
