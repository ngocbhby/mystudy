import { AxiosError } from 'axios'
import type { ApiEnvelope } from './types'

export type ApiErrorCode =
  | 'BAD_REQUEST'
  | 'VALIDATION_FAILED'
  | 'UNAUTHENTICATED'
  | 'BAD_CREDENTIALS'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'METHOD_NOT_ALLOWED'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR'
  | 'SERVICE_UNAVAILABLE'
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  | 'UNKNOWN'

const NETWORK_MESSAGE = 'Không thể kết nối với máy chủ. Vui lòng thử lại.'

/** Lỗi thống nhất cho mọi lời gọi API: giao diện chỉ làm việc với lớp này, không với AxiosError. */
export class ApiError extends Error {
  constructor(
    readonly code: ApiErrorCode,
    message: string,
    readonly status: number = 0,
    readonly fieldErrors: Record<string, string> = {},
    readonly requestId?: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }

  get isClientError() {
    return this.status >= 400 && this.status < 500
  }
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error
  if (error instanceof AxiosError) {
    if (error.code === 'ERR_CANCELED') return new ApiError('UNKNOWN', 'Yêu cầu đã bị hủy.')
    if (error.code === 'ECONNABORTED') return new ApiError('TIMEOUT', NETWORK_MESSAGE)
    const body = error.response?.data as Partial<ApiEnvelope<unknown>> | undefined
    if (error.response && body && typeof body === 'object' && typeof body.code === 'string') {
      return new ApiError(
        body.code as ApiErrorCode,
        body.message ?? NETWORK_MESSAGE,
        error.response.status,
        body.errors ?? {},
        body.requestId,
      )
    }
    if (!error.response) return new ApiError('NETWORK_ERROR', NETWORK_MESSAGE)
    return new ApiError('UNKNOWN', 'Không thể xử lý yêu cầu. Vui lòng thử lại.', error.response.status)
  }
  return new ApiError('UNKNOWN', 'Đã xảy ra lỗi. Vui lòng thử lại.')
}
