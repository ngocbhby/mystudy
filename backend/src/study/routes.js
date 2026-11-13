import { validateGoal } from '@mystudy/shared/study-goal'
import { json, readJson } from '../http/response.js'
import { completeStudyTask, getStudyGoal, getStudyOverview, getStudyTasks, saveStudyGoal } from './study-store.js'

export async function handleStudy(request, response, url, { pool, getUser }) {
  if (!pool) return json(response, 503, { error: 'Chưa kết nối cơ sở dữ liệu. Vui lòng thử lại sau.' })
  const user = await getUser(request)
  if (!user) return json(response, 401, { error: 'Phiên đã hết hạn. Hãy đăng nhập lại để tiếp tục.' })

  if (url.pathname === '/api/study/overview') {
    return json(response, 200, await getStudyOverview(pool, user.id))
  }

  if (url.pathname === '/api/study/goal') {
    if (request.method === 'GET') return json(response, 200, await getStudyGoal(pool, user.id))
    const body = await readJson(request)
    const errors = validateGoal(body)
    if (Object.keys(errors).length) {
      return json(response, 400, { error: 'Kiểm tra lại các trường được đánh dấu.', errors })
    }
    const strategy = body.strategy
    if (strategy !== undefined && !['exam_focused', 'foundation_first'].includes(strategy)) {
      return json(response, 400, { error: 'Cách ôn tập không hợp lệ.' })
    }
    return json(response, 201, await saveStudyGoal(pool, user.id, body, strategy))
  }

  if (request.method === 'POST') {
    const body = await readJson(request)
    if (typeof body?.id !== 'string' || !/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(body.id)) {
      return json(response, 400, { error: 'Nhiệm vụ không hợp lệ.' })
    }
    const completed = await completeStudyTask(pool, user.id, body.id)
    return completed
      ? json(response, 200, { completed: true })
      : json(response, 404, { error: 'Không thể đánh dấu nhiệm vụ này.' })
  }

  const from = url.searchParams.get('from')
  const to = url.searchParams.get('to')
  const isDate = (value) => {
    if (!/^20\d{2}-\d{2}-\d{2}$/.test(value ?? '')) return false
    const date = new Date(value + 'T00:00:00Z')
    return !Number.isNaN(+date) && date.toISOString().slice(0, 10) === value
  }
  if (!isDate(from) || !isDate(to) || from > to || Date.parse(to) - Date.parse(from) > 7 * 86_400_000) {
    return json(response, 400, { error: 'Khoảng ngày không hợp lệ.' })
  }
  return json(response, 200, { tasks: await getStudyTasks(pool, user.id, from, to) })
}
