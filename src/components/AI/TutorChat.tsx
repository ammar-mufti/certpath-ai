import { useState, useRef, useEffect, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { useTutorStore } from '../../store/tutorStore'
import { useAuthStore } from '../../store/authStore'
import { useExamStore } from '../../store/examStore'
import { DOMAIN_COLORS } from '../../store/examStore'

const WORKER_URL = import.meta.env.VITE_WORKER_URL

const STARTERS = [
  'Quiz me on a key concept in this domain',
  "What's the most common exam mistake here?",
  'Explain the most important framework I need to know',
  'Give me a tricky practice question',
  'How does this domain connect to others?',
  'What should I focus on for exam day?',
]

function renderMarkdown(text: string) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/^### (.+)$/gm, '<div class="text-gold font-semibold mt-2">$1</div>')
    .replace(/^## (.+)$/gm, '<div class="text-gold font-bold mt-2">$1</div>')
    .replace(/^- (.+)$/gm, '<div class="flex gap-2 mt-1"><span class="text-gold flex-shrink-0">•</span><span>$1</span></div>')
    .replace(/\n\n/g, '<div class="mt-2"></div>')
    .replace(/\n/g, '<br/>')
}

function usePageContext() {
  const location = useLocation()
  const { questions, answers, submitted } = useExamStore()

  // Extract certId and domain from path like /:certId/learn/:domainSlug
  const pathParts = location.pathname.split('/').filter(Boolean)
  const certId = pathParts[0] ?? ''
  const section = pathParts[1] ?? ''
  const domainSlug = pathParts[2] ?? ''

  if (section === 'learn' && domainSlug) {
    return `User is studying the "${decodeURIComponent(domainSlug)}" domain for ${certId.toUpperCase()} in the Learn module.`
  }
  if (section === 'learn') {
    return `User is on the ${certId.toUpperCase()} study guide home page.`
  }
  if (section === 'results' && submitted) {
    const correct = questions.filter(q => answers[q.id] === q.correct).length
    const pct = Math.round((correct / questions.length) * 100)
    const domains = [...new Set(questions.map(q => q.domain))]
    const weak = domains
      .map(d => {
        const qs = questions.filter(q => q.domain === d)
        const c = qs.filter(q => answers[q.id] === q.correct).length
        return { d, pct: Math.round((c / qs.length) * 100) }
      })
      .sort((a, b) => a.pct - b.pct)
      .slice(0, 3)
      .map(x => `${x.d} (${x.pct}%)`)
    return `User just completed a ${certId.toUpperCase()} practice exam. Score: ${correct}/${questions.length} (${pct}%). Weakest domains: ${weak.join(', ')}.`
  }
  if (section === 'exam') {
    return `User is currently taking a ${certId.toUpperCase()} practice exam.`
  }
  return 'General certification study session.'
}

function TypingDots() {
  return (
    <div className="flex gap-1 items-center px-4 py-3">
      {[0, 1, 2].map(i => (
        <div
          key={i}
          className="w-2 h-2 rounded-full bg-mist animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  )
}

export default function TutorChat() {
  const { messages, isOpen, isLoading, addMessage, setOpen, setLoading, setPageContext, clearHistory } = useTutorStore()
  const token = useAuthStore(s => s.token) ?? ''
  const pageContext = usePageContext()
  const [input, setInput] = useState('')
  const [failedMessage, setFailedMessage] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const autoRetryRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Keep page context in sync
  useEffect(() => { setPageContext(pageContext) }, [pageContext, setPageContext])

  // Scroll to bottom on new messages
  useEffect(() => {
    if (isOpen) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading, isOpen, failedMessage])

  // Focus input when opened
  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 100)
  }, [isOpen])

  // Clear auto-retry timer on unmount
  useEffect(() => () => { if (autoRetryRef.current) clearTimeout(autoRetryRef.current) }, [])

  const callWorker = useCallback(async (content: string) => {
    const res = await fetch(`${WORKER_URL}/api/llm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        type: 'tutor-chat',
        domain: '',
        messages: [...messages, { role: 'user', content }],
        pageContext,
      }),
    })
    const data = await res.json() as { response?: string; error?: string }
    if (!res.ok || data.error) {
      throw new Error(data.error ?? `Server error (${res.status})`)
    }
    return data.response?.trim() || 'Sorry, I could not generate a response.'
  }, [messages, pageContext, token])

  async function send(text: string) {
    const content = text.trim()
    if (!content || isLoading) return
    setInput('')
    // Clear any existing error state before new send
    setFailedMessage(null)
    if (autoRetryRef.current) clearTimeout(autoRetryRef.current)
    addMessage('user', content)
    setLoading(true)

    try {
      const response = await callWorker(content)
      addMessage('assistant', response)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      console.error('[TutorChat] error:', msg)
      setFailedMessage(content)
      setRetryCount(0)
      // Auto-retry once after 3 seconds on first failure
      autoRetryRef.current = setTimeout(() => {
        console.log('[TutorChat] auto-retrying...')
        doRetry(content, 0)
      }, 3000)
    } finally {
      setLoading(false)
    }
  }

  async function doRetry(content: string, currentCount: number) {
    if (!content || isLoading) return
    if (autoRetryRef.current) clearTimeout(autoRetryRef.current)
    setRetryCount(currentCount + 1)
    setLoading(true)

    try {
      const response = await callWorker(content)
      addMessage('assistant', response)
      setFailedMessage(null)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      console.error('[TutorChat] retry failed:', msg)
      setRetryCount(currentCount + 1)
      // Keep failedMessage set so the error UI stays visible
    } finally {
      setLoading(false)
    }
  }

  function handleRetry() {
    if (!failedMessage) return
    doRetry(failedMessage, retryCount)
  }

  function handleDismiss() {
    if (autoRetryRef.current) clearTimeout(autoRetryRef.current)
    setFailedMessage(null)
    setRetryCount(0)
  }

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send(input)
    }
  }

  const domainMatch = pageContext.match(/"([^"]+)" domain/)
  const accentColor = domainMatch ? (DOMAIN_COLORS[domainMatch[1]] ?? '#C9A84C') : '#C9A84C'

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gold text-navy text-2xl shadow-lg hover:bg-amber-400 transition-all hover:scale-110 flex items-center justify-center"
        title="AI Tutor"
      >
        {isOpen ? '✕' : '🎓'}
      </button>

      {/* Chat panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-96 h-[600px] bg-navy border border-white/20 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between flex-shrink-0" style={{ borderBottomColor: accentColor + '40' }}>
            <div className="flex items-center gap-2">
              <span className="text-xl">🎓</span>
              <div>
                <div className="text-cream font-semibold text-sm">CertPath AI Tutor</div>
                <div className="text-mist text-xs truncate max-w-[220px]">{pageContext.split('.')[0]}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {failedMessage && !isLoading && (
                <button
                  onClick={handleRetry}
                  className="text-xs text-gold hover:text-amber-400 flex items-center gap-1 transition-colors"
                >
                  ↺ Retry
                </button>
              )}
              <button onClick={clearHistory} className="text-mist/50 hover:text-mist text-xs transition-colors" title="Clear history">
                Clear
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.length === 0 && !failedMessage && (
              <div>
                <p className="text-mist text-sm mb-4 text-center">Ask me anything about your certification exam</p>
                <div className="space-y-2">
                  {STARTERS.map(s => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="w-full text-left text-xs px-3 py-2 rounded-lg border border-white/10 text-mist hover:border-gold/40 hover:text-cream transition-all"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-gold text-navy font-medium rounded-br-sm'
                      : 'bg-ink border border-white/10 text-cream rounded-bl-sm'
                  }`}
                >
                  {msg.role === 'assistant'
                    ? <div dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }} />
                    : msg.content
                  }
                </div>
              </div>
            ))}

            {/* Error bubble with retry — rendered after messages, not stored in store */}
            {failedMessage && !isLoading && (
              <div className="flex justify-start">
                <div className="max-w-[85%] bg-red-500/10 border border-red-500/20 rounded-2xl rounded-bl-sm px-4 py-3">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="text-red-400 text-xs">⚠</span>
                    <span className="text-red-400 text-xs font-medium">Failed to get response</span>
                  </div>
                  <p className="text-mist/70 text-xs mb-3 leading-relaxed">
                    Your message: "<span className="text-mist">{failedMessage}</span>"
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleRetry}
                      disabled={isLoading}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-gold text-navy text-xs font-semibold rounded-lg hover:bg-amber-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      ↺ Retry
                    </button>
                    <button
                      onClick={handleDismiss}
                      className="px-3 py-1.5 text-xs text-mist hover:text-cream transition-colors"
                    >
                      Dismiss
                    </button>
                  </div>
                  {retryCount > 0 && (
                    <p className="text-mist/40 text-xs mt-2">
                      Retried {retryCount} time{retryCount !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              </div>
            )}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-ink border border-white/10 rounded-2xl rounded-bl-sm">
                  {failedMessage
                    ? <div className="flex items-center gap-2 px-4 py-3 text-xs text-mist">
                        <span className="w-3 h-3 border border-mist/30 border-t-mist rounded-full animate-spin flex-shrink-0" />
                        Retrying…
                      </div>
                    : <TypingDots />
                  }
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-4 py-3 border-t border-white/10 flex-shrink-0">
            <div className="flex gap-2 items-end">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Ask about any exam topic…"
                rows={1}
                className="flex-1 bg-ink border border-white/20 rounded-xl px-3 py-2 text-cream text-sm resize-none focus:outline-none focus:border-gold/60 placeholder-mist/50 max-h-24 overflow-y-auto"
                style={{ minHeight: '40px' }}
              />
              <button
                onClick={() => send(input)}
                disabled={!input.trim() || isLoading}
                className="bg-gold text-navy font-bold px-4 py-2 rounded-xl hover:bg-amber-400 disabled:opacity-40 transition-colors text-sm flex-shrink-0"
              >
                Send
              </button>
            </div>
            <p className="text-mist/40 text-xs mt-1.5 text-center">Enter to send · Shift+Enter for new line</p>
          </div>
        </div>
      )}
    </>
  )
}
