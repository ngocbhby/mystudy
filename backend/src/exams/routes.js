import { subjects } from '@mystudy/shared/study-goal'
import { json } from '../http/response.js'
import { getOnlineExam, getQuestions, listExams } from './store.js'

const examPath = /^\/api\/exams\/([0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12})(?:\/(answers))?$/i

export async function handleExams(response, url, pool) {
  if (!pool) return json(response, 503, { error: 'Chưa kết nối được kho đề thi.' })
  if (url.pathname === '/api/exams') {
    const subject = url.searchParams.get('subject') || null
    const year = url.searchParams.get('year') || null
    if ((subject && !Object.hasOwn(subjects, subject)) || (year && !/^\d{4}$/.test(year))) {
      return json(response, 400, { error: 'Bộ lọc đề thi không hợp lệ.' })
    }
    return json(response, 200, await listExams(pool, subject, year))
  }

  const match = examPath.exec(url.pathname)
  const online = match && await getOnlineExam(pool, match[1])
  if (!online) return json(response, 404, { error: 'Không tìm thấy đề thi trực tuyến.' })
  const { versionId, ...exam } = online
  return json(response, 200, { exam, questions: await getQuestions(pool, versionId, Boolean(match[2])) })
}
