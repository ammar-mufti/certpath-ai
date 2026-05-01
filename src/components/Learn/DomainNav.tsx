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

  // Derive active domain from URL
  const activeDomainFromUrl = domains.find(d => toDomainSlug(d.name) === params.domainSlug)?.name ?? _activeDomain
  const activeDomain = activeDomainFromUrl

  const overallProgress = domains.length > 0
    ? Math.round(domains.reduce((sum, d) => sum + getDomainProgress(certId, d.name), 0) / domains.length)
    : 0

  function handleTopicClick(domainName: string, topic: string) {
    const targetPath = `/${certId}/learn/${toDomainSlug(domainName)}`
    const currentPath = location.pathname

    if (currentPath === targetPath || currentPath.startsWith(targetPath)) {
      window.dispatchEvent(new CustomEvent('expand-topic', { detail: { topic } }))
    } else {
      sessionStorage.setItem('certpath_sidebar_expand_topic', JSON.stringify({ topic, domain: domainName }))
      navigate(targetPath)
    }
  }

  return (
    <div className="w-full flex flex-col py-4 px-3 gap-1">
      <button
        onClick={() => navigate(`/${certId}/learn`)}
        className={`text-left px-3 py-2 rounded-lg text-sm font-semibold mb-2 transition-colors ${
          !activeDomain ? 'bg-gold/20 text-gold' : 'text-mist hover:text-cream hover:bg-white/5'
        }`}
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
              className={`w-full text-left px-3 py-2.5 rounded-lg transition-all group ${
                isActive
                  ? 'bg-white/10 border border-white/20'
                  : 'hover:bg-white/5 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <div
                    className="text-xs font-semibold truncate leading-snug"
                    style={{ color: isActive ? color : undefined }}
                  >
                    <span className={isActive ? '' : 'text-cream group-hover:text-gold transition-colors'}>
                      {domain.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] text-mist/60">{domain.percentage}%</span>
                    <span className="text-[10px]">{statusDot}</span>
                    <span className="text-[10px] text-mist/60">{prog}%</span>
                  </div>
                </div>
              </div>

              <div className="mt-1.5 h-0.5 bg-white/10 rounded-full">
                <div className="h-0.5 rounded-full transition-all" style={{ width: `${prog}%`, backgroundColor: color }} />
              </div>
            </button>

            {isActive && topics.length > 0 && (
              <div className="ml-4 mt-1 mb-2 space-y-0.5 border-l border-white/10 pl-3">
                {topics.map(topic => {
                  const isRead = topicsRead.includes(topic)
                  return (
                    <button
                      key={topic}
                      onClick={() => handleTopicClick(domain.name, topic)}
                      className="w-full text-left text-xs py-1 text-mist hover:text-cream transition-colors flex items-center gap-1.5 group"
                    >
                      {isRead
                        ? <span className="text-pass text-[10px] flex-shrink-0">✓</span>
                        : <span className="w-1.5 h-1.5 rounded-full bg-white/20 flex-shrink-0 group-hover:bg-gold/60 transition-colors" />
                      }
                      <span className={`truncate ${isRead ? 'text-mist/60 line-through decoration-mist/40' : ''}`}>
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

      <div className="mt-auto pt-4 px-3 border-t border-white/10">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-mist">Overall Readiness</span>
          <span className="text-xs font-bold text-gold">{overallProgress}%</span>
        </div>
        <div className="h-1.5 bg-white/10 rounded-full">
          <div className="h-1.5 rounded-full bg-gold transition-all" style={{ width: `${overallProgress}%` }} />
        </div>
        <button
          onClick={() => navigate(`/${certId}/exam`)}
          className="mt-3 w-full py-2 rounded-lg bg-gold text-navy text-xs font-bold hover:bg-amber-400 transition-colors"
        >
          Take Practice Exam →
        </button>
      </div>
    </div>
  )
}
