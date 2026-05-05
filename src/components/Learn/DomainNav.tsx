import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useLocation, useParams } from 'react-router-dom'
import { useLearnStore } from '../../store/learnStore'
import { toDomainSlug } from '../../utils/domainUtils'
import { contentCache } from '../../services/contentCache'
import { getCert } from '../../data/certifications'

interface Props {
  activeDomain?: string
  certId: string
}

export default function DomainNav({ activeDomain: _activeDomain, certId }: Props) {
  const navigate = useNavigate()
  const location = useLocation()
  const params = useParams<{ domainSlug?: string }>()
  const { getDomainProgress, getReadTopics } = useLearnStore()

  const cert = getCert(certId)
  const domains = cert?.domains ?? []

  const activeDomainFromUrl = domains.find(d => toDomainSlug(d.name) === params.domainSlug)?.name ?? _activeDomain
  const activeDomain = activeDomainFromUrl

  const [activeTopic, setActiveTopic] = useState<string | null>(null)
  const topicRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const sidebarRef = useRef<HTMLDivElement | null>(null)

  const overallProgress = domains.length > 0
    ? Math.round(domains.reduce((sum, d) => sum + getDomainProgress(certId, d.name), 0) / domains.length)
    : 0

  const scrollToTopic = useCallback((topic: string) => {
    setActiveTopic(topic)
    setTimeout(() => {
      const el = topicRefs.current[topic]
      if (el && sidebarRef.current) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }
    }, 100)
  }, [])

  useEffect(() => {
    const handler = (e: CustomEvent) => {
      scrollToTopic(e.detail.topic)
    }
    window.addEventListener('expand-topic', handler as EventListener)
    return () => window.removeEventListener('expand-topic', handler as EventListener)
  }, [scrollToTopic])

  function handleTopicClick(domainName: string, topic: string) {
    const targetPath = `/${certId}/learn/${toDomainSlug(domainName)}`
    const currentPath = location.pathname

    if (currentPath === targetPath || currentPath.startsWith(targetPath)) {
      scrollToTopic(topic)
      window.dispatchEvent(new CustomEvent('expand-topic', { detail: { topic } }))
    } else {
      sessionStorage.setItem('certpath_sidebar_expand_topic', JSON.stringify({ topic, domain: domainName }))
      navigate(targetPath)
    }
  }

  return (
    <div ref={sidebarRef} style={{ width: '100%', display: 'flex', flexDirection: 'column', padding: '16px 12px', gap: 4 }}>
      <button
        onClick={() => navigate(`/${certId}/learn`)}
        style={{
          textAlign: 'left', padding: '8px 12px', borderRadius: 8, fontSize: 13, fontWeight: 600,
          marginBottom: 8, transition: 'all 0.15s',
          color: !activeDomain ? 'var(--accent)' : 'var(--text-2)',
          background: !activeDomain ? 'var(--accent-dim)' : 'transparent',
          border: 'none', cursor: 'pointer',
        }}
        onMouseEnter={e => { if (activeDomain) { e.currentTarget.style.background = 'var(--bg-raised)'; e.currentTarget.style.color = 'var(--text)' } }}
        onMouseLeave={e => { if (activeDomain) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-2)' } }}
      >
        ← {cert?.name ?? 'Study Guide'}
      </button>

      {domains.map(domain => {
        const color = cert?.color ?? '#4A9EDB'
        const prog = getDomainProgress(certId, domain.name)
        const cached = contentCache.hasContent(certId, domain.name)
        const isActive = activeDomain === domain.name
        const topicsRead = getReadTopics(certId, domain.name)
        const topics = domain.topics

        let statusDot = '⚫'
        if (cached && prog >= 80) statusDot = '🟢'
        else if (cached || prog > 0) statusDot = '🟡'

        return (
          <div key={domain.name}>
            <button
              onClick={() => navigate(`/${certId}/learn/${toDomainSlug(domain.name)}`)}
              style={{
                width: '100%', textAlign: 'left', padding: '10px 12px', borderRadius: 8,
                transition: 'all 0.15s',
                background: isActive ? 'var(--bg-raised)' : 'transparent',
                border: isActive ? '1px solid var(--border)' : '1px solid transparent',
                cursor: 'pointer',
              }}
              onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'var(--bg-raised)'; e.currentTarget.style.borderColor = 'var(--border)' } }}
              onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent' } }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.4, color: isActive ? color : 'var(--text)' }}
                  >
                    {domain.name}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                    <span style={{ fontSize: 10, color: 'var(--text-3)' }}>{domain.percentage}%</span>
                    <span style={{ fontSize: 10 }}>{statusDot}</span>
                    <span style={{ fontSize: 10, color: 'var(--text-3)' }}>{prog}%</span>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 6, height: 2, background: 'var(--border)', borderRadius: 'var(--r-full)' }}>
                <div style={{ height: 2, borderRadius: 'var(--r-full)', transition: 'all 0.15s', width: `${prog}%`, backgroundColor: color }} />
              </div>
            </button>

            {isActive && topics.length > 0 && (
              <div style={{ marginLeft: 16, marginTop: 4, marginBottom: 8, display: 'flex', flexDirection: 'column', gap: 2, borderLeft: '1px solid var(--border)', paddingLeft: 12 }}>
                {topics.map(topic => {
                  const isRead = topicsRead.includes(topic)
                  const isActiveTopic = activeTopic === topic
                  return (
                    <button
                      key={topic}
                      ref={el => { topicRefs.current[topic] = el }}
                      onClick={() => handleTopicClick(domain.name, topic)}
                      style={{
                        width: '100%', textAlign: 'left', fontSize: 12, padding: '4px 8px', borderRadius: 4,
                        color: isActiveTopic ? 'var(--accent)' : isRead ? 'var(--text-3)' : 'var(--text-2)',
                        transition: 'all 0.15s', border: 'none', cursor: 'pointer',
                        background: isActiveTopic ? 'var(--accent-dim)' : 'transparent',
                        display: 'flex', alignItems: 'center', gap: 6,
                        fontWeight: isActiveTopic ? 600 : 400,
                      }}
                      onMouseEnter={e => {
                        if (!isActiveTopic) { e.currentTarget.style.color = 'var(--text)'; e.currentTarget.style.background = 'var(--bg-raised)' }
                      }}
                      onMouseLeave={e => {
                        if (!isActiveTopic) { e.currentTarget.style.color = isRead ? 'var(--text-3)' : 'var(--text-2)'; e.currentTarget.style.background = 'transparent' }
                      }}
                    >
                      {isActiveTopic
                        ? <span style={{ color: 'var(--accent)', fontSize: 10, flexShrink: 0 }}>●</span>
                        : isRead
                          ? <span style={{ color: 'var(--success)', fontSize: 10, flexShrink: 0 }}>✓</span>
                          : <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--border)', flexShrink: 0 }} />
                      }
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textDecoration: isRead && !isActiveTopic ? 'line-through' : 'none' }}>
                        {topic}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}

      <div style={{ marginTop: 'auto', paddingTop: 16, paddingLeft: 12, paddingRight: 12, borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 12, color: 'var(--text-2)' }}>Overall Readiness</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)' }}>{overallProgress}%</span>
        </div>
        <div style={{ height: 6, background: 'var(--border)', borderRadius: 'var(--r-full)' }}>
          <div style={{ height: 6, borderRadius: 'var(--r-full)', background: 'var(--accent)', transition: 'all 0.15s', width: `${overallProgress}%` }} />
        </div>
        <button
          onClick={() => navigate(`/${certId}/exam`)}
          className="btn btn-primary"
          style={{ marginTop: 12, width: '100%', padding: '8px 16px', fontSize: 12 }}
        >
          Take Practice Exam →
        </button>
      </div>
    </div>
  )
}
