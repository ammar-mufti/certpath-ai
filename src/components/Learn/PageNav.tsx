import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useLearnStore } from '../../store/learnStore'
import { getCert } from '../../data/certifications'

interface Section {
  id: string
  label: string
}

interface Props {
  sections: Section[]
  activeDomain?: string
}

export default function PageNav({ sections, activeDomain }: Props) {
  const [activeSection, setActiveSection] = useState<string>(sections[0]?.id ?? '')
  const { certId: certIdParam } = useParams<{ certId?: string }>()
  const certId = certIdParam ?? 'ccxp'
  const { getDomainProgress, getReadTopics } = useLearnStore()

  useEffect(() => {
    const observers: IntersectionObserver[] = []
    const sectionEls: Array<{ id: string; el: Element }> = []

    sections.forEach(({ id }) => {
      const el = document.getElementById(id)
      if (!el) return
      sectionEls.push({ id, el })
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveSection(id)
        },
        { rootMargin: '-20% 0px -60% 0px', threshold: 0 }
      )
      obs.observe(el)
      observers.push(obs)
    })

    return () => observers.forEach(o => o.disconnect())
  }, [sections])

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const domainProgress = activeDomain ? getDomainProgress(certId, activeDomain) : 0
  const topicsRead = activeDomain ? getReadTopics(certId, activeDomain) : []
  const cert = getCert(certId)
  const topicCount = activeDomain
    ? (cert?.domains.find(d => d.name === activeDomain)?.topics.length ?? 0)
    : 0

  return (
    <div style={{ width: '100%', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <p className="label" style={{ marginBottom: 12 }}>On This Page</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {sections.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => scrollTo(id)}
              style={{
                width: '100%', textAlign: 'left', fontSize: 12, padding: '6px 8px', borderRadius: 6,
                transition: 'all 0.15s', border: 'none', cursor: 'pointer',
                color: activeSection === id ? 'var(--accent)' : 'var(--text-2)',
                background: activeSection === id ? 'var(--accent-dim)' : 'transparent',
              }}
              onMouseEnter={e => { if (activeSection !== id) { e.currentTarget.style.background = 'var(--bg-raised)'; e.currentTarget.style.color = 'var(--text)' } }}
              onMouseLeave={e => { if (activeSection !== id) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-2)' } }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {activeDomain && (
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
          <p className="label" style={{ marginBottom: 12 }}>This Domain</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: 'var(--text-2)' }}>Readiness</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)' }}>{domainProgress}%</span>
            </div>
            <div style={{ height: 6, background: 'var(--border)', borderRadius: 'var(--r-full)' }}>
              <div
                style={{ height: 6, borderRadius: 'var(--r-full)', background: 'var(--accent)', transition: 'width 0.5s', width: `${domainProgress}%` }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
              <span style={{ fontSize: 12, color: 'var(--text-2)' }}>Topics read</span>
              <span style={{ fontSize: 12, color: 'var(--text)' }}>{topicsRead.length} / {topicCount}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
