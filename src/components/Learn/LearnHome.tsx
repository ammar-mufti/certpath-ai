import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLearnStore } from '../../store/learnStore'
import { contentCache } from '../../services/contentCache'
import { getCert } from '../../data/certifications'
import { toDomainSlug } from '../../utils/domainUtils'
import StudyPlanPanel from './StudyPlanPanel'
import LearnLayout from './LearnLayout'

type ResetMode = null | 'all' | 'content'

interface Props {
  certId: string
}

export default function LearnHome({ certId }: Props) {
  const navigate = useNavigate()
  const cert = getCert(certId)
  const { getDomainProgress, resetProgress } = useLearnStore()
  const [resetMode, setResetMode] = useState<ResetMode>(null)
  const [toast, setToast] = useState<string | null>(null)

  if (!cert) return null

  const examDateKey = `${certId}_exam_date`
  const examDate = localStorage.getItem(examDateKey)
  const daysLeft = examDate
    ? Math.ceil((new Date(examDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null

  const overallProgress = cert.domains.length > 0
    ? Math.round(cert.domains.reduce((sum, d) => sum + getDomainProgress(certId, d.name), 0) / cert.domains.length)
    : 0

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  function handleResetAll() {
    contentCache.clearCert(certId)
    resetProgress()
    setResetMode(null)
    showToast('✓ Progress reset — fresh content generates as you study')
    setTimeout(() => window.location.reload(), 1500)
  }

  function handleResetContent() {
    contentCache.clearCert(certId)
    setResetMode(null)
    showToast('✓ AI content cleared — will regenerate as you study')
    setTimeout(() => window.location.reload(), 1500)
  }

  return (
    <LearnLayout>
    <div className="max-w-3xl mx-auto px-6 py-8">
      {toast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-pass text-white text-sm font-medium px-5 py-2.5 rounded-xl shadow-lg">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-cream font-serif text-3xl">
            {cert.icon} {cert.name} Study Guide
          </h1>
          <p className="text-mist text-sm mt-1">
            {cert.examQuestions}Q · {cert.examDuration}min · Pass: {cert.passingScore}% · {cert.issuer}
          </p>
        </div>
        <div className="flex gap-4">
          {daysLeft !== null && (
            <div className="bg-ink rounded-xl p-3 text-center border border-white/10">
              <div className={`text-2xl font-bold ${daysLeft <= 2 ? 'text-warn' : 'text-gold'}`}>{daysLeft}</div>
              <div className="text-mist text-xs">days left</div>
            </div>
          )}
          <div className="bg-ink rounded-xl p-3 text-center border border-white/10">
            <div className="text-2xl font-bold text-gold">{overallProgress}%</div>
            <div className="text-mist text-xs">readiness</div>
          </div>
        </div>
      </div>

      {/* Exam date setter */}
      {!examDate && (
        <div className="bg-warn/10 border border-warn/30 rounded-xl p-4 mb-6 flex items-center gap-3">
          <span className="text-warn">⚠</span>
          <span className="text-cream text-sm flex-1">Set your exam date to see countdown</span>
          <input
            type="date"
            className="bg-navy border border-white/20 rounded-lg px-3 py-1 text-cream text-sm"
            onChange={e => { localStorage.setItem(examDateKey, e.target.value); window.location.reload() }}
          />
        </div>
      )}

      {/* Domain cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {cert.domains.map(domain => {
          const progress = getDomainProgress(certId, domain.name)
          const color = cert.color
          const cached = contentCache.hasContent(certId, domain.name)
          const generatedDate = contentCache.getGeneratedDate(certId, domain.name)
          const circumference = 2 * Math.PI * 20
          const offset = circumference - (progress / 100) * circumference

          let statusDot = '⚫'
          let statusColor = 'text-mist/40'
          if (cached && progress >= 80) { statusDot = '🟢'; statusColor = 'text-pass' }
          else if (cached || progress > 0) { statusDot = '🟡'; statusColor = 'text-warn' }

          return (
            <button
              key={domain.name}
              onClick={() => navigate(`/${certId}/learn/${toDomainSlug(domain.name)}`)}
              className="bg-ink border border-white/10 hover:border-white/30 rounded-xl p-5 text-left transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <div className="text-cream font-semibold text-sm group-hover:text-gold transition-colors">{domain.name}</div>
                  <div className="text-mist text-xs mt-0.5">{domain.percentage}% of exam · {domain.weight}Q</div>
                </div>
                <svg width="48" height="48" className="-rotate-90 flex-shrink-0">
                  <circle cx="24" cy="24" r="20" fill="none" stroke="#1A2B3C" strokeWidth="4" />
                  <circle cx="24" cy="24" r="20" fill="none" stroke={color} strokeWidth="4"
                    strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" />
                </svg>
              </div>

              <div className="flex items-center justify-between mb-2">
                <div className="h-1.5 flex-1 bg-navy rounded-full mr-3">
                  <div className="h-1.5 rounded-full" style={{ width: `${progress}%`, backgroundColor: color }} />
                </div>
                <span className="text-mist text-xs">{progress}%</span>
              </div>

              <div className="flex items-center justify-between mt-2">
                <span className={`text-xs ${statusColor}`}>
                  {statusDot} {cached && generatedDate ? `Ready · ${generatedDate}` : cached ? 'Content ready' : 'Not yet generated'}
                </span>
              </div>
            </button>
          )
        })}
      </div>

      {/* CTA */}
      <div className="flex justify-center mb-10">
        <button
          onClick={() => navigate(`/${certId}/exam`)}
          className="bg-gold text-navy font-bold px-8 py-3 rounded-xl hover:bg-amber-400 transition-colors text-lg"
        >
          Take Full Practice Exam →
        </button>
      </div>

      <StudyPlanPanel />

      {/* Reset section */}
      <div className="mt-10 pt-6 border-t border-white/10 space-y-3">
        {resetMode === null && (
          <div className="flex gap-4">
            <button onClick={() => setResetMode('all')} className="text-mist/50 hover:text-mist text-sm transition-colors">
              ↺ Reset Study Progress
            </button>
            <span className="text-white/20">·</span>
            <button onClick={() => setResetMode('content')} className="text-mist/50 hover:text-mist text-sm transition-colors">
              ↺ Regenerate AI content only
            </button>
          </div>
        )}

        {resetMode === 'all' && (
          <div className="bg-ink border border-fail/20 rounded-xl p-4 space-y-3">
            <div>
              <p className="text-cream text-sm font-semibold mb-1">Reset {cert.name} study progress?</p>
              <p className="text-mist text-xs">Clears: AI content, topic read marks, quiz scores</p>
              <p className="text-pass text-xs mt-1">Exam history will NOT be cleared</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setResetMode(null)} className="px-4 py-1.5 rounded-lg border border-white/20 text-mist text-sm hover:text-cream transition-colors">Cancel</button>
              <button onClick={handleResetAll} className="px-4 py-1.5 rounded-lg bg-fail text-white font-bold text-sm hover:bg-red-600 transition-colors">Yes, Reset Everything</button>
            </div>
          </div>
        )}

        {resetMode === 'content' && (
          <div className="bg-ink border border-warn/20 rounded-xl p-4 space-y-3">
            <div>
              <p className="text-cream text-sm font-semibold mb-1">Regenerate {cert.name} AI content?</p>
              <p className="text-mist text-xs">Clears cached AI content only — your progress and exam history are kept</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setResetMode(null)} className="px-4 py-1.5 rounded-lg border border-white/20 text-mist text-sm hover:text-cream transition-colors">Cancel</button>
              <button onClick={handleResetContent} className="px-4 py-1.5 rounded-lg bg-warn text-navy font-bold text-sm hover:bg-amber-500 transition-colors">Yes, Regenerate</button>
            </div>
          </div>
        )}
      </div>
    </div>
    </LearnLayout>
  )
}
