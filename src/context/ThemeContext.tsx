import { createContext, useContext, useState, useCallback } from 'react'

interface ThemeContextValue {
  isDark: boolean
  toggle: () => void
}

const ThemeContext = createContext<ThemeContextValue>({ isDark: false, toggle: () => {} })

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(
    () => document.documentElement.classList.contains('dark')
  )

  const toggle = useCallback(() => {
    const next = !isDark
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('certpath_theme', next ? 'dark' : 'light')
    setIsDark(next)
  }, [isDark])

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
