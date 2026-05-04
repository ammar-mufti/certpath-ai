import { useNavigate, useLocation, useParams } from 'react-router-dom'
import { getCert } from '../../data/certifications'
import { useLearnStore } from '../../store/learnStore'
import { toDomainSlug } from '../../utils/domainUtils'

export function CertSidebar() {
  const { certId } = useParams<{ certId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const cert = getCert(certId ?? '')
  const { getDomainProgress, getReadTopics } = useLearnStore()

  const isLearn    = location.pathname.includes('/learn')
  const isExam     = location.pathname.includes('/exam') || location.pathname.includes('/results')
  const isHistory  = location.pathname.includes('/history')
  const domainSlug = location.pathname.split('/learn/')[1]?.split('/')[0] ?? ''

  const navItems = [
    { label: 'Study Guide', icon: 'menu_book',  path: `/${certId}/learn`,   active: isLearn && !domainSlug },
    { label: 'Practice Exam', icon: 'edit_note', path: `/${certId}/exam`,    active: isExam },
    { label: 'History',      icon: 'history',   path: `/${certId}/history`,  active: isHistory },
  ]

  return (
    <>
      {/* Cert header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '0.25rem 0.25rem 0.875rem',
        borderBottom: '1px solid var(--border)',
        marginBottom: '0.5rem',
        flexShrink: 0,
      }}>
        <div style={{
          width: 36, height: 36,
          background: 'var(--accent-dim)',
          borderRadius: 8,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, flexShrink: 0,
        }}>
          {cert?.icon}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {cert?.name}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {cert?.issuer}
          </div>
        </div>
      </div>

      {/* Nav items */}
      {navItems.map(item => (
        <button
          key={item.label}
          className={`sidebar-item${item.active ? ' active' : ''}`}
          onClick={() => navigate(item.path)}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 17 }}>{item.icon}</span>
          {item.label}
        </button>
      ))}

      {/* Domains section */}
      <div style={{
        marginTop: '1.25rem',
        paddingTop: '1rem',
        borderTop: '1px solid var(--border)',
        flex: 1,
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}>
        <div className="label" style={{ padding: '0 0.25rem', marginBottom: 6 }}>
          DOMAINS
        </div>
        {cert?.domains.map(d => {
          const progress  = getDomainProgress(certId ?? '', d.name)
          const slug      = toDomainSlug(d.name)
          const isActive  = domainSlug === slug
          const readTopics = getReadTopics(certId ?? '', d.name)

          return (
            <div key={d.name}>
              <button
                className={`sidebar-item${isActive ? ' active' : ''}`}
                style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 5, height: 'auto', padding: '0.5rem 0.875rem' }}
                onClick={() => navigate(`/${certId}/learn/${slug}`)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: isActive ? 'var(--accent)' : 'var(--text-2)', flexShrink: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {d.name}
                  </span>
                  <span style={{ fontSize: 10, color: 'var(--accent)', flexShrink: 0, marginLeft: 6 }}>
                    {d.percentage}%
                  </span>
                </div>
                <div className="progress-bar" style={{ width: '100%', height: 3 }}>
                  <div className="progress-fill" style={{ width: `${progress}%`, height: '100%' }} />
                </div>
              </button>

              {/* Topic list when domain is active */}
              {isActive && d.topics.length > 0 && (
                <div style={{
                  marginLeft: 12,
                  paddingLeft: 10,
                  borderLeft: '2px solid var(--accent-dim)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1,
                  marginBottom: 4,
                }}>
                  {d.topics.map(topic => {
                    const isRead = readTopics.includes(topic)
                    return (
                      <button
                        key={topic}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: 6,
                          padding: '3px 0',
                          fontSize: 11,
                          color: isRead ? 'var(--text-3)' : 'var(--text-2)',
                          textAlign: 'left',
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
                          color: isRead ? 'var(--success)' : 'var(--border)',
                          fontSize: 10,
                        }}>
                          {isRead ? '✓' : '○'}
                        </span>
                        <span style={{ textDecoration: isRead ? 'line-through' : 'none', opacity: isRead ? 0.6 : 1 }}>
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

      {/* Bottom CTA */}
      <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
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
