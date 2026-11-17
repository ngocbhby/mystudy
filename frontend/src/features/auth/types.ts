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
}
