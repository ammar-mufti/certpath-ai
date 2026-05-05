import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import type { AuthUser } from '../store/authStore'
import { parseJwt } from '../services/auth'
import { useThemeContext } from '../context/ThemeContext'

const WORKER_URL = import.meta.env.VITE_WORKER_URL

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" style={{ flexShrink: 0 }}>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  )
}

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true" style={{ flexShrink: 0 }}>
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  )
}

export default function LoginPage() {
  const [params] = useSearchParams()
  const { setAuth, user } = useAuthStore()
  const navigate = useNavigate()
  const { isDark, toggle } = useThemeContext()

  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const token = params.get('token')
    if (token) {
      try {
        const payload = parseJwt(token) as AuthUser | null
        if (payload) {
          setAuth({
            id: payload.id ?? `legacy_${payload.login}`,
            login: payload.login,
            name: payload.name ?? payload.login,
            email: payload.email ?? '',
            avatar: payload.avatar ?? null,
            provider: payload.provider ?? 'github',
            isAdmin: (payload as unknown as Record<string, unknown>).isAdmin === true,
          }, token)
          window.history.replaceState({}, '', window.location.pathname)
        }
      } catch {
        setTimeout(() => setError('Sign-in failed — please try again'), 0)
      }
    }
  }, [params, setAuth])

  useEffect(() => {
    if (user) navigate('/dashboard', { replace: true })
  }, [user, navigate])

  async function handleEmailAuth() {
    setError(null)
    if (!email || !password) { setError('Email and password are required'); return }
    if (mode === 'register') {
      if (!name || name.trim().length < 2) { setError('Please enter your full name (at least 2 characters)'); return }
      if (password.length < 8) { setError('Password must be at least 8 characters'); return }
      if (!/\d/.test(password)) { setError('Password must contain at least one number'); return }
    }

    setLoading(true)
    try {
      const endpoint = mode === 'register' ? '/auth/email/register' : '/auth/email/login'
      const body = mode === 'register' ? { email, password, name } : { email, password }
      const res = await fetch(`${WORKER_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json() as { token?: string; user?: AuthUser; error?: string }
      if (!res.ok) { setError(data.error ?? 'Authentication failed'); return }
      if (data.token && data.user) {
        setAuth(data.user, data.token)
        navigate('/dashboard', { replace: true })
      }
    } catch {
      setError('Connection failed — please try again')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'var(--bg)',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Nav */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'var(--bg-card)',
        borderBottom: '1px solid var(--border)',
        backdropFilter: 'blur(12px)',
      }}>
        <div style={{
          maxWidth: 720,
          margin: '0 auto',
          padding: '0 20px',
          height: 56,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <button
            onClick={() => navigate('/')}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'Noto Serif, serif',
              fontSize: 20,
              fontWeight: 700,
              color: 'var(--accent)',
            }}
          >
            CertPath AI
          </button>
          <button
            onClick={toggle}
            style={{
              width: 36,
              height: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              border: 'none',
              background: 'transparent',
              color: 'var(--text-2)',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'var(--bg-raised)'
              e.currentTarget.style.color = 'var(--accent)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = 'var(--text-2)'
            }}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            <span className="material-symbols-outlined">
              {isDark ? 'light_mode' : 'dark_mode'}
            </span>
          </button>
        </div>
      </header>

      {/* Main */}
      <main style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 20px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Ambient glow */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 600,
          height: 400,
          background: 'var(--accent-dim)',
          borderRadius: '50%',
          filter: 'blur(120px)',
          pointerEvents: 'none',
        }} />

        <div style={{ width: '100%', maxWidth: 380, position: 'relative' }}>
          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 48,
              height: 48,
              borderRadius: 16,
              background: 'var(--accent-dim)',
              border: '1px solid var(--accent)',
              marginBottom: 16,
            }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--accent)', fontSize: 24 }}>
                school
              </span>
            </div>
            <h1 style={{
              fontFamily: 'Noto Serif, serif',
              fontSize: '1.75rem',
              fontWeight: 700,
              color: 'var(--text)',
              marginBottom: 4,
            }}>
              {mode === 'login' ? 'Welcome back' : 'Create account'}
            </h1>
            <p style={{ color: 'var(--text-2)', fontSize: 14 }}>
              {mode === 'login' ? 'Sign in to continue studying' : 'Free forever — no credit card needed'}
            </p>
          </div>

          {/* Card */}
          <div className="card" style={{ padding: '1.5rem' }}>
            {/* OAuth buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              <button
                onClick={() => { window.location.href = `${WORKER_URL}/auth/google/login` }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 12,
                  padding: '10px 16px',
                  borderRadius: 12,
                  background: '#ffffff',
                  border: '1px solid #e0e0e0',
                  color: '#374151',
                  fontWeight: 500,
                  fontSize: 14,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#f9fafb' }}
                onMouseLeave={e => { e.currentTarget.style.background = '#ffffff' }}
              >
                <GoogleIcon />
                Continue with Google
              </button>

              <button
                onClick={() => { window.location.href = `${WORKER_URL}/auth/github/login` }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 12,
                  padding: '10px 16px',
                  borderRadius: 12,
                  background: '#24292e',
                  border: 'none',
                  color: '#ffffff',
                  fontWeight: 500,
                  fontSize: 14,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#1c2024' }}
                onMouseLeave={e => { e.currentTarget.style.background = '#24292e' }}
              >
                <GitHubIcon />
                Continue with GitHub
              </button>
            </div>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              <span style={{ color: 'var(--text-3)', fontSize: 12 }}>or continue with email</span>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            </div>

            {/* Error */}
            {error && (
              <div style={{
                background: 'var(--error-dim)',
                border: '1px solid var(--error)',
                borderRadius: 12,
                padding: '10px 12px',
                marginBottom: 16,
                display: 'flex',
                alignItems: 'flex-start',
                gap: 8,
              }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--error)', fontSize: 16, flexShrink: 0, marginTop: 1 }}>
                  error
                </span>
                <p style={{ color: 'var(--error)', fontSize: 13, lineHeight: 1.4 }}>{error}</p>
              </div>
            )}

            {/* Email form */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {mode === 'register' && (
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-2)', marginBottom: 6 }}>
                    Full name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Your name"
                    autoComplete="name"
                    className="input"
                    style={{ width: '100%' }}
                  />
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-2)', marginBottom: 6 }}>
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="input"
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-2)', marginBottom: 6 }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder={mode === 'register' ? 'Min 8 chars, include a number' : '••••••••'}
                    autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                    className="input"
                    style={{ width: '100%', paddingRight: 44 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(p => !p)}
                    style={{
                      position: 'absolute',
                      right: 12,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--text-3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              <button
                onClick={handleEmailAuth}
                disabled={loading}
                className="btn btn-primary"
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  borderRadius: 12,
                  fontSize: 14,
                  marginTop: 4,
                }}
              >
                {loading ? (
                  <>
                    <span style={{
                      width: 14,
                      height: 14,
                      border: '2px solid var(--accent-fg)',
                      borderRightColor: 'transparent',
                      borderRadius: '50%',
                      animation: 'spin 0.6s linear infinite',
                    }} />
                    {mode === 'register' ? 'Creating account…' : 'Signing in…'}
                  </>
                ) : (
                  mode === 'login' ? 'Sign in' : 'Create account'
                )}
              </button>
            </div>

            {/* Mode toggle */}
            <div style={{
              textAlign: 'center',
              marginTop: 16,
              paddingTop: 16,
              borderTop: '1px solid var(--border)',
            }}>
              {mode === 'login' ? (
                <p style={{ color: 'var(--text-2)', fontSize: 13 }}>
                  No account?{' '}
                  <button
                    onClick={() => { setMode('register'); setError(null) }}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--accent)',
                      fontWeight: 600,
                      fontSize: 13,
                    }}
                  >
                    Create one free
                  </button>
                </p>
              ) : (
                <p style={{ color: 'var(--text-2)', fontSize: 13 }}>
                  Already have an account?{' '}
                  <button
                    onClick={() => { setMode('login'); setError(null) }}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--accent)',
                      fontWeight: 600,
                      fontSize: 13,
                    }}
                  >
                    Sign in
                  </button>
                </p>
              )}
            </div>
          </div>

          <p style={{ textAlign: 'center', color: 'var(--text-3)', fontSize: 12, marginTop: 20 }}>
            Secure · No spam · Free forever
          </p>
        </div>
      </main>
    </div>
  )
}
