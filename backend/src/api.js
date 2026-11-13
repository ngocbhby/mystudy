import { Pool } from 'pg'
import { createAuthRoutes } from './auth/routes.js'
import { json, redirect } from './http/response.js'
import { handleExams } from './exams/routes.js'
import { handleStudy } from './study/routes.js'

const studyRoutes = new Set([
  'GET /api/study/goal',
  'GET /api/study/overview',
  'POST /api/study/goal',
  'GET /api/study/tasks',
  'POST /api/study/tasks',
])

export function createApi(env, defaultOrigin) {
  const origin = new URL(env.https://mystudy.onrender.com || defaultOrigin).origin
  const pool = env.DATABASE_URL
    ? new Pool({ connectionString: env.DATABASE_URL, connectionTimeoutMillis: 5000 })
    : null
  pool?.on('error', () => console.error('Kết nối PostgreSQL bị gián đoạn.'))
  const auth = createAuthRoutes({ env, origin, pool })

  return {
    close: () => pool?.end(),

    async handle(request, response, url) {
      const { pathname } = url
      const route = `${request.method} ${pathname}`
      response.setHeader('Cache-Control', 'no-store')
      response.setHeader('Referrer-Policy', 'no-referrer')

      if (request.method === 'POST' && request.headers.origin !== origin) {
        return json(response, 403, { error: 'Nguồn yêu cầu không hợp lệ.' })
      }

      const isExam = pathname === '/api/exams' || pathname.startsWith('/api/exams/')
      try {
        if (request.method === 'GET' && isExam) return await handleExams(response, url, pool)
        if (studyRoutes.has(route)) {
          return await handleStudy(request, response, url, { pool, getUser: auth.getUser })
        }
        return await auth.handle(request, response, url, route)
      } catch {
        console.error('Không thể xử lý yêu cầu.', route)
        if (isExam) return json(response, 503, { error: 'Không thể tải đề thi lúc này. Vui lòng thử lại.' })
        if (pathname.startsWith('/api/study/')) {
          return json(response, 503, { error: 'Không thể xử lý lộ trình lúc này. Vui lòng thử lại.' })
        }
        if (pathname === '/api/auth/google' || pathname === '/api/auth/google/callback') {
          return redirect(response, '/?auth=failed')
        }
        return json(response, 503, { error: 'Dịch vụ xác thực tạm thời gián đoạn.' })
      }
    },
  }
}
