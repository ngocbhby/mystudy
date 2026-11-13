import { createHash, randomBytes } from 'node:crypto'
import { OAuth2Client } from 'google-auth-library'
import { json, readJson, redirect } from '../http/response.js'
import { createAuthStore } from './auth-store.js'
import { hashPassword, verifyPassword } from './password.js'

const LOGIN_TTL = 10 * 60
const SESSION_TTL = 7 * 24 * 60 * 60

const randomToken = () => randomBytes(32).toString('base64url')
const hashToken = (token) => createHash('sha256').update(token).digest('hex')
const expiresIn = (seconds) => new Date(Date.now() + seconds * 1000)

function readToken(request, name) {
  for (const pair of (request.headers.cookie ?? '').split(';')) {
    const [key, value] = pair.trim().split('=')
    if (key === name && /^[A-Za-z0-9_-]{43}$/.test(value ?? '')) return value
  }
  return null
}

async function readCredentials(request) {
  const body = await readJson(request)
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
  const password = body?.password
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      || typeof password !== 'string' || !password.length || Buffer.byteLength(password) > 1024) {
    return null
  }
  return { email, password }
}

export function createAuthRoutes({ env, origin, pool }) {
  const secure = origin.startsWith('https:')
  const sessionCookie = secure ? '__Host-mystudy_session' : 'mystudy_session'
  const flowCookie = secure ? '__Host-mystudy_oauth' : 'mystudy_oauth'
  const redirectUri = new URL('/api/auth/google/callback', origin).href
  const store = pool && createAuthStore(pool)
  const google = env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
    ? new OAuth2Client({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      redirectUri,
    })
    : null
  const configured = Boolean(store && google)
  const attempts = new Map()
  let resetAttemptsAt = 0
  let activePasswordRequests = 0

  function setCookie(response, name, value, maxAge) {
    response.appendHeader('Set-Cookie',
      `${name}=${value}; Max-Age=${maxAge}; Path=/; HttpOnly; SameSite=Lax${secure ? '; Secure' : ''}`)
  }

  async function issueSession(request, response, saveSession) {
    const token = randomToken()
    const previousToken = readToken(request, sessionCookie)
    const profile = await saveSession({
      tokenHash: hashToken(token),
      expiresAt: expiresIn(SESSION_TTL),
      previousTokenHash: previousToken ? hashToken(previousToken) : null,
    })
    if (profile) setCookie(response, sessionCookie, token, SESSION_TTL)
    return profile
  }

  async function authenticateWithEmail(request, response, register) {
    if (!store) return json(response, 503, { error: 'Đăng nhập bằng email cần kết nối PostgreSQL.' })

    const now = Date.now()
    if (now >= resetAttemptsAt) {
      attempts.clear()
      resetAttemptsAt = now + 60_000
    }
    const ip = request.socket.remoteAddress
    const count = attempts.get(ip) ?? 0
    if (count >= 15 || attempts.size >= 10_000 || activePasswordRequests >= 2) {
      response.setHeader('Retry-After', String(Math.ceil((resetAttemptsAt - now) / 1000)))
      return json(response, 429, { error: 'Có quá nhiều yêu cầu. Vui lòng thử lại sau.' })
    }
    attempts.set(ip, count + 1)

    const credentials = await readCredentials(request)
    if (!credentials) {
      return json(response, 400, { error: 'Vui lòng nhập email và mật khẩu hợp lệ.' })
    }
    const { email, password } = credentials
    if (register && [...password].length < 12) {
      return json(response, 400, { error: 'Mật khẩu cần ít nhất 12 ký tự.' })
    }

    // Limit concurrent memory-intensive password hashes across clients.
    if (activePasswordRequests >= 2) {
      response.setHeader('Retry-After', '2')
      return json(response, 429, { error: 'Có quá nhiều yêu cầu. Vui lòng thử lại sau.' })
    }
    activePasswordRequests += 1
    try {
      if (register) {
        const hash = await hashPassword(password)
        const user = await issueSession(request, response,
          (session) => store.registerWithEmail(email, hash, session))
        return user
          ? json(response, 201, { user })
          : json(response, 409, { error: 'Không thể đăng ký bằng email này. Bạn có thể thử đăng nhập.' })
      }

      const profile = await store.findPasswordProfile(email)
      if (!await verifyPassword(password, profile?.passwordHash)) {
        return json(response, 401, { error: 'Email hoặc mật khẩu không đúng.' })
      }
      const { id, displayName } = profile
      const user = await issueSession(request, response,
        (session) => store.createEmailSession({ id, email, displayName }, session))
      return json(response, 200, { user })
    } finally {
      activePasswordRequests -= 1
    }
  }

  async function startLogin(response) {
    if (!configured) return redirect(response, '/?auth=unavailable')

    const state = randomToken()
    const nonce = randomToken()
    const { codeVerifier, codeChallenge } = await google.generateCodeVerifierAsync()
    await store.createLoginAttempt(hashToken(state), nonce, codeVerifier, expiresIn(LOGIN_TTL))
    setCookie(response, flowCookie, state, LOGIN_TTL)
    redirect(response, google.generateAuthUrl({
      scope: ['openid', 'email', 'profile'],
      state,
      nonce,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    }))
  }

  async function finishLogin(request, response, params) {
    if (!configured) return redirect(response, '/?auth=unavailable')

    const state = readToken(request, flowCookie)
    if (!state || state !== params.get('state')) {
      return redirect(response, '/?auth=expired')
    }

    setCookie(response, flowCookie, '', 0)
    const attempt = await store.consumeLoginAttempt(hashToken(state))
    if (!attempt) return redirect(response, '/?auth=expired')
    if (params.get('error') === 'access_denied') return redirect(response, '/?auth=cancelled')

    const code = params.get('code')
    if (!code || params.has('error')) return redirect(response, '/?auth=failed')

    const { tokens } = await google.getToken({
      code,
      codeVerifier: attempt.code_verifier,
      redirect_uri: redirectUri,
    })
    const ticket = await google.verifyIdToken({
      idToken: tokens.id_token,
      audience: env.GOOGLE_CLIENT_ID,
    })
    const identity = ticket.getPayload()
    if (!identity?.sub || identity.nonce !== attempt.nonce) {
      return redirect(response, '/?auth=failed')
    }

    await issueSession(request, response, (session) => store.createGoogleSession({
      subject: identity.sub,
      email: identity.email_verified === true ? identity.email ?? null : null,
      name: identity.name ?? null,
    }, session))
    redirect(response, '/')
  }

  async function getUser(request) {
    const token = readToken(request, sessionCookie)
    return store && token ? store.getSession(hashToken(token)) : null
  }

  return {
    getUser,
    async handle(request, response, url, route) {
      switch (route) {
        case 'GET /api/session':
          return json(response, 200, { user: await getUser(request), configured })
        case 'POST /api/auth/login':
          return authenticateWithEmail(request, response, false)
        case 'POST /api/auth/register':
          return authenticateWithEmail(request, response, true)
        case 'POST /api/auth/google':
          return startLogin(response)
        case 'GET /api/auth/google/callback':
          return finishLogin(request, response, url.searchParams)
        case 'POST /api/auth/logout': {
          const token = readToken(request, sessionCookie)
          if (store && token) await store.deleteSession(hashToken(token))
          setCookie(response, sessionCookie, '', 0)
          response.writeHead(204)
          return response.end()
        }
        default:
          return json(response, 404, { error: 'Không tìm thấy đường dẫn.' })
      }
    },
  }
}
