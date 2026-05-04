import { useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useExamStore } from '../store/examStore'
import { useHistoryStore, buildDomainScores } from '../store/historyStore'
import { getCert } from '../data/certifications'
import { tracker } from '../services/activityTracker'
import TopNav from '../components/Nav/TopNav'
import ScoreRing from '../components/Results/ScoreRing'
import DomainBreakdown from '../components/Results/DomainBreakdown'
import WrongAnswers from '../components/Results/WrongAnswers'
import StudyPlan from '../components/Results/StudyPlan'

export default function ResultsPage() {
  const { certId: certIdParam } = useParams<{ certId?: string }>()
  const certId = certIdParam ?? useExamStore.getState().currentCertId ?? 'ccxp'
  const cert = getCert(certId)

  const { questions, answers, submitted, mode, selectedDomain, resetExam, buildWrongQuestions } = useExamStore()
  const navigate = useNavigate()
  const savedRef = useRef(false)

  useEffect(() => {
    if (!submitted || questions.length === 0) { navigate(`/${certId}/exam`, { replace: true }); return }
    if (savedRef.current) return
    savedRef.current = true

    const correct = questions.filter(q => answers[q.id] === q.correct).length
    const pct = Math.round((correct / questions.length) * 100)
    const domainScores = buildDomainScores(questions, answers)

    useHistoryStore.getState().addAttempt({
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      mode: (mode ?? 'full') as 'full' | 'mini' | 'domain',
      selectedDomain: selectedDomain ?? null,
      score: correct,
      total: questions.length,
      pct,
      timeTaken: 0,
      domainScores,
      wrongQuestions: buildWrongQuestions(),
      certId,
      certName: cert?.name ?? certId,
    })
    tracker.examCompleted(certId, pct)
  }, [submitted, questions.length]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!submitted || questions.length === 0) return null

  const correct = questions.filter(q => answers[q.id] === q.correct).length
  const pct = Math.round((correct / questions.length) * 100)
  const passed = pct >= (cert?.passingScore ?? 70)

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)' }}>
      <TopNav />
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '5rem 1.25rem 3rem' }}>

        {/* Score card */}
        <div className="card" style={{ padding: '2rem', textAlign: 'center', marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '1.5rem', marginBottom: 6 }}>
            {cert?.icon} {cert?.name ?? certId} Results
          </h1>
          <p style={{ color: 'var(--text-2)', fontSize: 14, marginBottom: '1.5rem' }}>
            Pass mark: {cert?.passingScore ?? 70}%
          </p>
          <ScoreRing score={correct} total={questions.length} />
          <div style={{ marginTop: '1rem' }}>
            <span className={`badge ${passed ? 'badge-success' : 'badge-error'}`} style={{ fontSize: 14, padding: '6px 16px' }}>
              {passed ? '✓ PASS' : '✗ FAIL'}
            </span>
          </div>
        </div>

        <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
          <DomainBreakdown questions={questions} answers={answers} />
        </div>

        <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
          <StudyPlan questions={questions} answers={answers} />
        </div>

        <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
          <WrongAnswers questions={questions} answers={answers} />
        </div>

        <div style={{ display: 'flex', gap: 10, paddingBottom: '2rem', flexWrap: 'wrap' }}>
          <button
            className="btn btn-primary"
            style={{ flex: 1 }}
            onClick={() => { resetExam(); navigate(`/${certId}/exam`) }}
          >
            New Exam
          </button>
          <button
            className="btn btn-secondary"
            style={{ flex: 1 }}
            onClick={() => navigate(`/${certId}/history`)}
          >
            View History
          </button>
          <button
            className="btn btn-ghost"
            style={{ flex: 1 }}
            onClick={() => { resetExam(); navigate(`/${certId}/learn`) }}
          >
            Back to Study
          </button>
        </div>
      </div>
    </div>
  )
}
