interface Props {
  formatted: string
  timerColor: string
  timerPulse: string
}

export default function TimerDisplay({ formatted, timerColor, timerPulse }: Props) {
  return (
    <div style={{
      fontFamily: 'monospace',
      fontWeight: 700,
      fontSize: '1.125rem',
      color: timerColor === 'text-gold' ? 'var(--accent)' : timerColor === 'text-fail' ? 'var(--error)' : 'var(--text)',
      animation: timerPulse ? 'pulse 1.5s ease-in-out infinite' : 'none',
    }}>
      {formatted}
    </div>
  )
}
