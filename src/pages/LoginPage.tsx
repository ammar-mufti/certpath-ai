import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import type { AuthUser } from '../store/authStore'
import { parseJwt } from '../services/auth'
import { useThemeContext } from '../context/ThemeContext'

const WORKER_URL = import.meta.env.VITE_WORKER_URL

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" className="flex-shrink-0">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  )
}

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true" className="flex-shrink-0">
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
        setError('Sign-in failed — please try again')
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
    <div className="min-h-dvh bg-background flex flex-col">

      {/* Nav */}
      <header className="sticky top-0 z-50 bg-surface-container/90 backdrop-blur-md border-b border-outline-variant">
        <div className="max-w-7xl mx-auto px-5 h-14 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="text-xl font-bold font-serif text-primary hover:opacity-80 transition-opacity"
          >
            CertPath AI
          </button>
          <button
            onClick={toggle}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface-container-high transition-all text-on-surface-variant hover:text-primary"
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            <span className="material-symbols-outlined">{isDark ? 'light_mode' : 'dark_mode'}</span>
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center px-5 py-12 relative overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/[0.06] rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-sm relative">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 mb-4">
              <span className="material-symbols-outlined text-primary" style={{ fontSize: '24px' }}>school</span>
            </div>
            <h1 className="font-serif text-h2 text-on-surface mb-1">
              {mode === 'login' ? 'Welcome back' : 'Create account'}
            </h1>
            <p className="text-on-surface-variant text-sm">
              {mode === 'login' ? 'Sign in to continue studying' : 'Free forever — no credit card needed'}
            </p>
          </div>

          <div className="bg-surface-container rounded-2xl p-6 border border-outline-variant shadow-ink">

            {/* OAuth buttons */}
            <div className="space-y-2.5 mb-5">
              <button
                onClick={() => { window.location.href = `${WORKER_URL}/auth/google/login` }}
                className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl bg-white border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-all duration-200 text-sm active:scale-[0.99]"
              >
                <GoogleIcon />
                Continue with Google
              </button>

              <button
                onClick={() => { window.location.href = `${WORKER_URL}/auth/github/login` }}
                className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl bg-[#24292e] text-white font-medium hover:bg-[#1c2024] transition-all duration-200 text-sm active:scale-[0.99]"
              >
                <GitHubIcon />
                Continue with GitHub
              </button>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px bg-outline-variant" />
              <span className="text-on-surface-variant/50 text-xs">or continue with email</span>
              <div className="flex-1 h-px bg-outline-variant" />
            </div>

            {/* Error */}
            {error && (
              <div className="bg-error-container/30 border border-error/30 rounded-xl p-3 mb-4 flex items-start gap-2">
                <span className="material-symbols-outlined text-error flex-shrink-0" style={{ fontSize: '16px', marginTop: '1px' }}>error</span>
                <p className="text-error text-sm leading-snug">{error}</p>
              </div>
            )}

            {/* Email form */}
            <div className="space-y-3" onKeyDown={e => e.key === 'Enter' && handleEmailAuth()}>
              {mode === 'register' && (
                <div>
                  <label className="block text-on-surface-variant text-xs font-medium mb-1.5">Full name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Your name"
                    autoComplete="name"
                    className="w-full bg-surface-container-high border border-outline-variant rounded-xl px-3.5 py-2.5 text-on-surface text-sm focus:outline-none focus:border-primary/60 placeholder-on-surface-variant/40 transition-colors"
                  />
                </div>
              )}

              <div>
                <label className="block text-on-surface-variant text-xs font-medium mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="w-full bg-surface-container-high border border-outline-variant rounded-xl px-3.5 py-2.5 text-on-surface text-sm focus:outline-none focus:border-primary/60 placeholder-on-surface-variant/40 transition-colors"
                />
              </div>

              <div>
                <label className="block text-on-surface-variant text-xs font-medium mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder={mode === 'register' ? 'Min 8 chars, include a number' : '••••••••'}
                    autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                    className="w-full bg-surface-container-high border border-outline-variant rounded-xl px-3.5 py-2.5 pr-11 text-on-surface text-sm focus:outline-none focus:border-primary/60 placeholder-on-surface-variant/40 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50 hover:text-on-surface-variant transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              <button
                onClick={handleEmailAuth}
                disabled={loading}
                className="w-full bg-primary text-on-primary font-bold py-2.5 rounded-xl hover:brightness-110 disabled:opacity-50 transition-all duration-200 text-sm flex items-center justify-center gap-2 mt-1 active:scale-[0.99] shadow-primary-btn"
              >
                {loading ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
                    {mode === 'register' ? 'Creating account…' : 'Signing in…'}
                  </>
                ) : (
                  mode === 'login' ? 'Sign in' : 'Create account'
                )}
              </button>
            </div>

            {/* Mode toggle */}
            <div className="text-center mt-4 pt-4 border-t border-outline-variant">
              {mode === 'login' ? (
                <p className="text-on-surface-variant text-xs">
                  No account?{' '}
                  <button
                    onClick={() => { setMode('register'); setError(null) }}
                    className="text-primary hover:opacity-80 transition-opacity font-semibold"
                  >
                    Create one free
                  </button>
                </p>
              ) : (
                <p className="text-on-surface-variant text-xs">
                  Already have an account?{' '}
                  <button
                    onClick={() => { setMode('login'); setError(null) }}
                    className="text-primary hover:opacity-80 transition-opacity font-semibold"
                  >
                    Sign in
                  </button>
                </p>
              )}
            </div>
          </div>

          <p className="text-on-surface-variant/40 text-xs text-center mt-5">
            Secure · No spam · Free forever
          </p>
        </div>
      </main>
    </div>
  )
}
