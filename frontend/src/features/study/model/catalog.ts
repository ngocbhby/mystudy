export const purposes = [
  { code: 'graduation', label: 'Chỉ cần tốt nghiệp' },
  { code: 'university_admission', label: 'Xét tuyển đại học' },
] as const

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
} as const

export type SubjectCode = keyof typeof subjects
export type PurposeCode = (typeof purposes)[number]['code']

export const requiredSubjects = ['math', 'literature'] as const satisfies readonly SubjectCode[]
export const electives = (Object.keys(subjects) as SubjectCode[]).filter(
  (code): code is Exclude<SubjectCode, 'math' | 'literature'> =>
    !(requiredSubjects as readonly string[]).includes(code),
)

export const subjectName = (code: string): string => subjects[code as SubjectCode] ?? code

export const weekdays = [
  { short: 'T2', label: 'Thứ Hai' },
  { short: 'T3', label: 'Thứ Ba' },
  { short: 'T4', label: 'Thứ Tư' },
  { short: 'T5', label: 'Thứ Năm' },
  { short: 'T6', label: 'Thứ Sáu' },
  { short: 'T7', label: 'Thứ Bảy' },
  { short: 'CN', label: 'Chủ nhật' },
] as const

export const strategies = [
  {
    code: 'exam_focused',
    label: 'Sát đề',
    detail: 'Tập trung dạng bài thường gặp, luyện đề và sửa lỗi để tăng tốc.',
  },
  {
    code: 'foundation_first',
    label: 'Nền tảng → điểm cao',
    detail: 'Củng cố kiến thức cốt lõi, rồi nâng dần độ khó theo mục tiêu.',
  },
] as const
