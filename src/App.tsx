import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { useHistoryStore } from './store/historyStore'
import { useLearnStore } from './store/learnStore'
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
import { getCert } from './data/certifications'

function OfflineBanner() {
  const [offline, setOffline] = useState(!navigator.onLine)
  useEffect(() => {
    const on = () => setOffline(false)
    const off = () => setOffline(true)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])
  if (!offline) return null
  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-warn text-navy text-center text-sm py-2 font-medium">
      You're offline — showing cached content
    </div>
  )
}

function RootRedirect() {
  const user = useAuthStore(s => s.user)
  const isLoading = useAuthStore(s => s.isLoading)
  if (isLoading) return (
    <div className="min-h-screen bg-navy flex items-center justify-center">
      <div className="text-gold text-lg animate-pulse">Loading…</div>
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
    <div className="bg-gold text-navy text-xs text-center py-2 px-4 font-medium flex items-center justify-center gap-2">
      <span>{banner}</span>
      <button onClick={onDismiss} className="opacity-60 hover:opacity-100 ml-1">✕</button>
    </div>
  )
}

function MaintenanceGate({ children, maintenance }: { children: React.ReactNode; maintenance: boolean }) {
  const user = useAuthStore(s => s.user)
  const isLoading = useAuthStore(s => s.isLoading)
  if (maintenance && !isLoading && !user?.isAdmin) return <MaintenancePage />
  return <>{children}</>
}

export default function App() {
  const init = useAuthStore(s => s.init)
  const user = useAuthStore(s => s.user)
  const [health, setHealth] = useState<HealthData | null>(null)
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
  }, []) // run once only — never re-run

  return (
    <BrowserRouter basename="/certpath-ai">
      <AnnouncementBanner
        banner={bannerDismissed ? null : (health?.banner ?? null)}
        onDismiss={() => setBannerDismissed(true)}
      />
      <OfflineBanner />
      <MaintenanceGate maintenance={health?.maintenance ?? false}>
        <Routes>
          {/* Public */}
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Admin */}
          <Route path="/admin" element={<ProtectedRoute><AdminRoute><AdminPage /></AdminRoute></ProtectedRoute>} />

          {/* Dashboard */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

          {/* Cert-scoped routes */}
          <Route path="/:certId/learn" element={<ProtectedRoute><CertLearnPage /></ProtectedRoute>} />
          <Route path="/:certId/learn/:domainSlug" element={<ProtectedRoute><CertLearnPage /></ProtectedRoute>} />
          <Route path="/:certId/exam/*" element={<ProtectedRoute><CertExamPage /></ProtectedRoute>} />
          <Route path="/:certId/results" element={<ProtectedRoute><ResultsPage /></ProtectedRoute>} />
          <Route path="/:certId/history" element={<ProtectedRoute><CertHistoryPage /></ProtectedRoute>} />

          {/* Legacy redirects */}
          <Route path="/learn" element={<Navigate to="/ccxp/learn" replace />} />
          <Route path="/learn/:domainSlug" element={<Navigate to="/ccxp/learn" replace />} />
          <Route path="/exam/*" element={<Navigate to="/ccxp/exam" replace />} />
          <Route path="/results" element={<Navigate to="/ccxp/results" replace />} />
          <Route path="/history" element={<Navigate to="/ccxp/history" replace />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </MaintenanceGate>
      <TutorChatWrapper />
    </BrowserRouter>
  )
}
