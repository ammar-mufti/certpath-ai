import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useParams, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { useHistoryStore } from './store/historyStore'
import { useLearnStore } from './store/learnStore'
import { useTutorStore } from './store/tutorStore'
import { ThemeProvider } from './context/ThemeContext'
import ProtectedRoute from './components/Auth/ProtectedRoute'
import AdminRoute from './components/Admin/AdminRoute'
import LoginPage from './pages/LoginPage'
import LandingPage from './pages/LandingPage'
import Dashboard from './pages/Dashboard'
import LearnPage from './pages/LearnPage'
import ExamPage from './pages/ExamPage'
import ResultsPage from './pages/ResultsPage'
import HistoryPage from './pages/HistoryPage'
import ComingSoonPage from './pages/ComingSoonPage'
import AdminPage from './pages/AdminPage'
import MaintenancePage from './pages/MaintenancePage'
import TutorChat from './components/AI/TutorChat'
import { getCert, AVAILABLE_CERTS } from './data/certifications'

function OfflineBanner() {
  const [offline, setOffline] = useState(!navigator.onLine)
  useEffect(() => {
    const on  = () => setOffline(false)
    const off = () => setOffline(true)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])
  if (!offline) return null
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
      background: '#c07a20', color: '#fff',
      textAlign: 'center', fontSize: 13, padding: '8px 16px', fontWeight: 500,
    }}>
      You're offline — showing cached content
    </div>
  )
}

function RootRedirect() {
  const user      = useAuthStore(s => s.user)
  const isLoading = useAuthStore(s => s.isLoading)
  if (isLoading) return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: 'var(--accent)', fontSize: '1.1rem', fontFamily: 'Noto Serif, serif' }}>Loading…</div>
    </div>
  )
  if (user) return <Navigate to="/dashboard" replace />
  return <LandingPage />
}

function TutorChatWrapper() {
  const user = useAuthStore(s => s.user)
  if (!user) return null
  return <TutorChat />
}

function CertLearnPage() {
  const { certId } = useParams<{ certId: string }>()
  const cert = getCert(certId ?? '')
  if (!cert) return <Navigate to="/dashboard" replace />
  if (!cert.isAvailable) return <ComingSoonPage />
  return <LearnPage certId={certId!} />
}

function CertExamPage() {
  const { certId } = useParams<{ certId: string }>()
  const cert = getCert(certId ?? '')
  if (!cert) return <Navigate to="/dashboard" replace />
  if (!cert.isAvailable) return <ComingSoonPage />
  return <ExamPage certId={certId!} />
}

function CertHistoryPage() {
  const { certId } = useParams<{ certId: string }>()
  const cert = getCert(certId ?? '')
  if (!cert) return <Navigate to="/dashboard" replace />
  return <HistoryPage certId={certId!} />
}

interface HealthData {
  status: string
  groq?: string
  keyPrefix?: string
  keyLength?: number
  maintenance?: boolean
  banner?: string
  timestamp?: string
}

function AnnouncementBanner({ banner, onDismiss }: { banner: string | null; onDismiss: () => void }) {
  if (!banner) return null
  return (
    <div style={{
      background: 'var(--accent)', color: 'var(--accent-fg)',
      fontSize: 13, textAlign: 'center', padding: '8px 16px',
      fontWeight: 500, display: 'flex', alignItems: 'center',
      justifyContent: 'center', gap: 8, position: 'relative', zIndex: 200,
    }}>
      <span>{banner}</span>
      <button onClick={onDismiss} style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.7, color: 'inherit', fontSize: 16 }}>✕</button>
    </div>
  )
}

function MaintenanceGate({ children, maintenance }: { children: React.ReactNode; maintenance: boolean }) {
  const user      = useAuthStore(s => s.user)
  const isLoading = useAuthStore(s => s.isLoading)
  if (maintenance && !isLoading && !user?.isAdmin) return <MaintenancePage />
  return <>{children}</>
}

function MobileBottomNav() {
  const location = useLocation()
  const navigate  = useNavigate()
  const { setOpen } = useTutorStore()

  const segs   = location.pathname.split('/').filter(Boolean)
  const certId = AVAILABLE_CERTS.find(c => segs.includes(c.id))?.id
  if (!certId) return null

  const tabs = [
    { label: 'Study',   icon: 'menu_book', path: `/${certId}/learn` },
    { label: 'Exam',    icon: 'edit_note', path: `/${certId}/exam` },
    { label: 'Tutor',   icon: 'smart_toy', action: 'tutor' },
    { label: 'History', icon: 'history',   path: `/${certId}/history` },
    { label: 'Certs',   icon: 'grid_view', path: '/dashboard' },
  ]

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      background: 'var(--bg-card)', borderTop: '1px solid var(--border)',
      zIndex: 40, display: 'flex',
    }}
    className="md-hidden-mobile-nav"
    >
      {tabs.map(tab => {
        const isActive = tab.path ? location.pathname.startsWith(tab.path) : false
        return (
          <button
            key={tab.label}
            onClick={() => tab.action === 'tutor' ? setOpen(true) : navigate(tab.path!)}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: 2, padding: '10px 4px',
              border: 'none', background: 'transparent', cursor: 'pointer',
              color: isActive ? 'var(--accent)' : 'var(--text-3)',
              transition: 'color 0.15s',
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{
                fontSize: 20,
                fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0",
              }}
            >
              {tab.icon}
            </span>
            <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              {tab.label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}

export default function App() {
  const init = useAuthStore(s => s.init)
  const user = useAuthStore(s => s.user)
  const [health,          setHealth]          = useState<HealthData | null>(null)
  const [bannerDismissed, setBannerDismissed] = useState(false)

  useEffect(() => { init() }, [init])

  useEffect(() => {
    if (user) {
      useHistoryStore.getState().loadForUser()
      useLearnStore.getState().loadForUser()
    }
  }, [user?.id])

  useEffect(() => {
    fetch(`${import.meta.env.VITE_WORKER_URL}/api/health`)
      .then(r => r.json())
      .then((data: HealthData) => {
        setHealth(data)
        if (data.status !== 'healthy') console.error('[health] Worker unhealthy:', data)
        else console.log(`[health] Groq connected (key: ${data.keyPrefix}…)`)
      })
      .catch(e => console.error('[health] check failed:', e))
  }, [])

  return (
    <ThemeProvider>
      <BrowserRouter basename="/certpath-ai">
        <AnnouncementBanner
          banner={bannerDismissed ? null : (health?.banner ?? null)}
          onDismiss={() => setBannerDismissed(true)}
        />
        <OfflineBanner />
        <MaintenanceGate maintenance={health?.maintenance ?? false}>
          <Routes>
            {/* Public */}
            <Route path="/"      element={<RootRedirect />} />
            <Route path="/login" element={<LoginPage />} />

            {/* Admin */}
            <Route path="/admin" element={<ProtectedRoute><AdminRoute><AdminPage /></AdminRoute></ProtectedRoute>} />

            {/* Dashboard */}
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

            {/* Cert-scoped routes */}
            <Route path="/:certId/learn"            element={<ProtectedRoute><CertLearnPage /></ProtectedRoute>} />
            <Route path="/:certId/learn/:domainSlug" element={<ProtectedRoute><CertLearnPage /></ProtectedRoute>} />
            <Route path="/:certId/exam/*"            element={<ProtectedRoute><CertExamPage /></ProtectedRoute>} />
            <Route path="/:certId/results"           element={<ProtectedRoute><ResultsPage /></ProtectedRoute>} />
            <Route path="/:certId/history"           element={<ProtectedRoute><CertHistoryPage /></ProtectedRoute>} />

            {/* Legacy redirects */}
            <Route path="/learn"             element={<Navigate to="/ccxp/learn" replace />} />
            <Route path="/learn/:domainSlug" element={<Navigate to="/ccxp/learn" replace />} />
            <Route path="/exam/*"            element={<Navigate to="/ccxp/exam"  replace />} />
            <Route path="/results"           element={<Navigate to="/ccxp/results" replace />} />
            <Route path="/history"           element={<Navigate to="/ccxp/history" replace />} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </MaintenanceGate>
        <MobileBottomNav />
        <TutorChatWrapper />
      </BrowserRouter>
    </ThemeProvider>
  )
}
