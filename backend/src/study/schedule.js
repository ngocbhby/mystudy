import { getStudyEndDate } from '@mystudy/shared/calendar'
import { requiredSubjects } from '@mystudy/shared/study-goal'

export function schedule(goal, topics, retained, startsOn, strategy) {
  const day = new Date(startsOn + 'T00:00:00Z')
  const end = getStudyEndDate(startsOn, goal.months)
  const codes = [...requiredSubjects, ...goal.electiveCodes].sort((a, b) => goal.scores[b] - goal.scores[a])
  const grouped = Object.groupBy(topics, (topic) => topic.subject_code)
  const retainedByDay = Object.groupBy(retained, (task) => task.date)
  const tasks = []
  let slot = 0
  for (; day < end; day.setUTCDate(day.getUTCDate() + 1)) {
    if (!goal.days.includes(day.getUTCDay() || 7)) continue
    const date = day.toISOString().slice(0, 10)
    const kept = retainedByDay[date] ?? []
    let remaining = goal.dailyMinutes - kept.reduce((sum, task) => sum + task.planned_minutes, 0)
    let position = kept.reduce((max, task) => Math.max(max, task.position), 0) + 1
    while (remaining > 0) {
      const code = codes[slot % codes.length]
      const round = Math.floor(slot / codes.length)
      const available = grouped[code]
      if (!available?.length) throw new Error('Missing topics for ' + code)
      const topic = available[(round + (strategy === 'exam_focused' ? available.length - 1 : 0)) % available.length]
      const minutes = Math.min(remaining, 45)
      const content = strategy === 'exam_focused'
        ? `Luyện dạng bài về ${topic.name.toLocaleLowerCase('vi-VN')}. Làm bài có bấm giờ, sau đó ghi lại lỗi và cách sửa.`
        : `Ôn kiến thức về ${topic.name.toLocaleLowerCase('vi-VN')}. Tóm tắt ý chính, xem một ví dụ rồi tự làm bài tương tự.`
      tasks.push({ date, position, code, topicId: topic.id, minutes, content })
      position++
      slot++
      remaining -= minutes
    }
  }
  return tasks
}
