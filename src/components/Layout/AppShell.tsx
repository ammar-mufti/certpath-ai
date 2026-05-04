interface AppShellProps {
  children: React.ReactNode
  sidebar?: React.ReactNode
}

export function AppShell({ children, sidebar }: AppShellProps) {
  return (
    <div style={{ display: 'flex', minHeight: '100dvh', paddingTop: 56 }}>
      {sidebar && (
        <aside style={{
          width: 240,
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
          {sidebar}
        </aside>
      )}
      <main style={{
        flex: 1,
        marginLeft: sidebar ? 240 : 0,
        minHeight: 'calc(100dvh - 56px)',
        padding: '2rem',
        maxWidth: sidebar ? 'calc(100% - 240px)' : '100%',
        overflowX: 'hidden',
      }}>
        {children}
      </main>
    </div>
  )
}
