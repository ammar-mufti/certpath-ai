import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useExamStore } from '../../store/examStore'
import { questionBank } from '../../services/questionBank'
import { getCert } from '../../data/certifications'

function fisherYates<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function RetakePanel({ certId }: { certId: string }) {
  const { setMode, setQuestions, setCurrentSetId, setLoading } = useExamStore()
  const navigate = useNavigate()
  const sets = questionBank.getAll(certId)

  const retakeId = typeof window !== 'undefined' ? sessionStorage.getItem('certpath_retake_set_id') : null
  const defaultSelected = retakeId
    ? (sessionStorage.removeItem('certpath_retake_set_id'), retakeId)
    : sets.length > 0 ? sets[0].id : null
  const [selectedId, setSelectedId] = useState<string | null>(defaultSelected)

  if (sets.length === 0) return null

  const selected = sets.find(s => s.id === selectedId) ?? sets[0]

  function startRetake() {
    if (!selected) return
    const shuffled = fisherYates(selected.questions)
    questionBank.markUsed(selected.id)
    const domainArg = selected.mode === 'domain' ? (selected.domains[0] ?? undefined) : undefined
    setMode(selected.mode, domainArg)
    setCurrentSetId(selected.id)
    setQuestions(shuffled)
    setLoading(false)
    navigate(`/${certId}/exam/question`)
  }

  return (
    <div className="card" style={{ padding: '1.25rem', marginBottom: '1rem' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16,
      }}>
        <span className="material-symbols-outlined" style={{ color: 'var(--accent)', fontSize: 20 }}>refresh</span>
        <div>
          <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text)' }}>Retake Saved Questions</div>
          <div style={{ fontSize: 13, color: 'var(--text-3)' }}>No API calls — starts instantly</div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
        {sets.map(s => (
          <label
            key={s.id}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 14px',
              background: selectedId === s.id ? 'var(--accent-dim)' : 'var(--bg-raised)',
              border: `1px solid ${selectedId === s.id ? 'var(--accent)' : 'var(--border)'}`,
              borderRadius: 8, cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            <input
              type="radio"
              checked={selectedId === s.id}
              onChange={() => setSelectedId(s.id)}
              style={{ accentColor: 'var(--accent)' }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{s.label}</div>
              <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
                {s.totalCount}Q · Used {s.timesUsed}×{s.lastUsed ? ` · Last: ${formatDate(s.lastUsed)}` : ''}
              </div>
            </div>
          </label>
        ))}
      </div>

      {selected && (
        <button
          className="btn btn-primary"
          style={{ width: '100%' }}
          onClick={startRetake}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>play_arrow</span>
          Start Retake · {selected.totalCount}Q →
        </button>
      )}
    </div>
  )
}

function GeneratePanel({ certId }: { certId: string }) {
  const { setMode } = useExamStore()
  const navigate = useNavigate()
  const cert = getCert(certId)

  const [genMode, setGenMode] = useState<'full' | 'mini' | 'domain'>('full')
  const [selectedDomain, setSelectedDomain] = useState('')

  if (!cert) return null

  const miniCount = Math.round(cert.examQuestions * 0.2)

  function startGenerate() {
    const domainArg = genMode === 'domain' ? selectedDomain : undefined
    setMode(genMode as 'full' | 'mini' | 'domain', domainArg)
    navigate(`/${certId}/exam/loading`)
  }

  return (
    <div className="card" style={{ padding: '1.25rem' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4,
      }}>
        <span className="material-symbols-outlined" style={{ color: 'var(--accent)', fontSize: 20 }}>auto_awesome</span>
        <div>
          <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text)' }}>Generate New Questions</div>
          <div style={{ fontSize: 13, color: 'var(--text-3)' }}>Fresh AI-generated set · saved automatically</div>
        </div>
      </div>

      {/* Mode selector */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8,
        margin: '20px 0',
      }}>
        {[
          { m: 'full' as const, label: 'Full Exam', count: cert.examQuestions, time: cert.examDuration },
          { m: 'mini' as const, label: 'Mini Drill', count: miniCount, time: 60 },
        ].map(opt => (
          <button
            key={opt.m}
            onClick={() => setGenMode(opt.m)}
            style={{
              padding: 14, borderRadius: 10,
              border: `2px solid ${genMode === opt.m ? 'var(--accent)' : 'var(--border)'}`,
              background: genMode === opt.m ? 'var(--accent-dim)' : 'var(--bg-raised)',
              cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
            }}
          >
            <div style={{
              fontWeight: 700, fontSize: 15,
              color: genMode === opt.m ? 'var(--accent)' : 'var(--text)',
              marginBottom: 4,
            }}>
              {opt.label}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
              {opt.count}Q · {opt.time} min
            </div>
          </button>
        ))}
      </div>

      {/* Domain drill */}
      <div style={{ marginBottom: 20 }}>
        <div style={{
          fontSize: 11, fontWeight: 600, letterSpacing: '0.08em',
          textTransform: 'uppercase', color: 'var(--text-3)',
          marginBottom: 8,
        }}>
          Domain Drill · 10Q each
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {cert.domains.map(d => (
            <button
              key={d.name}
              onClick={() => { setGenMode('domain'); setSelectedDomain(d.name) }}
              style={{
                padding: '6px 14px', borderRadius: 'var(--r-full)',
                border: `1px solid ${genMode === 'domain' && selectedDomain === d.name ? 'var(--accent)' : 'var(--border)'}`,
                background: genMode === 'domain' && selectedDomain === d.name ? 'var(--accent-dim)' : 'var(--bg-raised)',
                color: genMode === 'domain' && selectedDomain === d.name ? 'var(--accent)' : 'var(--text-2)',
                fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              {d.name}
            </button>
          ))}
        </div>
      </div>

      <button
        className="btn btn-primary"
        style={{ width: '100%' }}
        onClick={startGenerate}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>auto_awesome</span>
        Generate &amp; Start {
          genMode === 'domain' ? '10'
          : genMode === 'mini' ? miniCount
          : cert.examQuestions
        } Questions →
      </button>
    </div>
  )
}

export default function ConfigScreen({ certId: propCertId }: { certId?: string }) {
  const { certId: paramCertId } = useParams<{ certId: string }>()
  const certId = propCertId || paramCertId || ''
  const cert = getCert(certId)
  const hasSaved = questionBank.hasAny(certId || '')

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{
          fontSize: 11, fontWeight: 600, letterSpacing: '0.08em',
          textTransform: 'uppercase', color: 'var(--text-3)',
          marginBottom: 8,
        }}>
          {cert?.issuer} · {cert?.name}
        </div>
        <h1 style={{
          fontFamily: 'Noto Serif, serif', fontSize: '1.75rem', marginBottom: 8,
        }}>
          Practice Exam
        </h1>
        <p style={{ color: 'var(--text-2)', fontSize: 14 }}>
          {cert
            ? `${cert.examQuestions} questions · ${cert.examDuration} minutes · Pass ${cert.passingScore}%`
            : 'Generate AI-powered practice questions.'
          }
        </p>
      </div>

      {hasSaved && <RetakePanel certId={certId} />}

      {hasSaved && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '16px 0' }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          <span style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 500 }}>or</span>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>
      )}

      <GeneratePanel certId={certId} />
    </div>
  )
}
