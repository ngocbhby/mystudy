import axios, { type AxiosRequestConfig } from 'axios'
import { env } from '@/config/env'
import { toApiError } from './api-error'
import type { ApiEnvelope } from './types'

const SESSION_URL = '/api/session'
const SAFE_METHODS = new Set(['get', 'head', 'options'])

export const http = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: env.apiTimeoutMs,
  withCredentials: true,
  headers: { Accept: 'application/json' },
  // Axios tự đọc cookie XSRF-TOKEN và gửi lại qua header X-XSRF-TOKEN cho yêu cầu cùng origin.
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',
})

const hasCsrfCookie = () => document.cookie.split('; ').some((c) => c.startsWith('XSRF-TOKEN='))

/** Yêu cầu ghi đầu tiên có thể xảy ra trước khi cookie CSRF tồn tại: lấy cookie trước khi gửi. */
http.interceptors.request.use(async (config) => {
  if (!SAFE_METHODS.has((config.method ?? 'get').toLowerCase()) && !hasCsrfCookie()) {
    await http.get(SESSION_URL)
  }
  return config
})

type UnauthenticatedListener = () => void
const listeners = new Set<UnauthenticatedListener>()

/** Đăng ký hàm gọi khi API trả 401 UNAUTHENTICATED (phiên hết hạn) để xóa cache và đưa về đăng nhập. */
export function onUnauthenticated(listener: UnauthenticatedListener) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

http.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    const apiError = toApiError(error)
    const url = (error as { config?: { url?: string } }).config?.url
    if (apiError.code === 'UNAUTHENTICATED' && url !== SESSION_URL) listeners.forEach((l) => l())
    return Promise.reject(apiError)
  },
)

async function request<T>(config: AxiosRequestConfig): Promise<T> {
  const response = await http.request<ApiEnvelope<T> | ''>(config)
  const body = response.data
  return (typeof body === 'object' && body !== null ? body.data : undefined) as T
}

/** Điểm vào duy nhất để gọi API: tự gỡ khung ApiResponse và trả về `data`; lỗi luôn là ApiError. */
export const api = {
  get: <T>(url: string, config?: AxiosRequestConfig) => request<T>({ ...config, method: 'GET', url }),
  post: <T>(url: string, body?: unknown, config?: AxiosRequestConfig) =>
    request<T>({ ...config, method: 'POST', url, data: body }),
  put: <T>(url: string, body?: unknown, config?: AxiosRequestConfig) =>
    request<T>({ ...config, method: 'PUT', url, data: body }),
  delete: <T>(url: string, config?: AxiosRequestConfig) => request<T>({ ...config, method: 'DELETE', url }),
}
