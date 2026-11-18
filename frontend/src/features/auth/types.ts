export interface User {
  id: string
  email: string | null
  displayName: string | null
  role?: string
}

export interface Session {
  user: User | null
  googleEnabled: boolean
}

export interface Credentials {
  email: string
  password: string
  confirmPassword?: string
}

export interface ResetPasswordPayload {
  email: string
  newPassword: string
  confirmPassword: string
}
