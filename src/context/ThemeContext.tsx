import { createContext, useContext, useState, useLayoutEffect, useCallback } from 'react'

interface ThemeContextValue {
  isDark: boolean
  toggle: () => void
}

const ThemeContext = createContext<ThemeContextValue>({ isDark: false, toggle: () => {} })

function getInitialTheme(): boolean {
  try {
    const stored = localStorage.getItem('certpath_theme')
    if (stored === 'dark') return true
    if (stored === 'light') return false
  } catch { /* SSR guard */ }
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(getInitialTheme)

  useLayoutEffect(() => {
    const root = document.documentElement
    if (isDark) {
      root.classList.add('dark')
      root.classList.remove('light')
    } else {
      root.classList.remove('dark')
      root.classList.add('light')
    }
    try { localStorage.setItem('certpath_theme', isDark ? 'dark' : 'light') } catch { /* */ }
  }, [isDark])

  const toggle = useCallback(() => setIsDark(prev => !prev), [])

  return (
    <ThemeContext.Provider value={{ isDark, toggle }}>
      {children}
    </ThemeContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useThemeContext() {
  return useContext(ThemeContext)
}
