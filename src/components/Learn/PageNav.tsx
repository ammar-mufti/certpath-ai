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
    <div className="w-full py-5 px-4 flex flex-col gap-5">
      {/* On This Page */}
      <div>
        <p className="text-xs font-semibold text-mist/60 uppercase tracking-wider mb-3">On This Page</p>
        <div className="space-y-1">
          {sections.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => scrollTo(id)}
              className={`w-full text-left text-xs py-1.5 px-2 rounded-md transition-colors ${
                activeSection === id
                  ? 'text-gold bg-gold/10'
                  : 'text-mist hover:text-cream hover:bg-white/5'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Domain progress mini-card */}
      {activeDomain && (
        <div className="border-t border-white/10 pt-4">
          <p className="text-xs font-semibold text-mist/60 uppercase tracking-wider mb-3">This Domain</p>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-mist">Readiness</span>
              <span className="text-xs font-bold text-gold">{domainProgress}%</span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full">
              <div
                className="h-1.5 rounded-full bg-gold transition-all"
                style={{ width: `${domainProgress}%` }}
              />
            </div>
            <div className="flex justify-between items-center mt-1">
              <span className="text-xs text-mist">Topics read</span>
              <span className="text-xs text-cream">{topicsRead.length} / {topicCount}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
