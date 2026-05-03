import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useLearnStore } from '../../store/learnStore'
import { useHistoryStore } from '../../store/historyStore'
import { contentCache } from '../../services/contentCache'
import { getCert } from '../../data/certifications'
import { toDomainSlug, getDomainIcon } from '../../utils/domainUtils'
import StudyPlanPanel from './StudyPlanPanel'
import LearnLayout from './LearnLayout'

interface Props {
  certId: string
}

export default function LearnHome({ certId }: Props) {
  const navigate = useNavigate()
  const cert = getCert(certId)
  const { getDomainProgress, resetProgress } = useLearnStore()
  const { attempts } = useHistoryStore()
  const [resetMode, setResetMode] = useState<null | 'all' | 'content'>(null)
  const [toast, setToast] = useState<string | null>(null)

  if (!cert) return null

  const userId = useAuthStore.getState().user?.id ?? 'anonymous'
  const examDateKey = `${userId}_${certId}_exam_date`
  const examDate = localStorage.getItem(examDateKey)
  const daysLeft = examDate
    ? Math.ceil((new Date(examDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null

  const overallProgress = cert.domains.length > 0
    ? Math.round(cert.domains.reduce((sum, d) => sum + getDomainProgress(certId, d.name), 0) / cert.domains.length)
    : 0

  // Find weak domain from exam history
  const certAttempts = attempts.filter(a => a.certId === certId)
  let weakDomain: string | null = null
  if (certAttempts.length > 0) {
    const last = certAttempts[0]
    if (last.domainScores && last.domainScores.length > 0) {
      const sorted = [...last.domainScores].sort((a, b) => a.pct - b.pct)
      weakDomain = sorted[0].domain
    }
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  function handleResetAll() {
    contentCache.clearCert(certId)
    resetProgress()
    setResetMode(null)
    showToast('Progress reset — fresh content generates as you study')
    setTimeout(() => window.location.reload(), 1500)
  }

  function handleResetContent() {
    contentCache.clearCert(certId)
    setResetMode(null)
    showToast('AI content cleared — will regenerate as you study')
    setTimeout(() => window.location.reload(), 1500)
  }

  return (
    <LearnLayout>
      <div className="max-w-3xl mx-auto px-5 py-8 pb-24 md:pb-10">
        {toast && (
          <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-surface-container-highest text-on-surface text-sm font-medium px-5 py-2.5 rounded-xl shadow-lg border border-outline-variant">
            {toast}
          </div>
        )}

        {/* Header */}
        <div className="mb-8 space-y-2">
          <span className="font-label text-primary uppercase tracking-widest text-xs">
            {cert.issuer} · {new Date().getFullYear()}
          </span>
          <h1 className="font-serif text-h1 text-on-surface leading-tight">
            {cert.name} study guide
          </h1>
          <p className="text-on-surface-variant text-sm max-w-md leading-relaxed">{cert.about}</p>
        </div>

        {/* AI Insight */}
        <div className="ai-insight-glow rounded-xl p-4 mb-8 border-l-4 border-l-primary flex gap-4 items-start">
          <span className="material-symbols-outlined text-primary mt-0.5 flex-shrink-0">auto_awesome</span>
          <div>
            <h4 className="font-label text-primary mb-1 text-xs">AI RECOMMENDED FOCUS</h4>
            <p className="text-on-surface text-sm leading-relaxed">
              {weakDomain
                ? `Focus on "${weakDomain}" based on your recent exam performance.`
                : cert.domains[0]
                  ? `Start with ${cert.domains[0].name} — it's the highest-weighted domain at ${cert.domains[0].percentage}% of the exam.`
                  : `Begin with the first domain to build foundational knowledge.`
              }
            </p>
          </div>
        </div>

        {/* Progress overview */}
        <div className="bg-surface-container rounded-xl p-5 mb-10 border border-outline-variant">
          <div className="flex justify-between items-end mb-4">
            <div>
              <p className="font-label text-on-surface-variant mb-1 text-xs">OVERALL READINESS</p>
              <p className="font-serif text-2xl font-bold text-on-surface tabular">
                {overallProgress}%
                <span className="text-sm font-sans font-normal text-on-surface-variant"> / 100%</span>
              </p>
            </div>
            <div className="text-right">
              <p className="font-label text-on-surface-variant mb-1 text-xs">EXAM INFO</p>
              <p className="text-primary font-semibold text-sm tabular">
                {cert.examQuestions}Q · Pass {cert.passingScore}%
              </p>
              {daysLeft !== null && (
                <p className={`text-xs mt-0.5 tabular ${daysLeft <= 2 ? 'text-error' : 'text-on-surface-variant'}`}>
                  {daysLeft}d until exam
                </p>
              )}
            </div>
          </div>
          <div className="w-full bg-surface-container-highest h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-primary h-full rounded-full transition-all duration-700"
              style={{ width: `${overallProgress}%`, boxShadow: overallProgress > 0 ? '0 0 8px rgba(242,202,80,0.6)' : 'none' }}
            />
          </div>

          {/* Set exam date */}
          {!examDate && (
            <div className="mt-4 pt-4 border-t border-outline-variant flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-base">calendar_today</span>
              <span className="text-on-surface-variant text-xs flex-1">Set your exam date for a countdown</span>
              <input
                type="date"
                className="bg-surface-container-highest border border-outline-variant rounded-lg px-3 py-1.5 text-on-surface text-xs focus:outline-none focus:border-primary/50"
                onChange={e => { localStorage.setItem(examDateKey, e.target.value); window.location.reload() }}
              />
            </div>
          )}
        </div>

        {/* Domain modules list */}
        <div className="space-y-3 mb-10">
          {cert.domains.map((domain, idx) => {
            const hasContent = contentCache.hasContent(certId, domain.name)
            const generatedDate = contentCache.getGeneratedDate(certId, domain.name)
            const progress = getDomainProgress(certId, domain.name)

            return (
              <div key={domain.name} className="group">
                <button
                  type="button"
                  onClick={() => navigate(`/${certId}/learn/${toDomainSlug(domain.name)}`)}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all duration-200 text-left hover:border-primary/40 ${
                    hasContent
                      ? 'bg-surface-container border-outline-variant hover:bg-surface-container-high'
                      : 'bg-surface-container-low border-outline-variant/60'
                  }`}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    {/* Icon box */}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border flex-shrink-0 ${
                      hasContent
                        ? 'bg-primary/10 border-primary/20 text-primary'
                        : 'bg-surface-container-highest border-outline-variant text-on-surface-variant'
                    }`}>
                      <span className="material-symbols-outlined text-base">{getDomainIcon(domain.name)}</span>
                    </div>

                    <div className="min-w-0">
                      <p className="font-label text-on-surface-variant text-[10px] mb-0.5">
                        DOMAIN {String(idx + 1).padStart(2, '0')} · {domain.percentage}% OF EXAM
                      </p>
                      <h3 className="font-serif font-semibold text-on-surface text-base group-hover:text-primary transition-colors truncate">
                        {domain.name}
                      </h3>
                      <p className="text-on-surface-variant text-xs mt-0.5">
                        {domain.topics.length} topics · {domain.weight} questions
                        {generatedDate && <span className="text-outline"> · {generatedDate}</span>}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0 ml-2">
                    {progress > 0 && (
                      <span className="font-label text-primary text-xs tabular">{progress}%</span>
                    )}
                    <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors text-base">
                      chevron_right
                    </span>
                  </div>
                </button>

                {/* Progress bar under card */}
                {progress > 0 && (
                  <div className="mx-4 mt-1 h-0.5 bg-surface-container-highest rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary/60 transition-all duration-700"
                      style={{ width: `${progress}%`, boxShadow: '0 0 4px rgba(242,202,80,0.4)' }}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Take exam CTA */}
        <button
          onClick={() => navigate(`/${certId}/exam`)}
          className="w-full bg-primary text-on-primary font-bold py-4 rounded-xl shadow-primary-btn hover:shadow-[0_0_20px_rgba(242,202,80,0.4)] hover:scale-[1.01] active:scale-[0.99] transition-all text-sm uppercase tracking-widest mb-10"
        >
          Take {cert.name} practice exam →
        </button>

        <StudyPlanPanel />

        {/* Reset section */}
        <div className="mt-10 pt-6 border-t border-outline-variant space-y-3">
          {resetMode === null && (
            <div className="flex gap-4">
              <button onClick={() => setResetMode('all')} className="text-on-surface-variant/50 hover:text-on-surface-variant text-xs transition-colors">
                ↺ Reset study progress
              </button>
              <span className="text-outline-variant">·</span>
              <button onClick={() => setResetMode('content')} className="text-on-surface-variant/50 hover:text-on-surface-variant text-xs transition-colors">
                ↺ Regenerate AI content
              </button>
            </div>
          )}

          {resetMode === 'all' && (
            <div className="bg-surface-container border border-error/20 rounded-xl p-4 space-y-3">
              <p className="text-on-surface text-sm font-semibold">Reset {cert.name} study progress?</p>
              <p className="text-on-surface-variant text-xs">Clears AI content, topic read marks, and quiz scores. Exam history is kept.</p>
              <div className="flex gap-2">
                <button onClick={() => setResetMode(null)} className="px-4 py-1.5 rounded-lg border border-outline-variant text-on-surface-variant text-sm hover:text-on-surface transition-colors">Cancel</button>
                <button onClick={handleResetAll} className="px-4 py-1.5 rounded-lg bg-error text-on-error font-bold text-sm hover:opacity-90 transition-opacity">Yes, reset</button>
              </div>
            </div>
          )}

          {resetMode === 'content' && (
            <div className="bg-surface-container border border-outline-variant rounded-xl p-4 space-y-3">
              <p className="text-on-surface text-sm font-semibold">Regenerate {cert.name} AI content?</p>
              <p className="text-on-surface-variant text-xs">Clears cached AI content only. Progress and exam history are kept.</p>
              <div className="flex gap-2">
                <button onClick={() => setResetMode(null)} className="px-4 py-1.5 rounded-lg border border-outline-variant text-on-surface-variant text-sm hover:text-on-surface transition-colors">Cancel</button>
                <button onClick={handleResetContent} className="px-4 py-1.5 rounded-lg bg-primary text-on-primary font-bold text-sm hover:brightness-110 transition-all">Yes, regenerate</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </LearnLayout>
  )
}
