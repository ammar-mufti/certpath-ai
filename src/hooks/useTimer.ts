import { useRef, useEffect, useCallback } from 'react'
import { create } from 'zustand'

interface TimerState {
  secondsLeft: number
  running: boolean
  setSecondsLeft: (s: number) => void
  setRunning: (r: boolean) => void
}

export const useTimerStore = create<TimerState>((set) => ({
  secondsLeft: 0,
  running: false,
  setSecondsLeft: (s) => set({ secondsLeft: s }),
  setRunning: (r) => set({ running: r }),
}))

export function useTimer(initialSeconds: number, onExpire: () => void) {
  const { secondsLeft, running, setSecondsLeft, setRunning } = useTimerStore()
  const onExpireRef = useRef(onExpire)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => { onExpireRef.current = onExpire }, [onExpire])

  const start = useCallback(() => {
    // Only restore from sessionStorage if the saved value is close to initialSeconds
    // (i.e. same exam mode) — prevents a previous mini/domain timer bleeding into full exam
    const saved = sessionStorage.getItem('certpath_timer_seconds')
    const savedVal = saved ? parseInt(saved, 10) : 0
    const withinRange = savedVal > 0 && savedVal <= initialSeconds
    const startVal = withinRange ? savedVal : initialSeconds
    setSecondsLeft(startVal)
    setRunning(true)
  }, [initialSeconds, setSecondsLeft, setRunning])

  useEffect(() => {
    if (!running) return
    intervalRef.current = setInterval(() => {
      setSecondsLeft(useTimerStore.getState().secondsLeft - 1)
      const current = useTimerStore.getState().secondsLeft
      // Persist every 10s
      if (current % 10 === 0) sessionStorage.setItem('certpath_timer_seconds', String(current))
      if (current <= 0) {
        clearInterval(intervalRef.current!)
        setRunning(false)
        onExpireRef.current()
      }
    }, 1000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [running, setSecondsLeft, setRunning])

  const stop = useCallback(() => {
    setRunning(false)
    if (intervalRef.current) clearInterval(intervalRef.current)
  }, [setRunning])

  const timerColor = secondsLeft > 30 * 60
    ? 'text-gold'
    : secondsLeft > 10 * 60
    ? 'text-amber-400'
    : 'text-red-500'

  const timerPulse = secondsLeft <= 10 * 60 && secondsLeft > 0 ? 'animate-pulse' : ''

  const formatted = (() => {
    const h = Math.floor(secondsLeft / 3600)
    const m = Math.floor((secondsLeft % 3600) / 60)
    const s = secondsLeft % 60
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  })()

  return { secondsLeft, formatted, timerColor, timerPulse, start, stop }
}
