import { useState, useRef, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { getCert } from '../../data/certifications'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface TutorChatProps {
  isOpen: boolean
  onClose: () => void
  pageContext?: string
}

const STORAGE_KEY = 'ccxp_tutor_messages'

function loadMessages(): ChatMessage[] {
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? '[]')
  } catch {
    return []
  }
}

function saveMessages(messages: ChatMessage[]) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages))
}

const SUGGESTIONS = [
  'What are the key frameworks I need to know?',
  "What's the most common exam mistake?",
  'Quiz me on a topic',
  'Explain the exam structure',
  'What should I focus on today?',
]

export default function TutorChat({ isOpen, onClose, pageContext }: TutorChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(loadMessages)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const { certId } = useParams<{ certId: string }>()
  const cert = getCert(certId || '')
  const token = useAuthStore(s => s.token)

  useEffect(() => { saveMessages(messages) }, [messages])
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, loading])
  useEffect(() => { if (isOpen) setTimeout(() => inputRef.current?.focus(), 150) }, [isOpen])

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return
    const userMsg: ChatMessage = { role: 'user', content: text.trim() }
    const history = [...messages, userMsg]
    setMessages(history)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch(`${import.meta.env.VITE_WORKER_URL}/api/llm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: 'tutor-chat',
          messages: history.slice(-10),
          pageContext: pageContext || `Studying ${cert?.name}`,
        }),
      })
      const data = await res.json()
      const reply = data.response || data.data || 'Sorry, I could not generate a response.'
      setMessages(prev => [...prev, { role: 'assistant', content: reply }])
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Connection failed — please try again.',
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.3)',
          zIndex: 200,
          backdropFilter: 'blur(2px)',
        }}
      />

      {/* Panel */}
      <div style={{
        position: 'fixed',
        top: 56, right: 0, bottom: 0,
        width: 400, maxWidth: '100vw',
        background: 'var(--bg-card)',
        borderLeft: '1px solid var(--border)',
        boxShadow: 'var(--shadow-lg)',
        zIndex: 201,
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '1rem 1.25rem',
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-raised)',
          flexShrink: 0,
        }}>
          <div style={{
            width: 36, height: 36,
            background: 'var(--accent-dim)',
            border: '1px solid var(--accent)',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, flexShrink: 0,
          }}>
            🎓
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontWeight: 700, fontSize: 14, color: 'var(--text)',
              fontFamily: 'Noto Serif, serif',
            }}>
              {cert?.name} AI Tutor
            </div>
            <div style={{
              fontSize: 11, color: 'var(--text-3)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {pageContext || `Ask me anything about ${cert?.name}`}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            {messages.length > 0 && (
              <button
                onClick={() => setMessages([])}
                style={{
                  padding: '4px 10px', fontSize: 11, fontWeight: 600,
                  background: 'var(--bg-sunken)', border: '1px solid var(--border)',
                  borderRadius: 6, color: 'var(--text-3)', cursor: 'pointer',
                }}
              >
                Clear
              </button>
            )}
            <button
              onClick={onClose}
              style={{
                width: 28, height: 28,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: 6, border: '1px solid var(--border)',
                background: 'var(--bg-sunken)', color: 'var(--text-3)',
                cursor: 'pointer', fontSize: 16,
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Messages */}
        <div style={{
          flex: 1, overflowY: 'auto', padding: '1rem',
          display: 'flex', flexDirection: 'column', gap: 12,
        }}>
          {messages.length === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 8 }}>
              <div style={{
                fontSize: 11, fontWeight: 600, letterSpacing: '0.08em',
                textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 4,
              }}>
                Suggested questions
              </div>
              {SUGGESTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  style={{
                    padding: '10px 14px',
                    background: 'var(--bg-raised)',
                    border: '1px solid var(--border)',
                    borderRadius: 10,
                    fontSize: 13, color: 'var(--text-2)',
                    cursor: 'pointer', textAlign: 'left',
                    transition: 'all 0.15s', lineHeight: 1.4,
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'var(--accent)'
                    e.currentTarget.style.color = 'var(--text)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'var(--border)'
                    e.currentTarget.style.color = 'var(--text-2)'
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} style={{
              display: 'flex',
              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
            }}>
              <div style={{
                maxWidth: '85%',
                padding: '10px 14px',
                borderRadius: msg.role === 'user'
                  ? '16px 16px 4px 16px'
                  : '16px 16px 16px 4px',
                background: msg.role === 'user' ? 'var(--accent)' : 'var(--bg-raised)',
                color: msg.role === 'user' ? 'var(--accent-fg)' : 'var(--text)',
                fontSize: 13, lineHeight: 1.6,
                border: msg.role === 'user' ? 'none' : '1px solid var(--border)',
              }}>
                {msg.content.split('\n').map((line, j) => {
                  const parts = msg.content.split('\n')
                  const mb = j < parts.length - 1 ? 4 : 0
                  if (line.startsWith('**') && line.endsWith('**')) {
                    return <div key={j} style={{ marginBottom: mb }}><strong>{line.slice(2, -2)}</strong></div>
                  }
                  if (line.startsWith('* ') || line.startsWith('• ')) {
                    return <div key={j} style={{ marginBottom: mb }}>• {line.slice(2)}</div>
                  }
                  return <div key={j} style={{ marginBottom: mb }}>{line}</div>
                })}
              </div>
            </div>
          ))}

          {loading && (
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <div style={{
                padding: '12px 16px',
                background: 'var(--bg-raised)',
                border: '1px solid var(--border)',
                borderRadius: '16px 16px 16px 4px',
                display: 'flex', gap: 4, alignItems: 'center',
              }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{
                    width: 6, height: 6,
                    background: 'var(--accent)',
                    borderRadius: '50%',
                    animation: 'bounce 1s infinite',
                    animationDelay: `${i * 0.15}s`,
                  }} />
                ))}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div style={{
          padding: '1rem', borderTop: '1px solid var(--border)',
          background: 'var(--bg-raised)',
          display: 'flex', gap: 8, flexShrink: 0,
        }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder={`Ask about ${cert?.name}...`}
            disabled={loading}
            rows={1}
            style={{
              flex: 1, padding: '10px 14px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 10,
              color: 'var(--text)', fontSize: 13,
              outline: 'none', resize: 'none',
              fontFamily: 'inherit',
              maxHeight: 96, minHeight: 40,
            }}
            onFocus={e => { e.target.style.borderColor = 'var(--accent)' }}
            onBlur={e => { e.target.style.borderColor = 'var(--border)' }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={loading || !input.trim()}
            style={{
              width: 40, height: 40,
              background: input.trim() ? 'var(--accent)' : 'var(--bg-sunken)',
              color: input.trim() ? 'var(--accent-fg)' : 'var(--text-3)',
              border: 'none', borderRadius: 10,
              cursor: input.trim() ? 'pointer' : 'default',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, transition: 'all 0.15s',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>send</span>
          </button>
        </div>
      </div>
    </>
  )
}
