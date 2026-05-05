import React, { useState, useEffect } from 'react'
import { useParams, useLocation } from 'react-router-dom'
import TutorChat from '../AI/TutorChat'

interface AppShellProps {
  children: React.ReactNode
  sidebar?: React.ReactNode
}

export function AppShell({ children, sidebar }: AppShellProps) {
  const [tutorOpen, setTutorOpen] = useState(false)
  const { certId } = useParams<{ certId: string }>()
  const location = useLocation()

  const pageContext = location.pathname.includes('/exam')
    ? `User is taking a ${certId?.toUpperCase()} practice exam`
    : location.pathname.includes('/learn/')
      ? `User is studying a domain in ${certId?.toUpperCase()}`
      : `User is on the ${certId?.toUpperCase()} study guide`

  const sidebarWithTutor = sidebar && React.isValidElement(sidebar)
    ? React.cloneElement(sidebar as React.ReactElement<{ onOpenTutor?: () => void }>, {
        onOpenTutor: () => setTutorOpen(true),
      })
    : sidebar

  useEffect(() => {
    const handler = () => setTutorOpen(true)
    window.addEventListener('certpath-open-tutor', handler)
    return () => window.removeEventListener('certpath-open-tutor', handler)
  }, [])

  return (
    <div style={{
      display: 'flex',
      minHeight: '100dvh',
      paddingTop: 56,
    }}>
      {sidebarWithTutor && (
        <aside style={{
          width: 220,
          flexShrink: 0,
          position: 'fixed',
          top: 56,
          bottom: 0,
          left: 0,
          overflowY: 'auto',
          background: 'var(--bg-card)',
          borderRight: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          padding: '1rem 0.75rem',
          gap: 2,
        }}>
          {sidebarWithTutor}
        </aside>
      )}

      <main id="main-scroll" style={{
        flex: 1,
        marginLeft: sidebar ? 220 : 0,
        padding: '2rem',
        overflowY: 'auto',
        height: 'calc(100dvh - 56px)',
      }}>
        {children}
      </main>

      {/* Tutor chat panel */}
      <TutorChat
        isOpen={tutorOpen}
        onClose={() => setTutorOpen(false)}
        pageContext={pageContext}
      />

      {/* Floating tutor button (mobile / no sidebar) */}
      {!tutorOpen && (
        <button
          onClick={() => setTutorOpen(true)}
          style={{
            position: 'fixed',
            bottom: 80,
            right: 24,
            width: 52,
            height: 52,
            borderRadius: '50%',
            background: 'var(--accent)',
            color: 'var(--accent-fg)',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(242,202,80,0.4)',
            zIndex: 100,
            fontSize: 22,
            transition: 'transform 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
          title="Open AI Tutor"
        >
          🎓
        </button>
      )}
    </div>
  )
}
