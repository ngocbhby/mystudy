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
  /** Chỉ có khi lấy từ endpoint đáp án hoặc kết quả. */
  correctOption?: number
  explanation?: string
}

export interface QuestionReview {
  number: number
  prompt: string
  options: ExamOption[]
  correctOption: number
  userOption: number | null
  isCorrect: boolean
  explanation?: string
  topicId?: string | null
}

export interface AttemptDetail {
  id: string
  examId: string
  score: number
  correctCount: number
  incorrectCount: number
  blankCount: number
  questionCount: number
  elapsedSeconds: number
  submittedAt: string
  answers: Record<number, number>
  questions: QuestionReview[]
}

/** Thời gian làm bài do máy chủ tính, trình duyệt chỉ gửi đáp án. */
export interface SubmitAttemptPayload {
  answers: Record<number, number>
}

export interface StartedAttempt {
  attemptId: string
  startedAt: string
  expiresAt: string
  serverTime: string
  /** Chỉ có với khách: gửi lại khi nộp bài và xem kết quả. */
  attemptToken: string | null
}

export interface ExamDetail {
  exam: ExamSummary
  questions: ExamQuestion[]
}

export interface ExamFilters {
  subject: string
  year: string
}
