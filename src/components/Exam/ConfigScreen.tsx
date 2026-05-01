import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useExamStore } from '../../store/examStore'
import { questionBank } from '../../services/questionBank'
import { getCert } from '../../data/certifications'
import type { SavedQuestionSet } from '../../services/questionBank'

interface Props {
  certId: string
}

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
  const [sets, setSets] = useState<SavedQuestionSet[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    const all = questionBank.getAll(certId)
    setSets(all)

    const retakeId = sessionStorage.getItem('certpath_retake_set_id')
    if (retakeId) {
      sessionStorage.removeItem('certpath_retake_set_id')
      setSelectedId(retakeId)
    } else if (all.length > 0) {
      setSelectedId(all[0].id)
    }
  }, [certId])

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
    <div className="bg-ink border border-white/10 rounded-xl p-5 space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-lg">🔄</span>
        <div>
          <div className="text-cream font-bold text-sm">Retake Saved Questions</div>
          <div className="text-mist text-xs">No API calls — starts instantly</div>
        </div>
      </div>

      <div className="space-y-1.5">
        {sets.map(s => (
          <button
            key={s.id}
            onClick={() => setSelectedId(s.id)}
            className={`w-full text-left px-3 py-2.5 rounded-lg border transition-all flex items-center justify-between gap-3 ${
              selectedId === s.id
                ? 'border-gold/60 bg-gold/10 text-cream'
                : 'border-white/10 text-mist hover:border-white/30 hover:text-cream'
            }`}
          >
            <div className="min-w-0">
              <div className="text-xs font-semibold truncate">{s.label}</div>
              <div className="text-[10px] text-mist/60 mt-0.5">
                {s.totalCount}Q · Used {s.timesUsed}×{s.lastUsed ? ` · Last: ${formatDate(s.lastUsed)}` : ''}
              </div>
            </div>
            <div className={`w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 transition-colors ${
              selectedId === s.id ? 'border-gold bg-gold' : 'border-white/30'
            }`} />
          </button>
        ))}
      </div>

      {selected && (
        <button
          onClick={startRetake}
          className="w-full py-2.5 rounded-xl bg-gold text-navy font-bold text-sm hover:bg-amber-400 transition-colors"
        >
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

  const [genMode, setGenMode] = useState<'full' | 'mini'>('full')

  if (!cert) return null

  const miniCount = Math.round(cert.examQuestions * 0.2)

  function startGenerate() {
    setMode(genMode)
    navigate(`/${certId}/exam/loading`)
  }

  function startDomainDrill(domainName: string) {
    setMode('domain', domainName)
    navigate(`/${certId}/exam/loading`)
  }

  return (
    <div className="bg-ink border border-white/10 rounded-xl p-5 space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-lg">✨</span>
        <div>
          <div className="text-cream font-bold text-sm">Generate New Questions</div>
          <div className="text-mist text-xs">Fresh AI-generated set · saved automatically</div>
        </div>
      </div>

      <div className="flex gap-2">
        {(['full', 'mini'] as const).map(m => (
          <button
            key={m}
            onClick={() => setGenMode(m)}
            className={`flex-1 py-2 rounded-lg border text-sm font-semibold transition-all ${
              genMode === m
                ? 'border-gold bg-gold/20 text-gold'
                : 'border-white/10 text-mist hover:border-white/30 hover:text-cream'
            }`}
          >
            {m === 'full' ? `Full Exam · ${cert.examQuestions}Q` : `Mini Drill · ${miniCount}Q`}
          </button>
        ))}
      </div>

      <button
        onClick={startGenerate}
        className="w-full py-2.5 rounded-xl bg-gold text-navy font-bold text-sm hover:bg-amber-400 transition-colors"
      >
        Generate & Start {genMode === 'full' ? cert.examQuestions : miniCount} Questions →
      </button>

      <div className="pt-1 border-t border-white/10">
        <div className="text-xs text-mist mb-2 font-semibold">Domain Drill · 10Q each</div>
        <div className="grid grid-cols-2 gap-2">
          {cert.domains.map(domain => (
            <button
              key={domain.name}
              onClick={() => startDomainDrill(domain.name)}
              className="bg-navy/60 border border-white/10 hover:border-white/30 rounded-lg p-2.5 text-left transition-all flex items-center gap-2"
            >
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: cert.color }} />
              <span className="text-cream text-xs font-medium leading-tight">{domain.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function ConfigScreen({ certId }: Props) {
  const cert = getCert(certId)
  const hasSaved = questionBank.hasAny(certId)

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">
      <div className="mb-6">
        <h1 className="text-cream font-serif text-2xl mb-1">
          📝 {cert?.name ?? certId} Practice Exam
        </h1>
        <p className="text-mist text-sm">
          {cert
            ? `${cert.examQuestions} questions · ${cert.examDuration} min · Pass: ${cert.passingScore}%`
            : hasSaved ? 'Retake saved questions or generate a fresh set.' : 'Generate AI-powered practice questions.'
          }
        </p>
      </div>

      {hasSaved && <RetakePanel certId={certId} />}

      {hasSaved && (
        <div className="flex items-center gap-3 py-1">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-mist/40 text-xs">or</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>
      )}

      <GeneratePanel certId={certId} />
    </div>
  )
}
