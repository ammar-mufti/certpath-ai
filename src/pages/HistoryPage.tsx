import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TopNav from '../components/Nav/TopNav'
import { useHistoryStore } from '../store/historyStore'
import { questionBank } from '../services/questionBank'
import { getCert } from '../data/certifications'
import type { SavedQuestionSet } from '../services/questionBank'
import type { ExamAttempt } from '../types/history'

interface Props {
  certId: string
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}m ${s}s`
}

function modeLabel(mode: string) {
  if (mode === 'full') return 'Full Exam'
  if (mode === 'mini') return 'Mini Drill'
  return 'Domain Drill'
}

function AttemptCard({ attempt, passingScore }: { attempt: ExamAttempt; passingScore: number }) {
  const passed = attempt.pct >= passingScore
  return (
    <div className="bg-ink border border-white/10 rounded-xl p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-cream font-semibold text-sm">{modeLabel(attempt.mode)}</div>
          <div className="text-mist text-xs mt-0.5">{formatDate(attempt.date)}</div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className={`text-lg font-bold ${passed ? 'text-pass' : 'text-fail'}`}>
            {attempt.pct}%
          </div>
          <div className={`text-xs font-semibold ${passed ? 'text-pass' : 'text-fail'}`}>
            {passed ? 'PASS' : 'FAIL'}
          </div>
        </div>
      </div>

      <div className="h-1.5 bg-white/10 rounded-full">
        <div
          className={`h-1.5 rounded-full transition-all ${passed ? 'bg-pass' : 'bg-fail'}`}
          style={{ width: `${attempt.pct}%` }}
        />
      </div>

      <div className="flex items-center gap-4 text-xs text-mist">
        <span>{attempt.score}/{attempt.total} correct</span>
        {attempt.timeTaken > 0 && <span>⏱ {formatTime(attempt.timeTaken)}</span>}
        {attempt.selectedDomain && <span>📍 {attempt.selectedDomain}</span>}
      </div>

      {attempt.domainScores.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {attempt.domainScores.map(ds => (
            <span
              key={ds.domain}
              className={`text-[10px] px-2 py-0.5 rounded-full ${ds.pct >= passingScore ? 'bg-pass/20 text-pass' : 'bg-fail/20 text-fail'}`}
            >
              {ds.domain.split(' ')[0]} {ds.pct}%
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

function StatsBanner({ certId, passingScore }: { certId: string; passingScore: number }) {
  const { attempts, getBestScore, getLatestScore, getAverageScore } = useHistoryStore()
  const certAttempts = attempts.filter(a => a.certId === certId)
  const best = getBestScore(certId)
  const latest = getLatestScore(certId)
  const avg = getAverageScore(certId)

  return (
    <div className="grid grid-cols-3 gap-3 mb-6">
      {[
        { label: 'Best Score', value: best != null ? `${best}%` : '—', color: 'text-pass' },
        { label: 'Latest', value: latest != null ? `${latest}%` : '—', color: latest != null && latest >= passingScore ? 'text-pass' : 'text-fail' },
        { label: `Average (${certAttempts.length})`, value: avg != null ? `${avg}%` : '—', color: 'text-gold' },
      ].map(s => (
        <div key={s.label} className="bg-ink border border-white/10 rounded-xl p-4 text-center">
          <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
          <div className="text-mist text-xs mt-1">{s.label}</div>
        </div>
      ))}
    </div>
  )
}

function QuestionBankTab({ certId }: { certId: string }) {
  const navigate = useNavigate()
  const [sets, setSets] = useState(() => questionBank.getAll(certId))
  const [deletingId, setDeletingId] = useState<string | null>(null)

  function handleRetake(set: SavedQuestionSet) {
    sessionStorage.setItem('certpath_retake_set_id', set.id)
    navigate(`/${certId}/exam`)
  }

  function handleDelete(id: string) {
    if (deletingId === id) {
      questionBank.delete(id)
      setSets(questionBank.getAll(certId))
      setDeletingId(null)
    } else {
      setDeletingId(id)
    }
  }

  if (sets.length === 0) {
    return (
      <div className="bg-ink rounded-2xl p-12 border border-white/10 text-center">
        <div className="text-5xl mb-4">📝</div>
        <h2 className="text-cream font-serif text-xl mb-2">No saved question sets</h2>
        <p className="text-mist text-sm">Complete your first exam to save questions automatically.</p>
        <button
          onClick={() => navigate(`/${certId}/exam`)}
          className="mt-4 px-6 py-2 bg-gold text-navy font-bold rounded-lg hover:bg-amber-400 transition-colors text-sm"
        >
          Start an Exam →
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-mist text-sm">
        Questions are saved automatically after each generation. Retake anytime without using the API.
      </p>
      {sets.map(set => {
        const domainCounts: Record<string, number> = {}
        for (const q of set.questions) {
          domainCounts[q.domain] = (domainCounts[q.domain] ?? 0) + 1
        }
        const lastUsedLabel = set.lastUsed ? formatDate(set.lastUsed) : 'Never used'

        return (
          <div key={set.id} className="bg-ink border border-white/10 rounded-xl p-5 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-cream font-semibold">{set.label}</div>
                <div className="text-mist text-xs mt-0.5">
                  {set.totalCount} questions · Used {set.timesUsed}× · Last: {lastUsedLabel}
                </div>
              </div>
              <span className="text-xs px-2 py-1 rounded-full bg-white/10 text-mist flex-shrink-0">
                {modeLabel(set.mode)}
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {Object.entries(domainCounts).map(([domain, count]) => (
                <span key={domain} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-mist border border-white/10">
                  {domain.split(' ')[0]} ({count})
                </span>
              ))}
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => handleRetake(set)}
                className="flex-1 py-2 rounded-lg bg-gold text-navy text-sm font-bold hover:bg-amber-400 transition-colors"
              >
                Retake This Set →
              </button>
              <button
                onClick={() => handleDelete(set.id)}
                className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                  deletingId === set.id
                    ? 'bg-fail text-white font-bold'
                    : 'border border-white/20 text-mist hover:border-fail/50 hover:text-fail'
                }`}
              >
                {deletingId === set.id ? 'Confirm Delete' : '🗑 Delete'}
              </button>
              {deletingId === set.id && (
                <button
                  onClick={() => setDeletingId(null)}
                  className="px-3 py-2 rounded-lg text-sm text-mist border border-white/20 hover:text-cream transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

type Tab = 'records' | 'bank'

export default function HistoryPage({ certId }: Props) {
  const [tab, setTab] = useState<Tab>('records')
  const { attempts } = useHistoryStore()
  const cert = getCert(certId)
  const certAttempts = attempts.filter(a => a.certId === certId)
  const passingScore = cert?.passingScore ?? 70

  return (
    <div className="min-h-screen bg-navy">
      <TopNav />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          {cert && <span className="text-2xl">{cert.icon}</span>}
          <h1 className="text-cream font-serif text-2xl">{cert?.name ?? certId} History</h1>
        </div>

        <div className="flex gap-1 mb-6 bg-ink rounded-xl p-1 border border-white/10">
          <button
            onClick={() => setTab('records')}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
              tab === 'records' ? 'bg-gold text-navy' : 'text-mist hover:text-cream'
            }`}
          >
            📊 Exam Records {certAttempts.length > 0 && `(${certAttempts.length})`}
          </button>
          <button
            onClick={() => setTab('bank')}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
              tab === 'bank' ? 'bg-gold text-navy' : 'text-mist hover:text-cream'
            }`}
          >
            📝 Question Bank {questionBank.hasAny(certId) && `(${questionBank.getAll(certId).length})`}
          </button>
        </div>

        {tab === 'records' && (
          <>
            {certAttempts.length === 0 ? (
              <div className="bg-ink rounded-2xl p-12 border border-white/10 text-center">
                <div className="text-5xl mb-4">📊</div>
                <h2 className="text-cream font-serif text-xl mb-2">No {cert?.name ?? certId} exam history yet</h2>
                <p className="text-mist text-sm">Complete a practice exam to start tracking your progress</p>
              </div>
            ) : (
              <>
                <StatsBanner certId={certId} passingScore={passingScore} />
                <div className="space-y-3">
                  {certAttempts.map(a => <AttemptCard key={a.id} attempt={a} passingScore={passingScore} />)}
                </div>
              </>
            )}
          </>
        )}

        {tab === 'bank' && <QuestionBankTab certId={certId} />}
      </div>
    </div>
  )
}
