/** Khung phản hồi chung của backend (ApiResponse). */
export interface ApiEnvelope<T> {
  success: boolean
  code: string
  message: string
  data?: T
  errors?: Record<string, string>
  requestId?: string
  timestamp: string
}
