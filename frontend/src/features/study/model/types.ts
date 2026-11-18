import type { PurposeCode, SubjectCode } from './catalog'

export type Strategy = 'exam_focused' | 'foundation_first'

export interface Goal {
  purpose: PurposeCode
  electiveCodes: SubjectCode[]
  scores: Partial<Record<SubjectCode, number>>
  /** Điểm hiện tại tự đánh giá (tùy chọn): lộ trình dành nhiều thời gian hơn cho môn còn cách xa mục tiêu. */
  currentScores?: Partial<Record<SubjectCode, number>>
  months: number
  dailyMinutes: number
  days: number[]
}

/** Dữ liệu gửi lên khi lưu mục tiêu; `strategy` bỏ trống = giữ cách ôn hiện tại. */
export interface GoalInput extends Goal {
  strategy?: Strategy
}

export interface Plan {
  id: string
  startsOn: string
  strategy: Strategy
}

export interface StudyGoalData {
  goal: Goal | null
  plan: Plan | null
}

export interface Task {
  id: string
  subjectCode: SubjectCode
  topicId?: string
  topic: string
  date: string
  minutes: number
  content: string
  completed: boolean
}

export interface Overview {
  today: string
  tasks: Task[]
  nextStudyDate: string | null
  streakDays: number
}
