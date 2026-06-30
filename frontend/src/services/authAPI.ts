import http from './http'
import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  SendVerifyCodeRequest,
  SendVerifyCodeResponse,
  APIResponse,
} from '@/types'

export async function register(data: RegisterRequest): Promise<APIResponse<AuthResponse>> {
  const res = await http.post<APIResponse<AuthResponse>>('/auth/register', data)
  return res.data
}

export async function login(data: LoginRequest): Promise<APIResponse<AuthResponse>> {
  const res = await http.post<APIResponse<AuthResponse>>('/auth/login', data)
  return res.data
}

export async function sendVerifyCode(
  data: SendVerifyCodeRequest,
): Promise<APIResponse<SendVerifyCodeResponse>> {
  const res = await http.post<APIResponse<SendVerifyCodeResponse>>('/auth/send-verify-code', data)
  return res.data
}
