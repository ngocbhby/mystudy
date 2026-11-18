import { api } from '@/lib/http/client'
import type { Credentials, ResetPasswordPayload, Session, User } from '../types'

export const authApi = {
  getSession: () => api.get<Session>('/api/session'),
  login: (credentials: Credentials) => api.post<User>('/api/auth/login', credentials),
  register: (credentials: Credentials) => api.post<User>('/api/auth/register', credentials),
  resetPassword: (payload: ResetPasswordPayload) => api.post<void>('/api/auth/reset-password', payload),
  logout: () => api.post<void>('/api/auth/logout'),
  /** Đăng nhập Google là điều hướng toàn trang (OAuth2 authorization code + PKCE xử lý ở backend). */
  googleLoginUrl: '/api/auth/oauth2/google',
}
