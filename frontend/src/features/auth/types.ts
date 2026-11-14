export interface User {
  id: string
  email: string | null
  displayName: string | null
}

export interface Session {
  user: User | null
  googleEnabled: boolean
}

export interface Credentials {
  email: string
  password: string
}
