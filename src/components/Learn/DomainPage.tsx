import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { fromDomainSlug, toTopicSlug } from '../../utils/domainUtils'
import { useStageContent } from '../../hooks/useStageContent'
import { useLearnStore } from '../../store/learnStore'
import { contentCache } from '../../services/contentCache'
import { tracker } from '../../services/activityTracker'
import { getCert } from '../../data/certifications'
import type { Stage1Summary, Stage2Topic, Stage4Question } from '../../types/content'
import Stage1SummaryComponent from './Stage1Summary'
import Stage2Concepts from './Stage2Concepts'
import Stage4Quiz from './Stage4Quiz'
import { AppShell } from '../Layout/AppShell'
import { CertSidebar } from '../Layout/CertSidebar'
import TopNav from '../Nav/TopNav'

function Skeleton({ lines = 4 }: { lines?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} style={{
          height: 48, borderRadius: 'var(--r)',
          background: 'var(--bg-raised)',
          opacity: 1 - i * 0.15,
          animation: 'pulse 1.5s ease-in-out infinite',
        }} />
      ))}
    </div>
  )
}

function ErrorRetry({ message, onRetry }: { message: string; onRetry: () => void }) {
  const isRateLimit = message.includes('rate') || message.includes('429')
  const hint = isRateLimit ? 'Groq API is rate limited — wait a few seconds then retry.' : null

  return (
    <div style={{
      background: 'var(--error-dim)', border: '1px solid var(--error)',
      borderRadius: 'var(--r)', padding: '0.75rem 1rem',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
    }}>
      <div>
        <p style={{ color: 'var(--error)', fontSize: 13, fontWeight: 600, marginBottom: 2 }}>Failed to load</p>
        <p style={{ color: 'var(--text-2)', fontSize: 12 }}>{hint ?? message}</p>
      </div>
      <button className="btn btn-secondary" style={{ fontSize: 12, padding: '4px 12px', flexShrink: 0 }} onClick={onRetry}>
        Retry
      </button>
    </div>
  )
}

function RegeneratePanel({ certId, domain, onCancel }: { certId: string; domain: string; onCancel: () => void }) {
  const generatedDate = contentCache.getGeneratedDate(certId, domain)
  return (
    <div className="card" style={{ padding: '1rem 1.25rem', border: '1px solid var(--border)' }}>
      <p style={{ fontSize: 14, marginBottom: 4 }}>
        Regenerate content for <strong style={{ color: 'var(--accent)' }}>{domain}</strong>?
        {generatedDate && <span style={{ color: 'var(--text-3)' }}> Current content from {generatedDate} will be replaced.</span>}
      </p>
      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        <button className="btn btn-ghost" style={{ fontSize: 13 }} onClick={onCancel}>Cancel</button>
        <button
          className="btn btn-secondary"
          style={{ fontSize: 13 }}
          onClick={() => { contentCache.clearDomain(certId, domain); window.location.reload() }}
        >
          Yes, regenerate
        </button>
      </div>
    </div>
  )
}

interface Props {
  certId: string
}

export default function DomainPage({ certId }: Props) {
  const { domainSlug } = useParams<{ domainSlug: string }>()
  const domain = fromDomainSlug(domainSlug ?? '')
  const navigate = useNavigate()
  const topicRefs = useRef<Record<string, HTMLDivElement | null>>({})
  useLearnStore()

  const cert = getCert(certId)
  const certDomain = cert?.domains.find(d => d.name === domain)

  const [autoExpandTopic,  setAutoExpandTopic]  = useState<string | null>(null)
  const [jumpedBannerTopic, setJumpedBannerTopic] = useState<string | null>(null)
  const [showRegenPanel,   setShowRegenPanel]   = useState(false)

  useEffect(() => {
    document.getElementById('main-scroll')?.scrollTo({ top: 0 })
  }, [])

  useEffect(() => {
    const sidebarNav = sessionStorage.getItem('certpath_sidebar_expand_topic')
    if (sidebarNav) {
      try {
        const { topic } = JSON.parse(sidebarNav) as { topic: string }
        sessionStorage.removeItem('certpath_sidebar_expand_topic')
        setTimeout(() => setAutoExpandTopic(topic), 0)
      } catch { /* ignore */ }
    }
    const examNav = sessionStorage.getItem('certpath_navigate_to_topic')
    if (examNav) {
      try {
        const { sourceTopic } = JSON.parse(examNav) as { sourceTopic: string }
        sessionStorage.removeItem('certpath_navigate_to_topic')
        setTimeout(() => { setAutoExpandTopic(sourceTopic); setJumpedBannerTopic(sourceTopic) }, 0)
      } catch { /* ignore */ }
    }
    const legacyNav = sessionStorage.getItem('ccxp_navigate_to_topic')
    if (legacyNav) {
      try {
        const { sourceTopic } = JSON.parse(legacyNav) as { sourceTopic: string }
        sessionStorage.removeItem('ccxp_navigate_to_topic')
        setTimeout(() => { setAutoExpandTopic(sourceTopic); setJumpedBannerTopic(sourceTopic) }, 0)
      } catch { /* ignore */ }
    }
  }, [])

  useEffect(() => {
    if (domain && !certDomain) navigate(`/${certId}/learn`, { replace: true })
  }, [domain, certDomain, navigate, certId])

  const generatedDate = contentCache.getGeneratedDate(certId, domain)
  const topics = certDomain?.topics ?? []

  const s1 = useStageContent<Stage1Summary>(certId, domain, 'stage1-summary')
  const s2 = useStageContent<Stage2Topic[]>(certId, domain, 'stage2-concepts', { topics })
  const s4 = useStageContent<Stage4Question[]>(certId, domain, 'stage4-quiz')

  useEffect(() => {
    if (domain && certDomain) { s1.load(); tracker.domainStudied(certId, domain) }
  }, [domain]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (s1.data && !s2.data && !s2.loading) s2.load()
  }, [s1.data]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (s2.data && !s4.data && !s4.loading) s4.load()
  }, [s2.data]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleTopicExpand(topic: string) {
    setTimeout(() => {
      const scrollContainer = document.getElementById('main-scroll')
      if (!scrollContainer) return
      const slug = toTopicSlug(topic)
      const el = document.getElementById(`topic-${slug}`)
      if (el) {
        const elRect = el.getBoundingClientRect()
        const containerRect = scrollContainer.getBoundingClientRect()
        const scrollTarget = scrollContainer.scrollTop + (elRect.top - containerRect.top) - 16
        scrollContainer.scrollTo({ top: scrollTarget, behavior: 'smooth' })
      } else {
        const keyConcepts = document.getElementById('key-concepts')
        if (keyConcepts) {
          const elRect = keyConcepts.getBoundingClientRect()
          const containerRect = scrollContainer.getBoundingClientRect()
          const scrollTarget = scrollContainer.scrollTop + (elRect.top - containerRect.top) - 16
          scrollContainer.scrollTo({ top: scrollTarget, behavior: 'smooth' })
        }
      }
    }, 350)
  }

  useEffect(() => {
    if (!autoExpandTopic || !s2.data) return
    setTimeout(() => { handleTopicExpand(autoExpandTopic); setAutoExpandTopic(null) }, 300)
  }, [autoExpandTopic, s2.data])

  useEffect(() => {
    const handler = (e: CustomEvent) => {
      setAutoExpandTopic(e.detail.topic)
    }
    window.addEventListener('expand-topic', handler as EventListener)
    return () => window.removeEventListener('expand-topic', handler as EventListener)
  }, [])

  if (!domain || !certDomain) return null

  const domainIdx = cert?.domains.findIndex(d => d.name === domain) ?? 0

  return (
    <>
      <TopNav />
      <AppShell sidebar={<CertSidebar />}>
        <div style={{ maxWidth: 720 }}>

          {/* Breadcrumb */}
          <button
            onClick={() => navigate(`/${certId}/learn`)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-3)', fontSize: 12, fontWeight: 600,
              letterSpacing: '0.06em', textTransform: 'uppercase',
              marginBottom: '1.5rem', padding: 0,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>arrow_back</span>
            {cert?.name} Study Guide
          </button>

          {/* Header */}
          <div style={{
            paddingLeft: 16,
            borderLeft: `4px solid ${cert?.color ?? 'var(--accent)'}`,
            background: `${cert?.color ?? 'var(--accent)'}0a`,
            borderRadius: '0 8px 8px 0',
            padding: '12px 0 12px 16px',
            marginBottom: '1.5rem',
          }}>
            <p className="label" style={{ marginBottom: 6, color: cert?.color ?? 'var(--accent)' }}>
              MODULE {String(domainIdx + 1).padStart(2, '0')} · {certDomain.percentage}% OF EXAM
            </p>
            <h1 style={{ fontSize: '1.875rem', marginBottom: 8 }}>{domain}</h1>
            <p style={{ color: 'var(--text-2)', fontSize: 14, marginBottom: '0.5rem' }}>
              {certDomain.topics.length} topics · {certDomain.weight} questions
              {generatedDate && <span style={{ color: 'var(--text-3)' }}> · Generated {generatedDate}</span>}
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10, marginBottom: '2rem', flexWrap: 'wrap' }}>
            <button
              className="btn btn-secondary"
              style={{ fontSize: 12, padding: '5px 14px' }}
              onClick={() => navigate(`/${certId}/exam?domain=${encodeURIComponent(domain)}`)}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>edit_note</span>
              Domain Drill
            </button>
            <button
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', fontSize: 12 }}
              onClick={() => setShowRegenPanel(p => !p)}
            >
              ↺ Regenerate
            </button>
          </div>

          {showRegenPanel && (
            <div style={{ marginBottom: '1.5rem' }}>
              <RegeneratePanel certId={certId} domain={domain} onCancel={() => setShowRegenPanel(false)} />
            </div>
          )}

          {jumpedBannerTopic && (
            <div className="ai-insight" style={{ marginBottom: '1.5rem', alignItems: 'center' }}>
              <span style={{ fontSize: 16 }}>📍</span>
              <p style={{ fontSize: 14, color: 'var(--text-2)', flex: 1 }}>
                Jumped here from exam — <strong style={{ color: 'var(--accent)' }}>"{jumpedBannerTopic}"</strong> is expanded below
              </p>
              <button
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', fontSize: 16 }}
                onClick={() => setJumpedBannerTopic(null)}
              >
                ✕
              </button>
            </div>
          )}

          {/* Stage 1 */}
          <section id="snapshot" style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Domain Snapshot</h2>
            {s1.loading && <Skeleton lines={5} />}
            {s1.error && <ErrorRetry message={s1.error} onRetry={s1.load} />}
            {s1.data && <Stage1SummaryComponent data={s1.data} />}
          </section>

          {/* Stage 2 */}
          {(s1.data || s1.loading) && (
            <section id="key-concepts" style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Key Concepts</h2>
              {s2.loading && <Skeleton lines={6} />}
              {s2.error && <ErrorRetry message={s2.error} onRetry={s2.load} />}
              {!s2.loading && !s2.error && !s2.data && s1.data && (
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '1rem 1.25rem', borderRadius: 'var(--r)',
                  background: 'var(--bg-raised)', border: '1px solid var(--border)',
                  fontSize: 14, color: 'var(--text-2)',
                }}>
                  <span>Concepts not yet generated</span>
                  <button
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)', fontWeight: 600, fontSize: 13 }}
                    onClick={s2.load}
                  >
                    Generate →
                  </button>
                </div>
              )}
              {s2.data && s2.data.length > 0 && (
                <Stage2Concepts
                  domain={domain}
                  topics={s2.data}
                  autoExpandTopic={autoExpandTopic}
                  topicRefs={topicRefs}
                />
              )}
            </section>
          )}

          {/* Stage 4 */}
          {s2.data && (
            <section id="quiz" style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Quick Quiz</h2>
              {s4.loading && <Skeleton lines={4} />}
              {s4.error && <ErrorRetry message={s4.error} onRetry={s4.load} />}
              {s4.data && Array.isArray(s4.data) && s4.data.length > 0 && (
                <Stage4Quiz questions={s4.data as Stage4Question[]} domain={domain} />
              )}
              {!s4.loading && !s4.error && (!s4.data || (s4.data as Stage4Question[]).length === 0) && (
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '1rem 1.25rem', borderRadius: 'var(--r)',
                  background: 'var(--bg-raised)', border: '1px solid var(--border)',
                  fontSize: 14, color: 'var(--text-2)',
                }}>
                  <span>Quiz not yet generated</span>
                  <button
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)', fontWeight: 600, fontSize: 13 }}
                    onClick={s4.load}
                  >
                    Generate →
                  </button>
                </div>
              )}
            </section>
          )}
        </div>
      </AppShell>
    </>
  )
}
