export interface AiStatus {
  enabled: boolean
  remainingToday: number
  dailyLimit: number
}

export interface WrongAnswerExplanation {
  misconception: string
  steps: string[]
  tip: string
  reviewTopic: string
}

export interface ExplanationResult {
  explanation: WrongAnswerExplanation
  cached: boolean
  model: string
}

export interface TopicNote {
  topicId: string
  topicName: string
  subjectCode: string
  contentMd: string | null
  aiGenerated: boolean
}

export interface TopicMastery {
  topicId: string
  subjectCode: string
  topicName: string
  correct: number
  total: number
}

export interface WeaknessReport {
  summary: string
  priorities: { topicName: string; diagnosis: string; nextTasks: string[] }[]
  encouragement: string
}

export interface WeaknessAnalysis {
  topics: TopicMastery[]
  attempts: number
  report: WeaknessReport | null
  reportCreatedAt: string | null
  reportStale: boolean
  aiEnabled: boolean
}

/** Cùng ngưỡng với backend (TopicMastery.MIN_QUESTIONS). */
export const MIN_QUESTIONS_FOR_VERDICT = 3

export const accuracy = (m: TopicMastery) => (m.total === 0 ? 0 : m.correct / m.total)
