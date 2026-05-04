import { useState, useCallback, useEffect } from 'react'
import { Routes, Route, useNavigate, useSearchParams } from 'react-router-dom'
import { useExamStore } from '../store/examStore'
import { useTimer } from '../hooks/useTimer'
import { getCert } from '../data/certifications'
import TopNav from '../components/Nav/TopNav'
import ConfigScreen from '../components/Exam/ConfigScreen'
import LoadingScreen from '../components/Exam/LoadingScreen'
import QuestionCard from '../components/Exam/QuestionCard'
import NavigationBar from '../components/Exam/NavigationBar'
import TimerDisplay from '../components/Exam/TimerDisplay'
import SubmitModal from '../components/Exam/SubmitModal'

interface Props {
  certId: string
}

function ActiveExam({ certId }: { certId: string }) {
  const { mode, questions, answers, currentIndex, submitExam, answerQuestion } = useExamStore()
  const navigate = useNavigate()
  const [showModal, setShowModal] = useState(false)

  const cert = getCert(certId)

  const handleExpire = useCallback(() => {
    submitExam()
    navigate(`/${certId}/results`, { replace: true })
  }, [submitExam, navigate, certId])

  const fullDuration   = cert ? cert.examDuration * 60 : 3 * 60 * 60
  const miniDuration   = 60 * 60
  const domainDuration = 30 * 60
  const duration = mode === 'full' ? fullDuration : mode === 'mini' ? miniDuration : domainDuration

  const { formatted, timerColor, timerPulse, start, stop } = useTimer(duration, handleExpire)

  useEffect(() => {
    if (questions.length === 0) { navigate(`/${certId}/exam`, { replace: true }); return }
    start()
    return () => stop()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (questions.length === 0) return null

  const question = questions[currentIndex]

  function confirm() {
    stop()
    submitExam()
    navigate(`/${certId}/results`, { replace: true })
  }

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      <div style={{
        background: 'var(--bg-card)', borderBottom: '1px solid var(--border)',
        padding: '12px 20px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 40,
      }}>
        <div style={{ fontSize: 13, color: 'var(--text-2)' }}>
          {questions.length}Q · {mode === 'full' ? 'Full Exam' : mode === 'mini' ? 'Mini Drill' : 'Domain Drill'}
        </div>
        <TimerDisplay formatted={formatted} timerColor={timerColor} timerPulse={timerPulse} />
        <div style={{ fontSize: 13, color: 'var(--text-2)' }}>
          {Object.keys(answers).length}/{questions.length}
        </div>
      </div>

      <div style={{ flex: 1, maxWidth: 720, margin: '0 auto', width: '100%', padding: '1.5rem 1.25rem' }}>
        <QuestionCard
          question={question}
          selectedAnswer={answers[question.id]}
          onAnswer={ans => answerQuestion(question.id, ans)}
          questionNumber={currentIndex + 1}
          totalQuestions={questions.length}
        />
      </div>

      <div style={{ position: 'sticky', bottom: 0, zIndex: 40 }}>
        <NavigationBar onSubmit={() => setShowModal(true)} />
      </div>

      {showModal && <SubmitModal onConfirm={confirm} onCancel={() => setShowModal(false)} />}
    </div>
  )
}

export default function ExamPage({ certId }: Props) {
  const [params] = useSearchParams()
  const { setMode, setCertId } = useExamStore()
  const navigate = useNavigate()

  useEffect(() => {
    setCertId(certId)
    const domain = params.get('domain')
    if (domain) {
      setMode('domain', domain)
      navigate(`/${certId}/exam/loading`, { replace: true })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Routes>
      <Route index element={
        <div style={{ minHeight: '100dvh', background: 'var(--bg)' }}>
          <TopNav />
          <ConfigScreen certId={certId} />
        </div>
      } />
      <Route path="loading" element={<LoadingScreen certId={certId} />} />
      <Route path="question" element={<ActiveExam certId={certId} />} />
    </Routes>
  )
}
