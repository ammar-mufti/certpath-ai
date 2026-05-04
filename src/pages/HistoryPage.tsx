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
    <div className="card" style={{ padding: '1rem 1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>{modeLabel(attempt.mode)}</div>
          <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>{formatDate(attempt.date)}</div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: passed ? 'var(--success)' : 'var(--error)' }}>
            {attempt.pct}%
          </div>
          <span className={`badge ${passed ? 'badge-success' : 'badge-error'}`} style={{ fontSize: 10 }}>
            {passed ? 'PASS' : 'FAIL'}
          </span>
        </div>
      </div>

      <div className="progress-bar" style={{ marginBottom: 10 }}>
        <div className="progress-fill" style={{
          width: `${attempt.pct}%`,
          background: passed ? 'var(--success)' : 'var(--error)',
        }} />
      </div>

      <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-2)' }}>
        <span>{attempt.score}/{attempt.total} correct</span>
        {attempt.timeTaken > 0 && <span>⏱ {formatTime(attempt.timeTaken)}</span>}
        {attempt.selectedDomain && <span>📍 {attempt.selectedDomain}</span>}
      </div>

      {attempt.domainScores.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
          {attempt.domainScores.map(ds => (
            <span
              key={ds.domain}
              className={`badge ${ds.pct >= passingScore ? 'badge-success' : 'badge-error'}`}
              style={{ fontSize: 10 }}
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
  const best   = getBestScore(certId)
  const latest = getLatestScore(certId)
  const avg    = getAverageScore(certId)

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: '1.5rem' }}>
      {[
        { label: 'Best Score',  value: best   != null ? `${best}%`   : '—', good: (best   ?? 0) >= passingScore },
        { label: 'Latest',      value: latest != null ? `${latest}%` : '—', good: (latest ?? 0) >= passingScore },
        { label: `Average (${certAttempts.length})`, value: avg != null ? `${avg}%` : '—', good: (avg ?? 0) >= passingScore },
      ].map(s => (
        <div key={s.label} className="card" style={{ padding: '1rem', textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: s.good ? 'var(--success)' : 'var(--error)', fontFamily: 'Noto Serif, serif' }}>
            {s.value}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>{s.label}</div>
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
      <div className="card" style={{ padding: '3rem 2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📝</div>
        <h2 style={{ fontSize: '1.25rem', marginBottom: 8 }}>No saved question sets</h2>
        <p style={{ color: 'var(--text-2)', fontSize: 14, marginBottom: '1.25rem' }}>
          Complete your first exam to save questions automatically.
        </p>
        <button className="btn btn-primary" style={{ fontSize: 13 }} onClick={() => navigate(`/${certId}/exam`)}>
          Start an Exam →
        </button>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <p style={{ fontSize: 13, color: 'var(--text-2)' }}>
        Questions are saved automatically after each generation. Retake anytime without using the API.
      </p>
      {sets.map(set => {
        const domainCounts: Record<string, number> = {}
        for (const q of set.questions) domainCounts[q.domain] = (domainCounts[q.domain] ?? 0) + 1
        const lastUsedLabel = set.lastUsed ? formatDate(set.lastUsed) : 'Never used'

        return (
          <div key={set.id} className="card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>{set.label}</div>
                <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
                  {set.totalCount} questions · Used {set.timesUsed}× · Last: {lastUsedLabel}
                </div>
              </div>
              <span className="badge badge-gray" style={{ flexShrink: 0 }}>{modeLabel(set.mode)}</span>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
              {Object.entries(domainCounts).map(([domain, count]) => (
                <span key={domain} className="badge badge-gray" style={{ fontSize: 10 }}>
                  {domain.split(' ')[0]} ({count})
                </span>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-primary" style={{ flex: 1, fontSize: 13 }} onClick={() => handleRetake(set)}>
                Retake This Set →
              </button>
              <button
                className={`btn ${deletingId === set.id ? 'btn-danger' : 'btn-ghost'}`}
                style={{ fontSize: 13, padding: '6px 14px' }}
                onClick={() => handleDelete(set.id)}
              >
                {deletingId === set.id ? 'Confirm Delete' : '🗑'}
              </button>
              {deletingId === set.id && (
                <button className="btn btn-ghost" style={{ fontSize: 13 }} onClick={() => setDeletingId(null)}>
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
    <div style={{ minHeight: '100dvh', background: 'var(--bg)' }}>
      <TopNav />
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '5rem 1.25rem 3rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1.5rem' }}>
          {cert && <span style={{ fontSize: '1.5rem' }}>{cert.icon}</span>}
          <h1 style={{ fontSize: '1.5rem' }}>{cert?.name ?? certId} History</h1>
        </div>

        {/* Tab bar */}
        <div style={{
          display: 'flex', gap: 4, marginBottom: '1.5rem',
          background: 'var(--bg-raised)', borderRadius: 'var(--r)',
          padding: 4, border: '1px solid var(--border)',
        }}>
          {[
            { id: 'records' as Tab, label: `📊 Exam Records${certAttempts.length > 0 ? ` (${certAttempts.length})` : ''}` },
            { id: 'bank' as Tab,    label: `📝 Question Bank${questionBank.hasAny(certId) ? ` (${questionBank.getAll(certId).length})` : ''}` },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                flex: 1, padding: '8px 12px', borderRadius: 'var(--r-sm)',
                border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                background: tab === t.id ? 'var(--accent)' : 'transparent',
                color: tab === t.id ? 'var(--accent-fg)' : 'var(--text-2)',
                transition: 'all 0.15s',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'records' && (
          <>
            {certAttempts.length === 0 ? (
              <div className="card" style={{ padding: '3rem 2rem', textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
                <h2 style={{ fontSize: '1.25rem', marginBottom: 8 }}>No {cert?.name ?? certId} exam history yet</h2>
                <p style={{ color: 'var(--text-2)', fontSize: 14 }}>Complete a practice exam to start tracking your progress</p>
              </div>
            ) : (
              <>
                <StatsBanner certId={certId} passingScore={passingScore} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
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
