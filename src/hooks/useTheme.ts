import { useState, useEffect } from 'react'

export function useTheme() {
  const [isDark, setIsDark] = useState(() => {
    const stored = localStorage.getItem('certpath_theme')
    if (stored) return stored === 'dark'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    const root = document.documentElement
    if (isDark) {
      root.classList.add('dark')
      root.classList.remove('light')
    } else {
      root.classList.remove('dark')
      root.classList.add('light')
    }
    localStorage.setItem('certpath_theme', isDark ? 'dark' : 'light')
  }, [isDark])

  const toggle = () => setIsDark(prev => !prev)
  return { isDark, toggle }
}
