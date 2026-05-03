interface Env {
  GITHUB_CLIENT_ID: string
  GITHUB_CLIENT_SECRET: string
  GOOGLE_CLIENT_ID: string
  GOOGLE_CLIENT_SECRET: string
  JWT_SECRET: string
  GROQ_API_KEY: string
  USER_KV: KVNamespace
  ADMIN_EMAIL: string
}

interface StoredUser {
  name: string
  email: string
  passwordHash?: string
  provider?: string
  createdAt: string
  lastActive?: string
  certsStudied?: string[]
  examsCompleted?: number
  lastExamScore?: number | null
  lastExamCert?: string | null
}

const ALLOWED_ORIGINS = ['https://ammar-mufti.github.io', 'http://localhost:5173', 'http://localhost:4173']
const FRONTEND_URL = 'https://ammar-mufti.github.io/certpath-ai'
const GOOGLE_REDIRECT_URI = 'https://ccxp-auth.muftiammar52.workers.dev/auth/google/callback'

function corsHeaders(origin: string): Record<string, string> {
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  }
}

async function requireAdmin(request: Request, env: Env): Promise<Record<string, unknown>> {
  const auth = request.headers.get('Authorization') ?? ''
  if (!auth.startsWith('Bearer ')) throw new Error('Unauthorized')
  const payload = await verifyJwt(auth.replace('Bearer ', ''), env.JWT_SECRET)
  if (!payload) throw new Error('Unauthorized')
  if (!payload.isAdmin) throw new Error('Forbidden')
  return payload
}

async function upsertUserKv(env: Env, email: string, name: string, provider: string): Promise<void> {
  const userKey = `user_${email.toLowerCase()}`
  const existing = await env.USER_KV.get(userKey)
  const now = new Date().toISOString()
  if (!existing) {
    await env.USER_KV.put(userKey, JSON.stringify({
      name, email: email.toLowerCase(), provider,
      createdAt: now, lastActive: now,
      certsStudied: [], examsCompleted: 0, lastExamScore: null, lastExamCert: null,
    }))
  } else {
    const userData = JSON.parse(existing) as StoredUser
    userData.lastActive = now
    if (!userData.provider) userData.provider = provider
    await env.USER_KV.put(userKey, JSON.stringify(userData))
  }
}

function jsonRes(data: unknown, status = 200, origin = '') {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
  })
}

function errorRes(message: string, status: number, origin = '') {
  return jsonRes({ error: message }, status, origin)
}

async function signJwt(payload: Record<string, unknown>, secret: string): Promise<string> {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  const body = btoa(JSON.stringify({
    ...payload,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60),
  })).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')

  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${header}.${body}`))
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
  return `${header}.${body}.${sigB64}`
}

async function verifyJwt(token: string, secret: string): Promise<Record<string, unknown> | null> {
  try {
    const [header, body, sig] = token.split('.')
    if (!header || !body || !sig) return null
    const data = `${header}.${body}`
    const key = await crypto.subtle.importKey(
      'raw', new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' }, false, ['verify'],
    )
    const padded = sig.replace(/-/g, '+').replace(/_/g, '/') + '=='.slice(0, (4 - sig.length % 4) % 4)
    const sigBytes = Uint8Array.from(atob(padded), c => c.charCodeAt(0))
    const valid = await crypto.subtle.verify('HMAC', key, sigBytes, new TextEncoder().encode(data))
    if (!valid) return null
    const payload = JSON.parse(atob(body.replace(/-/g, '+').replace(/_/g, '/'))) as Record<string, unknown>
    if ((payload.exp as number) * 1000 < Date.now()) return null
    return payload
  } catch {
    return null
  }
}

async function hashPassword(password: string, secret: string): Promise<string> {
  const hash = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(password + secret),
  )
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0')).join('')
}

function extractJson(text: string, shape: 'array' | 'object'): unknown {
  if (!text || !text.trim()) throw new Error('LLM returned empty text')
  const clean = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()
  try { return JSON.parse(clean) } catch { /* continue */ }
  const pattern = shape === 'array' ? /\[[\s\S]*\]/ : /\{[\s\S]*\}/
  const match = clean.match(pattern)
  if (match) {
    try { return JSON.parse(match[0]) } catch { /* continue */ }
  }
  const startChar = shape === 'array' ? '[' : '{'
  const idx = clean.indexOf(startChar)
  if (idx !== -1) {
    try { return JSON.parse(clean.slice(idx)) } catch { /* continue */ }
  }
  throw new Error(`Could not parse JSON from LLM output. Preview: ${text.slice(0, 200)}`)
}

const GROQ_MODELS = [
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
  'mixtral-8x7b-32768',
]

async function llm(prompt: string, env: Env, maxTokens = 2048): Promise<string> {
  const cap = Math.min(maxTokens, 8192)
  let lastError = ''

  for (let i = 0; i < GROQ_MODELS.length; i++) {
    const model = GROQ_MODELS[i]
    if (i > 0) {
      const waitMs = Math.pow(2, i) * 1000
      await new Promise(r => setTimeout(r, waitMs))
    }

    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.GROQ_API_KEY}` },
        body: JSON.stringify({
          model,
          max_tokens: cap,
          temperature: 0.4,
          messages: [{ role: 'user', content: prompt }],
        }),
      })

      if (res.status === 401 || res.status === 403) {
        const errorBody = await res.text()
        throw new Error(`Groq key invalid (${res.status}). Error: ${errorBody}`)
      }

      if (res.status === 429) {
        const retryAfter = res.headers.get('retry-after')
        const waitMs = retryAfter ? parseInt(retryAfter) * 1000 : 3000
        lastError = `${model} rate limited`
        if (waitMs > 0 && waitMs < 15000) await new Promise(r => setTimeout(r, waitMs))
        continue
      }

      if (res.status === 400) { lastError = `${model} HTTP 400`; continue }
      if (!res.ok) { lastError = `${model} HTTP ${res.status}`; continue }

      const data = await res.json() as { choices?: Array<{ message?: { content?: string } }>; error?: { message: string } }
      const text = data.choices?.[0]?.message?.content ?? ''
      if (!text.trim()) { lastError = `${model} returned empty response`; continue }
      return text
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      if (msg.includes('key invalid')) throw err
      lastError = msg
    }
  }

  throw new Error(`All Groq models failed. Last error: ${lastError}`)
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    const origin = request.headers.get('Origin') ?? ''

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) })
    }

    let parsedBody: Record<string, unknown> = {}
    if (request.method === 'POST') {
      try {
        const text = await request.text()
        if (text && text.trim()) {
          parsedBody = JSON.parse(text) as Record<string, unknown>
        }
      } catch {
        return new Response(
          JSON.stringify({ error: 'Invalid JSON body' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) } },
        )
      }
    }

    // â”€â”€ GitHub OAuth â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    if (url.pathname === '/auth/github/login') {
      return Response.redirect(
        `https://github.com/login/oauth/authorize?client_id=${env.GITHUB_CLIENT_ID}&scope=read:user user:email`,
        302,
      )
    }

    if (url.pathname === '/auth/github/callback') {
      const code = url.searchParams.get('code')
      if (!code) return errorRes('No code', 400, origin)

      const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ client_id: env.GITHUB_CLIENT_ID, client_secret: env.GITHUB_CLIENT_SECRET, code }),
      })
      const tokenData = await tokenRes.json() as { access_token?: string }
      if (!tokenData.access_token) return errorRes('Token exchange failed', 400, origin)

      const userRes = await fetch('https://api.github.com/user', {
        headers: { Authorization: `Bearer ${tokenData.access_token}`, 'User-Agent': 'certpath-ai-worker' },
      })
      const ghUser = await userRes.json() as { id: number; login: string; avatar_url: string; name: string; email: string | null }

      // Fetch email if not public
      let email = ghUser.email
      if (!email) {
        const emailRes = await fetch('https://api.github.com/user/emails', {
          headers: { Authorization: `Bearer ${tokenData.access_token}`, 'User-Agent': 'certpath-ai-worker' },
        })
        const emails = await emailRes.json() as Array<{ email: string; primary: boolean }>
        email = emails.find(e => e.primary)?.email ?? ''
      }

      const ghEmail = email ?? ''
      const ghName = ghUser.name ?? ghUser.login
      await upsertUserKv(env, ghEmail, ghName, 'github')

      const jwt = await signJwt({
        id: `github_${ghUser.id}`,
        login: ghUser.login,
        name: ghName,
        email: ghEmail,
        avatar: ghUser.avatar_url,
        provider: 'github',
        isAdmin: ghEmail === env.ADMIN_EMAIL,
      }, env.JWT_SECRET)

      return Response.redirect(`${FRONTEND_URL}/login?token=${jwt}`, 302)
    }

    // â”€â”€ Google OAuth â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    if (url.pathname === '/auth/google/login') {
      const params = new URLSearchParams({
        client_id: env.GOOGLE_CLIENT_ID,
        redirect_uri: GOOGLE_REDIRECT_URI,
        response_type: 'code',
        scope: 'openid email profile',
        access_type: 'offline',
        state: crypto.randomUUID(),
      })
      return Response.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`, 302)
    }

    if (url.pathname === '/auth/google/callback') {
      const code = url.searchParams.get('code')
      if (!code) return errorRes('No code', 400, origin)

      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          client_id: env.GOOGLE_CLIENT_ID,
          client_secret: env.GOOGLE_CLIENT_SECRET,
          redirect_uri: GOOGLE_REDIRECT_URI,
          grant_type: 'authorization_code',
        }),
      })
      const tokenData = await tokenRes.json() as { access_token?: string; error?: string }
      if (!tokenData.access_token) return errorRes('Google token exchange failed', 400, origin)

      const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      })
      const profile = await profileRes.json() as {
        sub: string; email: string; name: string; picture: string
      }

      await upsertUserKv(env, profile.email, profile.name, 'google')

      const jwt = await signJwt({
        id: `google_${profile.sub}`,
        login: profile.email.split('@')[0],
        name: profile.name,
        email: profile.email,
        avatar: profile.picture,
        provider: 'google',
        isAdmin: profile.email === env.ADMIN_EMAIL,
      }, env.JWT_SECRET)

      return Response.redirect(`${FRONTEND_URL}/login?token=${jwt}`, 302)
    }

    // â”€â”€ Email auth â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    if (url.pathname === '/auth/email/register' && request.method === 'POST') {
      const { email = '', password = '', name = '' } = parsedBody as { email?: string; password?: string; name?: string }

      if (!email.includes('@') || !email.includes('.')) return errorRes('Invalid email address', 400, origin)
      if (password.length < 8) return errorRes('Password must be at least 8 characters', 400, origin)
      if (!/\d/.test(password)) return errorRes('Password must contain at least one number', 400, origin)
      if (name.trim().length < 2) return errorRes('Please enter your full name', 400, origin)

      const existing = await env.USER_KV.get(`user_${email.toLowerCase()}`)
      if (existing) return errorRes('Email already registered', 409, origin)

      const passwordHash = await hashPassword(password, env.JWT_SECRET)
      const emailLower = email.toLowerCase()
      await env.USER_KV.put(
        `user_${emailLower}`,
        JSON.stringify({
          name: name.trim(), email: emailLower, passwordHash, provider: 'email',
          createdAt: new Date().toISOString(), lastActive: new Date().toISOString(),
          certsStudied: [], examsCompleted: 0, lastExamScore: null, lastExamCert: null,
        }),
      )

      const user = {
        id: `email_${email.replace(/[@.]/g, '_')}`,
        login: email.split('@')[0],
        name: name.trim(),
        email: emailLower,
        avatar: null,
        provider: 'email',
        isAdmin: emailLower === env.ADMIN_EMAIL,
      }
      const token = await signJwt(user, env.JWT_SECRET)
      return jsonRes({ token, user }, 200, origin)
    }

    if (url.pathname === '/auth/email/login' && request.method === 'POST') {
      const { email = '', password = '' } = parsedBody as { email?: string; password?: string }
      if (!email || !password) return errorRes('Email and password are required', 400, origin)

      const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown'
      const attemptKey = `failed_${ip}_${email.toLowerCase()}`
      const attempts = parseInt(await env.USER_KV.get(attemptKey) ?? '0')

      if (attempts >= 5) {
        return errorRes('Too many failed attempts. Try again in 15 minutes.', 429, origin)
      }

      const stored = await env.USER_KV.get(`user_${email.toLowerCase()}`)
      if (!stored) {
        await env.USER_KV.put(attemptKey, String(attempts + 1), { expirationTtl: 900 })
        return errorRes('Invalid email or password', 401, origin)
      }

      const userData = JSON.parse(stored) as { name: string; email: string; passwordHash: string }
      const passwordHash = await hashPassword(password, env.JWT_SECRET)

      if (passwordHash !== userData.passwordHash) {
        await env.USER_KV.put(attemptKey, String(attempts + 1), { expirationTtl: 900 })
        return errorRes('Invalid email or password', 401, origin)
      }

      await env.USER_KV.delete(attemptKey)

      // Update lastActive on login
      const updatedData = { ...userData, lastActive: new Date().toISOString() }
      if (!updatedData.provider) updatedData.provider = 'email'
      await env.USER_KV.put(`user_${email.toLowerCase()}`, JSON.stringify(updatedData))

      const user = {
        id: `email_${email.replace(/[@.]/g, '_')}`,
        login: userData.name.split(' ')[0].toLowerCase(),
        name: userData.name,
        email: userData.email,
        avatar: null,
        provider: 'email',
        isAdmin: userData.email === env.ADMIN_EMAIL,
      }
      const token = await signJwt(user, env.JWT_SECRET)
      return jsonRes({ token, user }, 200, origin)
    }

    // â”€â”€ Health check â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    if (url.pathname === '/api/health' && request.method === 'GET') {
      const keyPrefix = env.GROQ_API_KEY?.substring(0, 8) ?? 'missing'
      const keyLength = env.GROQ_API_KEY?.length ?? 0
      const [maintenance, banner] = await Promise.all([
        env.USER_KV.get('settings_maintenance'),
        env.USER_KV.get('settings_banner'),
      ])
      try {
        const res = await fetch('https://api.groq.com/openai/v1/models', {
          headers: { Authorization: `Bearer ${env.GROQ_API_KEY}` },
        })
        return jsonRes({
          status: res.ok ? 'healthy' : 'unhealthy',
          groq: res.ok ? 'connected' : 'key invalid',
          keyPrefix, keyLength,
          maintenance: maintenance === 'true',
          banner: banner ?? null,
          timestamp: new Date().toISOString(),
        }, 200, origin)
      } catch (err) {
        return jsonRes({ status: 'error', error: String(err), keyPrefix, keyLength, maintenance: maintenance === 'true', banner: banner ?? null }, 500, origin)
      }
    }

    // â”€â”€ Admin: GET /api/admin/stats â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    if (url.pathname === '/api/admin/stats' && request.method === 'GET') {
      try {
        await requireAdmin(request, env)
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        return errorRes(msg, msg === 'Forbidden' ? 403 : 401, origin)
      }

      const userList = await env.USER_KV.list({ prefix: 'user_' })
      const users: Array<{
        id: string; name: string; email: string; provider: string
        createdAt: string; lastActive: string | null
        certsStudied: string[]; examsCompleted: number
        lastExamScore: number | null; lastExamCert: string | null
      }> = []

      for (const key of userList.keys) {
        const data = await env.USER_KV.get(key.name)
        if (!data) continue
        const u = JSON.parse(data) as StoredUser
        if (!u.email) continue
        users.push({
          id: key.name,
          name: u.name ?? '',
          email: u.email,
          provider: u.provider ?? 'email',
          createdAt: u.createdAt ?? new Date().toISOString(),
          lastActive: u.lastActive ?? null,
          certsStudied: u.certsStudied ?? [],
          examsCompleted: u.examsCompleted ?? 0,
          lastExamScore: u.lastExamScore ?? null,
          lastExamCert: u.lastExamCert ?? null,
        })
      }

      const now = Date.now()
      const weekAgo = now - 7 * 24 * 60 * 60 * 1000
      const monthAgo = now - 30 * 24 * 60 * 60 * 1000

      const scoredUsers = users.filter(u => u.lastExamScore !== null)
      const avgScore = scoredUsers.length
        ? Math.round(scoredUsers.reduce((s, u) => s + (u.lastExamScore ?? 0), 0) / scoredUsers.length)
        : 0

      return jsonRes({
        users: {
          total: users.length,
          newThisWeek: users.filter(u => new Date(u.createdAt).getTime() > weekAgo).length,
          newThisMonth: users.filter(u => new Date(u.createdAt).getTime() > monthAgo).length,
          byProvider: {
            google: users.filter(u => u.provider === 'google').length,
            github: users.filter(u => u.provider === 'github').length,
            email: users.filter(u => u.provider === 'email').length,
          },
        },
        activity: {
          totalExams: users.reduce((s, u) => s + u.examsCompleted, 0),
          avgScore,
          activeThisWeek: users.filter(u => u.lastActive && new Date(u.lastActive).getTime() > weekAgo).length,
        },
        list: users.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
      }, 200, origin)
    }

    // â”€â”€ Admin: POST /api/admin/track â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    if (url.pathname === '/api/admin/track' && request.method === 'POST') {
      const auth = request.headers.get('Authorization') ?? ''
      const payload = await verifyJwt(auth.replace('Bearer ', ''), env.JWT_SECRET)
      if (!payload) return errorRes('Unauthorized', 401, origin)

      const { event, certId, score, domain } = parsedBody as { event?: string; certId?: string; score?: number; domain?: string }
      const userKey = `user_${(payload.email as string).toLowerCase()}`
      const stored = await env.USER_KV.get(userKey)

      if (stored) {
        const userData = JSON.parse(stored) as StoredUser
        userData.lastActive = new Date().toISOString()

        if (event === 'exam_completed' && certId && score !== undefined) {
          userData.examsCompleted = (userData.examsCompleted ?? 0) + 1
          userData.lastExamScore = score
          userData.lastExamCert = certId
          if (!userData.certsStudied?.includes(certId)) {
            userData.certsStudied = [...(userData.certsStudied ?? []), certId]
          }
        }

        if (event === 'domain_studied' && certId && domain) {
          if (!userData.certsStudied?.includes(certId)) {
            userData.certsStudied = [...(userData.certsStudied ?? []), certId]
          }
        }

        await env.USER_KV.put(userKey, JSON.stringify(userData))
      }

      return jsonRes({ ok: true }, 200, origin)
    }

    // â”€â”€ Admin: DELETE /api/admin/users/:email â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    if (url.pathname.startsWith('/api/admin/users/') && request.method === 'DELETE') {
      try {
        await requireAdmin(request, env)
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        return errorRes(msg, msg === 'Forbidden' ? 403 : 401, origin)
      }
      const email = decodeURIComponent(url.pathname.split('/api/admin/users/')[1] ?? '')
      if (!email) return errorRes('Missing email', 400, origin)
      await env.USER_KV.delete(`user_${email.toLowerCase()}`)
      return jsonRes({ deleted: email }, 200, origin)
    }

    // â”€â”€ Admin: GET/POST /api/admin/settings â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    if (url.pathname === '/api/admin/settings') {
      try {
        await requireAdmin(request, env)
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        return errorRes(msg, msg === 'Forbidden' ? 403 : 401, origin)
      }

      if (request.method === 'GET') {
        const [maintenance, featuredCert, banner] = await Promise.all([
          env.USER_KV.get('settings_maintenance'),
          env.USER_KV.get('settings_featured_cert'),
          env.USER_KV.get('settings_banner'),
        ])
        return jsonRes({ maintenance: maintenance === 'true', featuredCert: featuredCert ?? '', banner: banner ?? '' }, 200, origin)
      }

      if (request.method === 'POST') {
        const { maintenance, featuredCert, banner } = parsedBody as { maintenance?: boolean; featuredCert?: string; banner?: string }
        await Promise.all([
          env.USER_KV.put('settings_maintenance', maintenance ? 'true' : 'false'),
          env.USER_KV.put('settings_featured_cert', featuredCert ?? ''),
          env.USER_KV.put('settings_banner', banner ?? ''),
        ])
        return jsonRes({ ok: true }, 200, origin)
      }
    }

    if (url.pathname === '/api/test-groq' && request.method === 'GET') {
      const keyPrefix = env.GROQ_API_KEY?.substring(0, 8) ?? 'MISSING'
      const keyLength = env.GROQ_API_KEY?.length ?? 0
      try {
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.GROQ_API_KEY}` },
          body: JSON.stringify({
            model: 'llama-3.1-8b-instant',
            max_tokens: 10,
            messages: [{ role: 'user', content: 'Say hi' }],
          }),
        })
        const body = await res.text()
        return jsonRes({ status: res.status, keyPrefix, keyLength, body: body.slice(0, 300) }, 200, origin)
      } catch (err) {
        return jsonRes({ error: String(err), keyPrefix, keyLength }, 500, origin)
      }
    }

    // â”€â”€ LLM API (protected) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    if (url.pathname === '/api/llm' && request.method === 'POST') {
      const authHeader = request.headers.get('Authorization') ?? ''
      const token = authHeader.replace('Bearer ', '')
      const payload = await verifyJwt(token, env.JWT_SECRET)
      if (!payload) return errorRes('Unauthorized', 401, origin)

      const body = parsedBody as {
        type: string
        domain: string
        certId?: string
        certName?: string
        certFullName?: string
        certIssuer?: string
        passingScore?: number
        difficulty?: string
        examQuestions?: number
        count?: number
        extra?: string
        topics?: string[]
        topic?: string
        messages?: Array<{ role: string; content: string }>
        systemPrompt?: string
        pageContext?: string
        question?: string
        a?: string; b?: string; c?: string; d?: string
        correct?: string
        userAnswer?: string
      }

      const certName = body.certName ?? 'CCXP'
      const certFullName = body.certFullName ?? 'Certified Customer Experience Professional'
      const certIssuer = body.certIssuer ?? 'CXPA'
      const passingScore = body.passingScore ?? 70
      const difficulty = body.difficulty ?? 'Advanced'
      const examQuestions = body.examQuestions ?? 100

      // â”€â”€ STAGE 1: Domain snapshot â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      if (body.type === 'stage1-summary') {
        const prompt = `You are a ${certName} exam coach. Give a concise exam-focused summary of the domain: "${body.domain}" for the ${certName} certification issued by ${certIssuer}.

The candidate is sitting this exam soon. Focus on what the exam tests in this domain.

Output ONLY this JSON object â€” no markdown, no explanation:
{
  "tagline": "One sentence describing this domain purpose for ${certName}",
  "examWeight": "X questions â€” X% of exam",
  "mustKnow": [
    "Specific fact 1 with framework or model name",
    "Specific fact 2",
    "Specific fact 3",
    "Specific fact 4",
    "Specific fact 5"
  ],
  "commonMistakes": [
    "Specific mistake 1 candidates make in this domain",
    "Specific mistake 2",
    "Specific mistake 3"
  ],
  "connectedDomains": [
    "Domain name â€” one sentence why connected"
  ]
}`

        try {
          const raw = await llm(prompt, env, 1024)
          const data = extractJson(raw, 'object')
          return jsonRes({ data }, 200, origin)
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err)
          return jsonRes({ error: msg }, 500, origin)
        }
      }

      // â”€â”€ STAGE 2: Key concepts â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      if (body.type === 'stage2-concepts') {
        const topics = body.topics ?? []
        const half = Math.ceil(topics.length / 2)
        const batches = [topics.slice(0, half), topics.slice(half)].filter(b => b.length > 0)

        const buildBatchPrompt = (batch: string[]) =>
          `You are a ${certName} exam coach writing structured study material for the ${certName} certification exam.
Generate key concepts for domain: "${body.domain}".
Topics: ${batch.join(', ')}

Output ONLY a raw JSON array with exactly ${batch.length} objects â€” no markdown, no explanation:
[
  {
    "topic": "exact topic name from list",
    "summary": "One sentence what this concept is",
    "bullets": [
      "Specific key point with framework/model name if relevant",
      "Practical application",
      "Connection to other ${certName} concepts",
      "What the exam specifically tests here"
    ],
    "examTip": "The specific wrong answer pattern to avoid",
    "keyTerms": [
      {"term": "term", "definition": "one sentence"}
    ]
  }
]`

        try {
          const results = await Promise.all(
            batches.map(batch => llm(buildBatchPrompt(batch), env, 4096)),
          )
          const parsed = results.flatMap(raw => {
            const arr = extractJson(raw, 'array')
            return Array.isArray(arr) ? arr : []
          })
          if (parsed.length === 0) throw new Error('No topics parsed from batches')
          return jsonRes({ data: parsed }, 200, origin)
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err)
          return jsonRes({ error: msg }, 500, origin)
        }
      }

      // â”€â”€ STAGE 3: Deep dive â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      if (body.type === 'stage3-deepdive') {
        const prompt = `You are a ${certName} exam coach. Write a comprehensive deep dive on:
Topic: "${body.topic}"
Domain: "${body.domain}"
Certification: ${certName} (${certFullName}) issued by ${certIssuer}

Output ONLY this JSON object â€” no markdown, no explanation:
{
  "overview": "3-4 sentence comprehensive explanation",
  "howItWorks": [
    "Step 1 â€” specific and actionable",
    "Step 2",
    "Step 3",
    "Step 4"
  ],
  "realWorldExample": {
    "scenario": "Specific company or industry scenario (3-4 sentences)",
    "application": "How this topic applies in that scenario",
    "outcome": "What good practice looks like as a result"
  },
  "examScenario": {
    "question": "An exam-style scenario question about this topic",
    "wrongAnswer": "The tempting wrong answer and why it looks right",
    "correctAnswer": "The correct answer and why it is the best choice"
  },
  "frameworks": [
    {
      "name": "Framework or model name",
      "description": "What it is and when to use it",
      "stages": ["stage1", "stage2", "stage3"]
    }
  ],
  "memoryAid": "A mnemonic, acronym, or memorable shortcut"
}`

        try {
          const raw = await llm(prompt, env, 3000)
          const data = extractJson(raw, 'object')
          return jsonRes({ data }, 200, origin)
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err)
          return jsonRes({ error: msg }, 500, origin)
        }
      }

      // â”€â”€ STAGE 4: Practice quiz â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      if (body.type === 'stage4-quiz') {
        const prompt = `Generate exactly 5 practice questions for ${certName} domain: "${body.domain}".
Certification: ${certName} issued by ${certIssuer}. Pass mark: ${passingScore}%.
Rules: educational explanations (2-3 sentences), all 4 options plausible, vary question types.

Output ONLY a raw JSON array with exactly 5 objects â€” no markdown, no explanation:
[
  {
    "q": "Specific question text",
    "a": "Plausible option A",
    "b": "Plausible option B",
    "c": "Plausible option C",
    "d": "Plausible option D",
    "correct": "b",
    "explanation": "2-3 sentence educational explanation"
  }
]`

        try {
          const raw = await llm(prompt, env, 3000)
          const data = extractJson(raw, 'array')
          if (!Array.isArray(data) || data.length === 0) throw new Error('Expected non-empty array')
          return jsonRes({ data }, 200, origin)
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err)
          return jsonRes({ error: msg }, 500, origin)
        }
      }

      // â”€â”€ Tutor chat â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      if (body.type === 'tutor-chat') {
        const systemPrompt = body.systemPrompt ?? `You are an expert ${certName} exam coach helping a professional prepare for the ${certFullName} certification issued by ${certIssuer}. Pass mark: ${passingScore}%. Current context: ${body.pageContext ?? 'General study session'}. Style: concise and exam-focused, use bullet points and **bold** for key terms, give mnemonics when helpful, keep responses under 200 words unless detail is needed.`

        const messages = (body.messages ?? []).slice(-10)
        const groqMessages = [{ role: 'system', content: systemPrompt }, ...messages]

        let response = ''
        let lastError = ''

        for (let i = 0; i < GROQ_MODELS.length; i++) {
          const model = GROQ_MODELS[i]
          if (i > 0) {
            const waitMs = Math.pow(2, i) * 1000
            await new Promise(r => setTimeout(r, waitMs))
          }

          try {
            const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.GROQ_API_KEY}` },
              body: JSON.stringify({ model, messages: groqMessages, max_tokens: 1024, temperature: 0.5 }),
            })

            if (res.status === 401 || res.status === 403) {
              const errBody = await res.text()
              throw new Error(`Groq key invalid (${res.status}): ${errBody}`)
            }
            if (res.status === 429) {
              const retryAfter = res.headers.get('retry-after')
              const waitMs = retryAfter ? parseInt(retryAfter) * 1000 : 3000
              lastError = `${model} rate limited`
              if (waitMs > 0 && waitMs < 15000) await new Promise(r => setTimeout(r, waitMs))
              continue
            }
            if (res.status === 400) { lastError = `${model} HTTP 400`; continue }
            if (!res.ok) { lastError = `${model} HTTP ${res.status}`; continue }

            const data = await res.json() as { choices: Array<{ message: { content: string } }> }
            response = data.choices?.[0]?.message?.content ?? ''
            if (response.trim()) break
            lastError = `${model} empty response`
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err)
            if (msg.includes('key invalid')) return jsonRes({ error: msg }, 500, origin)
            lastError = msg
          }
        }

        if (!response.trim()) {
          return jsonRes({ error: `Tutor unavailable: ${lastError}` }, 500, origin)
        }

        return jsonRes({ response }, 200, origin)
      }

      // â”€â”€ Explain question â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      if (body.type === 'explain-question') {
        const optLabels: Record<string, string> = { a: body.a ?? '', b: body.b ?? '', c: body.c ?? '', d: body.d ?? '' }
        const correctText = optLabels[body.correct ?? ''] ?? ''
        const userText = optLabels[body.userAnswer ?? ''] ?? ''
        const wasCorrect = body.userAnswer === body.correct

        const prompt = `A ${certName} candidate answered this question.

Question: ${body.question}
A: ${body.a}  B: ${body.b}  C: ${body.c}  D: ${body.d}
Correct: (${body.correct?.toUpperCase()}) ${correctText}
They chose: (${body.userAnswer?.toUpperCase()}) ${userText}
${wasCorrect ? 'CORRECT.' : 'WRONG.'}

Explain in 3 parts:
**WHY (${body.correct?.toUpperCase()}) is correct:** [1-2 sentences]
**Why the others are wrong:** ${['a','b','c','d'].filter(o => o !== body.correct).map(o => `(${o.toUpperCase()}) one sentence`).join(', ')}
**ðŸ’¡ Exam Tip:** [one memory tip]

Under 150 words. Bold key terms. Domain: ${body.domain}`

        try {
          const raw = await llm(prompt, env, 512)
          return jsonRes({ explanation: raw }, 200, origin)
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err)
          return jsonRes({ explanation: `Could not generate explanation: ${msg}` }, 200, origin)
        }
      }

      // â”€â”€ Generate questions (exam) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      if (body.type === 'generate-questions') {
        const prompt = body.extra && body.extra.length > 100
          ? body.extra
          : `Generate ${body.count ?? 5} ${certName} exam questions for domain: "${body.domain}".
Certification: ${certName} (${certFullName}) issued by ${certIssuer}. Pass: ${passingScore}%.
Output ONLY a raw JSON array:
[{"q":"...","a":"...","b":"...","c":"...","d":"...","correct":"b","explanation":"max 25 words","sourceTopic":"topic","sourceTopicSlug":"kebab-case"}]`

        try {
          const raw = await llm(prompt, env, 4096)
          const parsed = extractJson(raw, 'array')
          if (Array.isArray(parsed) && parsed.length > 0) return jsonRes(parsed, 200, origin)
          throw new Error('Empty array returned')
        } catch {
          return jsonRes({ content: '' }, 200, origin)
        }
      }

      // â”€â”€ Study plan â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      if (body.type === 'study-plan') {
        const prompt = `${certName} study tips for weakest domains: ${body.domain}.
Generate 3 tips per domain.
Output ONLY raw JSON array:
[{"domain":"...","tips":["tip1","tip2","tip3"]}]`

        try {
          const raw = await llm(prompt, env, 1024)
          const parsed = extractJson(raw, 'array')
          return jsonRes(parsed, 200, origin)
        } catch {
          return jsonRes([], 200, origin)
        }
      }

      // â”€â”€ Legacy generate-content â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      if (body.type === 'generate-content') {
        const extra = body.extra ?? ''
        const maxTok = extra === 'topics' ? 4000 : 2048
        let prompt = ''
        if (extra === 'overview') {
          prompt = `Write a study overview for ${certName} domain: "${body.domain}". Max 220 words. Plain text.`
        } else if (extra === 'topics') {
          prompt = `Generate study content for ${certName} domain: "${body.domain}" topics.
Output ONLY raw JSON array:
[{"topic":"...","explanation":"150 words","example":"2-3 sentences","examTrap":"one sentence","keyTerms":[{"term":"...","definition":"..."}]}]`
        } else if (extra === 'flashcards') {
          prompt = `Generate 10 flashcards for ${certName} domain: "${body.domain}".
Output ONLY raw JSON array:
[{"front":"max 20 words","back":"max 40 words","why":"one sentence"}]`
        } else if (extra === 'quiz') {
          prompt = `Generate 5 practice questions for ${certName} domain: "${body.domain}".
Output ONLY raw JSON array:
[{"q":"...","a":"...","b":"...","c":"...","d":"...","correct":"b","explanation":"2-3 sentences"}]`
        }

        try {
          const raw = await llm(prompt, env, maxTok)
          if (extra === 'overview') return jsonRes({ content: raw }, 200, origin)
          const parsed = extractJson(raw, 'array')
          if (Array.isArray(parsed) && parsed.length > 0) return jsonRes({ data: parsed }, 200, origin)
          return jsonRes({ content: raw }, 200, origin)
        } catch {
          return jsonRes({ content: '' }, 200, origin)
        }
      }

      return errorRes('Unknown request type', 400, origin)
    }

    return jsonRes({ status: 'certpath-ai worker running' }, 200, origin)
  },
} satisfies ExportedHandler<Env>
