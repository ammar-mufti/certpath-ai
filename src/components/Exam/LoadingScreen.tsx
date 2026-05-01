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

  const lastUpdateRef = useRef(Date.now())
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
      <div className="min-h-screen bg-navy flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="text-fail text-lg mb-4">{error}</div>
          <button
            onClick={() => navigate(`/${certId}/exam`)}
            className="bg-gold text-navy font-bold px-6 py-2 rounded-lg hover:bg-amber-400 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  const barWidth = Math.min(progress.percent, 100)

  return (
    <div className="min-h-screen bg-navy flex items-center justify-center px-4">
      <div className="text-center max-w-sm w-full">
        <div className="text-gold text-4xl font-serif mb-2">{cert?.icon}</div>
        <div className="text-cream text-lg font-bold mb-1">{cert?.name ?? certId}</div>
        <div className="text-cream text-base mb-2 animate-pulse">{progress.message}</div>
        <div className="text-mist text-sm mb-6">
          {progress.collected} / {progress.total} questions ready
        </div>
        <div className="w-full bg-ink rounded-full h-2">
          <div
            className="bg-gold h-2 rounded-full transition-all duration-500"
            style={{ width: `${barWidth}%` }}
          />
        </div>
        <div className="text-mist text-xs mt-2">{progress.percent}%</div>

        {stuck && progress.collected > 0 && (
          <div className="mt-8 bg-ink border border-warn/30 rounded-xl p-4 text-left space-y-3">
            <p className="text-warn text-sm font-semibold">Taking longer than usual…</p>
            <p className="text-mist text-xs">
              {progress.collected} questions generated so far. You can start now or keep waiting.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => navigate(`/${certId}/exam`)}
                className="flex-1 py-2 rounded-lg border border-white/20 text-mist text-xs hover:text-cream transition-colors"
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
                className="flex-1 py-2 rounded-lg bg-gold text-navy text-xs font-bold hover:bg-amber-400 transition-colors"
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
