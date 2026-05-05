import { useExamStore } from '../../store/examStore'

interface Props {
  onConfirm: () => void
  onCancel: () => void
}

export default function SubmitModal({ onConfirm, onCancel }: Props) {
  const { questions, answers } = useExamStore()
  const answered = Object.keys(answers).length
  const unanswered = questions.length - answered

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.7)', zIndex: 50,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '0 16px',
    }}>
      <div className="card" style={{ padding: 32, maxWidth: 384, width: '100%', textAlign: 'center' }}>
        <div style={{ fontSize: '2.25rem', marginBottom: 16 }}>📋</div>
        <h2 style={{ color: 'var(--text)', fontFamily: 'Noto Serif, Georgia, serif', fontSize: '1.25rem', marginBottom: 8 }}>Submit Exam?</h2>

        {unanswered > 0 ? (
          <p style={{ color: 'var(--error)', fontSize: 13, marginBottom: 24 }}>
            You have <strong>{unanswered}</strong> unanswered question{unanswered > 1 ? 's' : ''}.
            These will be marked incorrect.
          </p>
        ) : (
          <p style={{ color: 'var(--text-2)', fontSize: 13, marginBottom: 24 }}>
            All {questions.length} questions answered. Ready to see your results?
          </p>
        )}

        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={onCancel}
            className="btn btn-ghost"
            style={{ flex: 1, fontWeight: 500 }}
          >
            Keep Going
          </button>
          <button
            onClick={onConfirm}
            className="btn btn-primary"
            style={{ flex: 1, fontWeight: 700 }}
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  )
}
