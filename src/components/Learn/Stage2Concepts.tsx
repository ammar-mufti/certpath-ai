import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import type { Stage2Topic } from '../../types/content'
import { useLearnStore } from '../../store/learnStore'
import { useStageContent } from '../../hooks/useStageContent'
import { toTopicSlug } from '../../utils/domainUtils'
import type { Stage3DeepDive } from '../../types/content'
import Stage3DeepDiveComponent from './Stage3DeepDive'

interface Props {
  domain: string
  topics: Stage2Topic[]
  autoExpandTopic: string | null
  topicRefs: React.MutableRefObject<Record<string, HTMLDivElement | null>>
}

interface TopicCardProps {
  certId: string
  domain: string
  topic: Stage2Topic
  autoExpand: boolean
  onRef: (el: HTMLDivElement | null) => void
}

function TopicCard({ certId, domain, topic, autoExpand, onRef }: TopicCardProps) {
  const { getReadTopics, markTopicRead } = useLearnStore()
  const [expanded, setExpanded] = useState(autoExpand)
  const [showDeepDive, setShowDeepDive] = useState(false)
  const readTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const topicsRead = getReadTopics(certId, domain)
  const isRead = topicsRead.includes(topic.topic)

  const { data: deepDive, loading: deepLoading, error: deepError, load: deepLoad } =
    useStageContent<Stage3DeepDive>(certId, domain, 'stage3-deepdive', {
      topic: topic.topic,
    })

  useEffect(() => {
    if (autoExpand) setExpanded(true)
  }, [autoExpand])

  useEffect(() => {
    if (expanded && !isRead) {
      readTimerRef.current = setTimeout(() => {
        markTopicRead(certId, domain, topic.topic)
      }, 20000)
    }
    return () => {
      if (readTimerRef.current) clearTimeout(readTimerRef.current)
    }
  }, [expanded, isRead, certId, domain, topic.topic, markTopicRead])

  function handleGoDeeper() {
    setShowDeepDive(true)
    markTopicRead(certId, domain, topic.topic)
    if (!deepDive && !deepLoading) deepLoad()
  }

  const topicSlug = toTopicSlug(topic.topic)

  return (
    <div
      id={`topic-${topicSlug}`}
      ref={onRef}
      className="bg-ink rounded-xl border border-white/10 overflow-hidden transition-all"
    >
      <button
        className="w-full text-left p-4 flex items-center gap-3"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-cream font-medium text-sm">{topic.topic}</span>
            {isRead && <span className="text-pass text-xs">✓</span>}
          </div>
          {!expanded && (
            <p className="text-mist text-xs mt-0.5 truncate">{topic.summary}</p>
          )}
        </div>
        <span className="text-mist text-xs flex-shrink-0">{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-4">
          <p className="text-mist text-sm leading-relaxed">{topic.summary}</p>

          <ul className="space-y-1.5">
            {topic.bullets.map((b, i) => (
              <li key={i} className="flex gap-2 text-sm text-mist leading-relaxed">
                <span className="text-gold flex-shrink-0 mt-0.5">•</span>
                <span>{b}</span>
              </li>
            ))}
          </ul>

          <div className="bg-warn/10 border border-warn/20 rounded-lg px-3 py-2">
            <span className="text-warn text-xs font-bold">⚠️ Exam Tip: </span>
            <span className="text-cream text-xs">{topic.examTip}</span>
          </div>

          {topic.keyTerms && topic.keyTerms.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-mist mb-2">📖 Key Terms</div>
              <div className="flex flex-wrap gap-1.5">
                {topic.keyTerms.map((kt, i) => (
                  <div key={i} className="group relative">
                    <span className="text-xs px-2 py-1 rounded-md bg-white/10 text-mist cursor-default hover:bg-white/20 transition-colors">
                      {kt.term}
                    </span>
                    <div className="absolute bottom-full left-0 mb-1 z-10 hidden group-hover:block w-64 bg-navy border border-white/20 rounded-lg px-3 py-2 text-xs text-cream shadow-xl">
                      <span className="font-semibold text-gold">{kt.term}: </span>{kt.definition}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!showDeepDive && (
            <button
              onClick={handleGoDeeper}
              className="text-sm text-gold border border-gold/40 rounded-lg px-4 py-1.5 hover:bg-gold/10 transition-colors"
            >
              🔍 Go Deeper →
            </button>
          )}

          {showDeepDive && (
            <>
              {deepLoading && (
                <div className="mt-4 rounded-xl border border-gold/20 bg-gold/5 p-4 animate-pulse">
                  <div className="h-3 bg-white/10 rounded w-1/3 mb-3" />
                  <div className="space-y-2">
                    <div className="h-2 bg-white/10 rounded w-full" />
                    <div className="h-2 bg-white/10 rounded w-5/6" />
                  </div>
                </div>
              )}
              {deepError && (
                <div className="mt-4 bg-fail/10 border border-fail/30 rounded-xl px-4 py-3 space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-fail text-sm">⚠ Failed to load deep dive</p>
                    <button onClick={deepLoad} className="bg-gold text-navy font-bold px-3 py-1.5 rounded-lg text-xs flex-shrink-0 hover:bg-amber-400 transition-colors">↺ Retry</button>
                  </div>
                  <p className="text-mist text-xs">
                    {deepError.includes('rate') || deepError.includes('429')
                      ? 'Groq API is rate limited — wait a few seconds then retry.'
                      : deepError.includes('key') || deepError.includes('403')
                      ? 'API key issue — try refreshing the page.'
                      : deepError}
                  </p>
                </div>
              )}
              {deepDive && !deepLoading && (
                <Stage3DeepDiveComponent data={deepDive} topic={topic.topic} />
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default function Stage2Concepts({ domain, topics, autoExpandTopic, topicRefs }: Props) {
  const { certId } = useParams<{ certId?: string }>()
  const resolvedCertId = certId ?? 'ccxp'

  return (
    <div className="space-y-2">
      {topics.map(topic => (
        <TopicCard
          key={topic.topic}
          certId={resolvedCertId}
          domain={domain}
          topic={topic}
          autoExpand={autoExpandTopic === topic.topic}
          onRef={el => { topicRefs.current[topic.topic] = el }}
        />
      ))}
    </div>
  )
}
