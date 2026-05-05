import { useState } from 'react'
import { useNavigate, useLocation, useParams } from 'react-router-dom'
import { getCert } from '../../data/certifications'
import { useLearnStore } from '../../store/learnStore'
import { toDomainSlug } from '../../utils/domainUtils'

interface CertSidebarProps {
  onOpenTutor?: () => void
  activeTopic?: string | null
}

interface NavItemProps {
  icon: string
  label: string
  path?: string
  action?: () => void
  danger?: boolean
  active?: boolean
}

function NavItem({ icon, label, path, action, danger, active }: NavItemProps) {
  const navigate = useNavigate()
  return (
    <button
      onClick={() => action ? action() : path && navigate(path)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        width: '100%',
        padding: '8px 12px',
        borderRadius: 8,
        border: 'none',
        cursor: 'pointer',
        fontSize: 14,
        fontWeight: 500,
        textAlign: 'left',
        transition: 'all 0.15s',
        background: active ? 'var(--accent-dim)' : 'transparent',
        color: danger ? 'var(--error)' : active ? 'var(--accent)' : 'var(--text-2)',
      }}
      onMouseEnter={e => {
        if (!active) {
          e.currentTarget.style.background = 'var(--bg-raised)'
          e.currentTarget.style.color = 'var(--text)'
        }
      }}
      onMouseLeave={e => {
        if (!active) {
          e.currentTarget.style.background = 'transparent'
          e.currentTarget.style.color = danger ? 'var(--error)' : 'var(--text-2)'
        }
      }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: 18, flexShrink: 0 }}>
        {icon}
      </span>
      {label}
    </button>
  )
}

export function CertSidebar({ onOpenTutor, activeTopic }: CertSidebarProps) {
  const { certId } = useParams<{ certId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const cert = getCert(certId ?? '')
  const { getDomainProgress, getReadTopics } = useLearnStore()

  const isActive = (path: string) => location.pathname.startsWith(path)
  const domainSlug = location.pathname.split('/learn/')[1]?.split('/')[0] ?? ''

  const [collapsedDomains, setCollapsedDomains] = useState<Set<string>>(() => new Set())

  const expandedDomain = collapsedDomains.has(domainSlug) ? null : domainSlug

  function toggleDomain(slug: string) {
    setCollapsedDomains(prev => {
      const next = new Set(prev)
      if (next.has(slug)) next.delete(slug)
      else next.add(slug)
      return next
    })
  }

  return (
    <>
      {/* Cert header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '4px 4px 16px',
        borderBottom: '1px solid var(--border)',
        marginBottom: 8,
        flexShrink: 0,
      }}>
        <div style={{
          width: 38, height: 38,
          background: 'var(--accent-dim)',
          border: '1px solid var(--accent)',
          borderRadius: 8,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20, flexShrink: 0,
        }}>
          {cert?.icon}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{
            fontWeight: 700, fontSize: 14, color: 'var(--text)',
            fontFamily: 'Noto Serif, serif',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {cert?.name}
          </div>
          <div style={{
            fontSize: 11, color: 'var(--text-3)',
            textTransform: 'uppercase', letterSpacing: '0.05em',
          }}>
            {cert?.issuer}
          </div>
        </div>
      </div>

      {/* Main nav */}
      <NavItem icon="menu_book" label="Study Guide" path={`/${certId}/learn`} active={isActive(`/${certId}/learn`) && !domainSlug} />
      <NavItem icon="edit_note" label="Practice Exam" path={`/${certId}/exam`} active={isActive(`/${certId}/exam`) || isActive(`/${certId}/results`)} />
      <NavItem icon="smart_toy" label="AI Tutor" action={onOpenTutor} />
      <NavItem icon="history" label="History" path={`/${certId}/history`} active={isActive(`/${certId}/history`)} />

      {/* Domains section */}
      <div style={{
        marginTop: 20,
        paddingTop: 16,
        borderTop: '1px solid var(--border)',
        flex: 1,
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}>
        <div style={{
          fontSize: 11, fontWeight: 600, letterSpacing: '0.08em',
          textTransform: 'uppercase', color: 'var(--text-3)',
          padding: '0 12px', marginBottom: 8,
        }}>
          Domains
        </div>

        <div style={{
          overflowY: 'auto', flex: 1,
          display: 'flex', flexDirection: 'column', gap: 2,
        }}>
          {cert?.domains.map(d => {
            const progress = getDomainProgress(certId ?? '', d.name)
            const slug = toDomainSlug(d.name)
            const active = domainSlug === slug
            const expanded = expandedDomain === slug
            const readTopics = getReadTopics(certId ?? '', d.name)

            return (
              <div key={d.name}>
                <button
                  onClick={() => {
                    navigate(`/${certId}/learn/${slug}`)
                    toggleDomain(slug)
                  }}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    background: active ? 'var(--accent-dim)' : 'transparent',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => {
                    if (!active) e.currentTarget.style.background = 'var(--bg-raised)'
                  }}
                  onMouseLeave={e => {
                    if (!active) e.currentTarget.style.background = 'transparent'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{
                      fontSize: 12, fontWeight: 500,
                      color: active ? 'var(--accent)' : 'var(--text-2)',
                      overflow: 'hidden', textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap', maxWidth: 110,
                    }}>
                      {d.name}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                      <span style={{ fontSize: 11, color: 'var(--text-3)' }}>
                        {d.percentage}%
                      </span>
                      <span className="material-symbols-outlined" style={{
                        fontSize: 16,
                        color: 'var(--text-3)',
                        transform: expanded ? 'rotate(90deg)' : 'rotate(0)',
                        transition: 'transform 0.2s',
                      }}>
                        chevron_right
                      </span>
                    </div>
                  </div>
                  <div style={{
                    height: 3, background: 'var(--border)',
                    borderRadius: 99, overflow: 'hidden',
                  }}>
                    <div style={{
                      height: '100%', width: `${progress}%`,
                      background: 'var(--accent)', borderRadius: 99,
                      transition: 'width 0.5s ease',
                      boxShadow: progress > 0 ? '0 0 6px var(--accent)' : 'none',
                    }} />
                  </div>
                </button>

                {/* Topic list when domain is expanded */}
                {expanded && d.topics.length > 0 && (
                  <div style={{
                    marginLeft: 12, paddingLeft: 10,
                    borderLeft: '2px solid var(--accent-dim)',
                    display: 'flex', flexDirection: 'column', gap: 1,
                    marginBottom: 4,
                  }}>
                    {d.topics.map(topic => {
                      const isRead = readTopics.includes(topic)
                      const isActiveTopic = activeTopic === topic
                      return (
                        <button
                          key={topic}
                          style={{
                            background: isActiveTopic ? 'var(--accent-dim)' : 'none',
                            border: 'none',
                            borderLeft: isActiveTopic ? '2px solid var(--accent)' : '2px solid transparent',
                            cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '3px 0 3px 4px', fontSize: 11,
                            color: isActiveTopic ? 'var(--accent)' : isRead ? 'var(--text-3)' : 'var(--text-2)',
                            fontWeight: isActiveTopic ? 600 : 400,
                            textAlign: 'left',
                            borderRadius: '0 4px 4px 0',
                            transition: 'all 0.15s',
                          }}
                          onClick={() => {
                            const targetPath = `/${certId}/learn/${slug}`
                            if (location.pathname === targetPath || location.pathname.startsWith(targetPath + '/')) {
                              window.dispatchEvent(new CustomEvent('expand-topic', { detail: { topic } }))
                            } else {
                              sessionStorage.setItem('certpath_sidebar_expand_topic', JSON.stringify({ topic, domain: d.name }))
                              navigate(targetPath)
                            }
                          }}
                        >
                          <span style={{
                            width: 14, flexShrink: 0, textAlign: 'center',
                            color: isActiveTopic ? 'var(--accent)' : isRead ? 'var(--success)' : 'var(--border)', fontSize: 10,
                          }}>
                            {isActiveTopic ? '●' : isRead ? '✓' : '○'}
                          </span>
                          <span style={{ textDecoration: isRead && !isActiveTopic ? 'line-through' : 'none', opacity: isRead && !isActiveTopic ? 0.6 : 1 }}>
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
        </div>
      </div>

      {/* Bottom CTA */}
      <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1px solid var(--border)', flexShrink: 0 }}>
        <button
          className="btn btn-primary"
          style={{ width: '100%', fontSize: 13 }}
          onClick={() => navigate(`/${certId}/exam`)}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit_note</span>
          Take Practice Exam
        </button>
        <button
          className="sidebar-item"
          style={{ marginTop: 4, fontSize: 12 }}
          onClick={() => navigate('/dashboard')}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 15 }}>grid_view</span>
          All Certifications
        </button>
      </div>
    </>
  )
}
