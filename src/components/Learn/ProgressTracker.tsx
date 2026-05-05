import { useParams } from 'react-router-dom'
import { useLearnStore } from '../../store/learnStore'
import { getCert } from '../../data/certifications'

interface Props { domain: string }

export default function ProgressTracker({ domain }: Props) {
  const { certId: certIdParam } = useParams<{ certId?: string }>()
  const certId = certIdParam ?? 'ccxp'
  const { getReadTopics, progress } = useLearnStore()
  const p = progress[`${certId}::${domain}`]
  const color = getCert(certId)?.color ?? '#C9A84C'

  const topicsRead = getReadTopics(certId, domain).length
  const flashcardsKnown = p?.flashcardsKnown.length ?? 0
  const quizScore = p?.quizScore

  return (
    <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-2)' }}>
      <span style={{ color: topicsRead > 0 ? color : undefined }}>
        {topicsRead} topics read
      </span>
      <span style={{ color: flashcardsKnown > 0 ? color : undefined }}>
        {flashcardsKnown}/10 flashcards
      </span>
      {quizScore !== null && quizScore !== undefined && (
        <span style={{ color }}>Quiz: {quizScore}/5</span>
      )}
    </div>
  )
}
