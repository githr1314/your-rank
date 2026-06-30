export interface RegisterRequest {
  username: string
  email: string
  password: string
  verify_code: string
}

export interface LoginRequest {
  account: string
  password: string
  remember_me?: boolean
}

export interface AuthResponse {
  token: string
  user: UserProfile
}

export interface UserProfile {
  id: string
  username: string
  email: string
  nickname: string
  avatar_url: string
  bio: string
  last_login_at: string | null
}

export interface SendVerifyCodeRequest {
  email: string
}

export interface SendVerifyCodeResponse {
  message: string
  expires_in: number
}
