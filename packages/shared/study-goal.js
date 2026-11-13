export const purposes = [
  ['graduation', 'Chỉ cần tốt nghiệp'],
  ['university_admission', 'Xét tuyển đại học'],
]

export const subjects = {
  math: 'Toán',
  literature: 'Ngữ văn',
  physics: 'Vật lí',
  chemistry: 'Hóa học',
  biology: 'Sinh học',
  history: 'Lịch sử',
  geography: 'Địa lí',
  civics: 'Giáo dục kinh tế và pháp luật',
  informatics: 'Tin học',
  technology: 'Công nghệ',
  english: 'Tiếng Anh',
}

export const requiredSubjects = ['math', 'literature']
export const electives = Object.keys(subjects).filter((code) => !requiredSubjects.includes(code))

export function validateGoal(goal) {
  const errors = {}
  if (!purposes.some(([code]) => goal?.purpose === code)) errors.purpose = 'Hãy chọn mục đích ôn thi.'

  const choices = goal?.electiveCodes
  if (!Array.isArray(choices) || choices.length !== 2 || !choices.every((code) => electives.includes(code))
      || choices[0] === choices[1]) {
    errors.electives = 'Hãy chọn hai môn tự chọn khác nhau.'
  }

  const codes = [...requiredSubjects, ...(errors.electives ? [] : choices)]
  for (const code of codes) {
    const score = goal?.scores?.[code]
    if (!Number.isFinite(score) || score < 0 || score > 10) {
      errors[code] = 'Nhập điểm từ 0 đến 10.'
    }
  }

  if (!Number.isInteger(goal?.months) || goal.months < 1 || goal.months > 24) {
    errors.months = 'Nhập số tháng nguyên từ 1 đến 24.'
  }
  if (!Number.isInteger(goal?.dailyMinutes) || goal.dailyMinutes < 1 || goal.dailyMinutes > 1440) {
    errors.dailyMinutes = 'Nhập số giờ tương ứng từ 1 phút đến 24 giờ.'
  }
  const days = goal?.days
  if (!Array.isArray(days) || !days.length || days.some((day) => !Number.isInteger(day) || day < 1 || day > 7)
      || new Set(days).size !== days.length) {
    errors.days = 'Hãy chọn ít nhất một ngày học trong tuần.'
  }
  return errors
}
