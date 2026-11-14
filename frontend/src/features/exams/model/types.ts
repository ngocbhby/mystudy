export interface ExamSummary {
  id: string
  title: string
  kind: 'past_paper' | 'mystudy_practice'
  subjectCode: string
  year: number | null
  durationMinutes: number
  source: string
  paperUrl: string
  answerUrl: string
  questionCount: number
}

export interface ExamList {
  exams: ExamSummary[]
  subjects: string[]
  years: number[]
}

export interface ExamOption {
  number: number
  text: string
}

export interface ExamQuestion {
  number: number
  prompt: string
  options: ExamOption[]
  /** Chỉ có khi lấy từ endpoint đáp án. */
  correctOption?: number
}

export interface ExamDetail {
  exam: ExamSummary
  questions: ExamQuestion[]
}

export interface ExamFilters {
  subject: string
  year: string
}
