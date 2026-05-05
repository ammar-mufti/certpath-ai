import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import type { Stage2Topic } from '../../types/content'
import { useLearnStore } from '../../store/learnStore'
import { useStageContent } from '../../hooks/useStageContent'
import { toTopicSlug } from '../../utils/domainUtils'
import { stripMarker } from '../../utils/stripMarker'
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
  index: number
}

function TopicCard({ certId, domain, topic, autoExpand, onRef, index }: TopicCardProps) {
  const { getReadTopics, markTopicRead } = useLearnStore()
  const [userToggled, setUserToggled] = useState<boolean | null>(null)
  const [showDeepDive, setShowDeepDive] = useState(false)
  const readTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const topicsRead = getReadTopics(certId, domain)
  const isRead = topicsRead.includes(topic.topic)
  const expanded = userToggled ?? autoExpand

  const { data: deepDive, loading: deepLoading, error: deepError, load: deepLoad } =
    useStageContent<Stage3DeepDive>(certId, domain, 'stage3-deepdive', {
      topic: topic.topic,
    })

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
      style={{ marginBottom: 12, scrollMarginTop: '80px' }}
    >
      {/* Topic header button */}
      <button
        type="button"
        onClick={() => setUserToggled(!expanded)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1rem 1.25rem',
          background: expanded ? 'var(--bg-raised)' : 'var(--bg-card)',
          border: `1px solid ${expanded ? 'var(--accent)' : 'var(--border)'}`,
          borderRadius: expanded ? '12px 12px 0 0' : 12,
          cursor: 'pointer',
          textAlign: 'left',
          transition: 'all 0.2s',
          boxShadow: expanded ? '0 0 20px rgba(242,202,80,0.08)' : 'var(--shadow)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {/* Status icon */}
          <div style={{
            width: 40, height: 40, flexShrink: 0,
            background: isRead ? 'var(--accent-dim)' : expanded ? 'var(--bg-sunken)' : 'var(--bg-raised)',
            border: `1px solid ${isRead ? 'var(--accent)' : 'var(--border)'}`,
            borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: isRead ? 'var(--accent)' : expanded ? 'var(--accent)' : 'var(--text-3)',
          }}>
            <span className="material-symbols-outlined" style={{
              fontSize: 20,
              fontVariationSettings: isRead ? "'FILL' 1" : "'FILL' 0",
            }}>
              {isRead ? 'check_circle' : expanded ? 'play_circle' : 'radio_button_unchecked'}
            </span>
          </div>

          <div>
            <div style={{
              fontSize: 11, fontWeight: 600, letterSpacing: '0.06em',
              textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 2,
            }}>
              Topic {String(index + 1).padStart(2, '0')}
            </div>
            <div style={{
              fontFamily: 'Noto Serif, serif', fontSize: '1rem', fontWeight: 600,
              color: expanded ? 'var(--accent)' : 'var(--text)',
              transition: 'color 0.15s',
            }}>
              {topic.topic}
            </div>
          </div>
        </div>

        <span className="material-symbols-outlined" style={{
          color: expanded ? 'var(--accent)' : 'var(--text-3)',
          transform: expanded ? 'rotate(180deg)' : 'rotate(0)',
          transition: 'transform 0.2s, color 0.15s',
          fontSize: 20, flexShrink: 0,
        }}>
          expand_more
        </span>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--accent)',
          borderTop: 'none',
          borderRadius: '0 0 12px 12px',
          padding: '1.25rem',
        }}>
          <p style={{
            fontSize: 14, color: 'var(--text-2)', lineHeight: 1.7, marginBottom: '1rem',
          }}>
            {topic.summary}
          </p>

          <ul style={{
            listStyle: 'none', display: 'flex', flexDirection: 'column',
            gap: 8, marginBottom: '1rem',
          }}>
            {topic.bullets.map((b, i) => (
              <li key={i} style={{
                display: 'flex', gap: 10, fontSize: 13,
                color: 'var(--text-2)', lineHeight: 1.6,
              }}>
                <span style={{ color: 'var(--accent)', flexShrink: 0, marginTop: 3, fontSize: 10 }}>●</span>
                <span>{stripMarker(b)}</span>
              </li>
            ))}
          </ul>

          {/* Exam Tip */}
          <div style={{
            display: 'flex', gap: 10,
            padding: '10px 14px',
            background: 'var(--error-dim)',
            border: '1px solid var(--error)',
            borderLeft: '3px solid var(--error)',
            borderRadius: 8, marginBottom: '1rem',
          }}>
            <span className="material-symbols-outlined" style={{
              color: 'var(--error)', fontSize: 16, flexShrink: 0, marginTop: 1,
            }}>
              warning
            </span>
            <div>
              <div style={{
                fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
                textTransform: 'uppercase', color: 'var(--error)', marginBottom: 4,
              }}>
                Exam Tip
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-2)' }}>{topic.examTip}</p>
            </div>
          </div>

          {/* Key Terms */}
          {topic.keyTerms && topic.keyTerms.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <div style={{
                fontSize: 11, fontWeight: 600, letterSpacing: '0.06em',
                textTransform: 'uppercase', color: 'var(--text-3)',
                marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>bookmark</span>
                Key Terms
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {topic.keyTerms.map((kt, i) => (
                  <div
                    key={i}
                    title={kt.definition}
                    className="group relative"
                    style={{
                      padding: '4px 12px',
                      background: 'var(--bg-raised)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--r-full)',
                      fontSize: 12, color: 'var(--text-2)',
                      cursor: 'help',
                    }}
                  >
                    {kt.term}
                    <div className="absolute bottom-full left-0 mb-1 z-10 hidden group-hover:block w-64 bg-card border border-var(--border) rounded-lg px-3 py-2 text-xs shadow-xl" style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border)',
                    }}>
                      <span style={{ fontWeight: 600, color: 'var(--accent)' }}>{kt.term}: </span>
                      <span style={{ color: 'var(--text-2)' }}>{kt.definition}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div style={{
            display: 'flex', gap: 8,
            paddingTop: '0.75rem', borderTop: '1px solid var(--border)',
          }}>
            {!showDeepDive && (
              <button
                onClick={handleGoDeeper}
                className="btn btn-secondary"
                style={{ fontSize: 12, flex: 1 }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 15 }}>expand_circle_down</span>
                Go Deeper
              </button>
            )}
          </div>

          {showDeepDive && (
            <div style={{ marginTop: '1rem' }}>
              {deepLoading && (
                <div style={{
                  borderRadius: 12, border: '1px solid var(--accent-dim)',
                  background: 'var(--accent-dim)', padding: '1rem',
                  animation: 'pulse 1.5s ease-in-out infinite',
                }}>
                  <div style={{ height: 12, background: 'var(--bg-raised)', borderRadius: 6, width: '33%', marginBottom: 12 }} />
                  <div style={{ height: 8, background: 'var(--bg-raised)', borderRadius: 6, width: '100%', marginBottom: 8 }} />
                  <div style={{ height: 8, background: 'var(--bg-raised)', borderRadius: 6, width: '83%' }} />
                </div>
              )}
              {deepError && (
                <div style={{
                  background: 'var(--error-dim)', border: '1px solid var(--error)',
                  borderRadius: 8, padding: '0.75rem 1rem',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <p style={{ color: 'var(--error)', fontSize: 13, fontWeight: 600 }}>Failed to load deep dive</p>
                    <button onClick={deepLoad} className="btn btn-secondary" style={{ fontSize: 12, flexShrink: 0 }}>Retry</button>
                  </div>
                  <p style={{ color: 'var(--text-2)', fontSize: 12, marginTop: 8 }}>
                    {deepError.includes('rate') || deepError.includes('429')
                      ? 'Groq API is rate limited — wait a few seconds then retry.'
                      : deepError}
                  </p>
                </div>
              )}
              {deepDive && !deepLoading && (
                <Stage3DeepDiveComponent data={deepDive} topic={topic.topic} domain={domain} />
              )}
            </div>
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {topics.map((topic, i) => (
        <TopicCard
          key={topic.topic}
          certId={resolvedCertId}
          domain={domain}
          topic={topic}
          autoExpand={autoExpandTopic === topic.topic}
          onRef={el => { topicRefs.current[topic.topic] = el }}
          index={i}
        />
      ))}
    </div>
  )
}
