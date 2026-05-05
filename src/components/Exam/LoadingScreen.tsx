import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useExamStore } from '../../store/examStore'
import { useQuestionGen, type GenProgress } from '../../hooks/useQuestionGen'
import { getCert } from '../../data/certifications'

interface Props {
  certId: string
}

const STUCK_THRESHOLD_MS = 30_000

export default function LoadingScreen({ certId }: Props) {
  const { mode, selectedDomain, setQuestions, setLoading, setError, error } = useExamStore()
  const { generateForMode } = useQuestionGen(certId)
  const navigate = useNavigate()
  const cert = getCert(certId)

  const [progress, setProgress] = useState<GenProgress>({
    percent: 0,
    collected: 0,
    total: 1,
    currentDomain: '',
    message: 'Preparing questions…',
  })
  const [stuck, setStuck] = useState(false)

  const lastUpdateRef = useRef(0)
  const collectedRef = useRef(0)
  const generatedRef = useRef<ReturnType<typeof generateForMode> | null>(null)

  const handleProgress = (p: GenProgress) => {
    setProgress(p)
    lastUpdateRef.current = Date.now()
    collectedRef.current = p.collected
    setStuck(false)
  }

  useEffect(() => {
    if (!mode) { navigate(`/${certId}/exam`); return }

    const promise = generateForMode(mode, selectedDomain, handleProgress)
    generatedRef.current = promise

    promise
      .then(questions => {
        setQuestions(questions)
        setLoading(false)
        navigate(`/${certId}/exam/question`)
      })
      .catch(err => {
        setError(err instanceof Error ? err.message : 'Failed to generate questions')
      })

    const stuckTimer = setInterval(() => {
      if (Date.now() - lastUpdateRef.current > STUCK_THRESHOLD_MS) {
        setStuck(true)
      }
    }, 5_000)

    return () => clearInterval(stuckTimer)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (error) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px' }}>
        <div style={{ textAlign: 'center', maxWidth: 384 }}>
          <div style={{ color: 'var(--error)', fontSize: '1.25rem', marginBottom: 16 }}>{error}</div>
          <button
            onClick={() => navigate(`/${certId}/exam`)}
            className="btn btn-primary"
            style={{ padding: '8px 24px', fontWeight: 700 }}
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  const barWidth = Math.min(progress.percent, 100)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px' }}>
      <div style={{ textAlign: 'center', maxWidth: 384, width: '100%' }}>
        <div style={{ fontSize: '2.25rem', fontFamily: 'Noto Serif, Georgia, serif', marginBottom: 8, color: 'var(--accent)' }}>{cert?.icon}</div>
        <div style={{ color: 'var(--text)', fontSize: '1.25rem', fontWeight: 700, marginBottom: 4 }}>{cert?.name ?? certId}</div>
        <div style={{ color: 'var(--text)', fontSize: 15, marginBottom: 8, animation: 'pulse 1.5s ease-in-out infinite' }}>{progress.message}</div>
        <div style={{ color: 'var(--text-2)', fontSize: 13, marginBottom: 24 }}>
          {progress.collected} / {progress.total} questions ready
        </div>
        <div className="progress-bar" style={{ height: 8 }}>
          <div
            className="progress-fill"
            style={{ width: `${barWidth}%`, transitionDuration: '500ms' }}
          />
        </div>
        <div style={{ color: 'var(--text-2)', fontSize: 11, marginTop: 8 }}>{progress.percent}%</div>

        {stuck && progress.collected > 0 && (
          <div className="card" style={{ marginTop: 32, textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p style={{ color: 'var(--error)', fontSize: 13, fontWeight: 600 }}>Taking longer than usual…</p>
            <p style={{ color: 'var(--text-2)', fontSize: 11 }}>
              {progress.collected} questions generated so far. You can start now or keep waiting.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => navigate(`/${certId}/exam`)}
                className="btn btn-ghost"
                style={{ flex: 1, fontSize: 11 }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  generatedRef.current?.then(questions => {
                    if (questions.length > 0) {
                      setQuestions(questions)
                      setLoading(false)
                      navigate(`/${certId}/exam/question`)
                    }
                  }).catch(() => {
                    navigate(`/${certId}/exam`)
                  })
                  navigate(`/${certId}/exam/question`)
                }}
                className="btn btn-primary"
                style={{ flex: 1, fontSize: 11 }}
              >
                Start with {progress.collected} questions
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
