import type { User } from '@/types'
import { authAPI } from '@/services/api'
import type { LoginRequest, RegisterRequest } from '@/types'

// 简单全局状态（如需要可替换为 zustand，此处用 React Context 模式已足够）
// 但为保持简单先做一个基于 localStorage + 全局事件的 hook
export function getUser(): User | null {
  const raw = localStorage.getItem('user')
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function getToken(): string | null {
  return localStorage.getItem('token')
}

export function isAuthenticated(): boolean {
  return !!getToken()
}

export async function login(data: LoginRequest) {
  const res = await authAPI.login(data)
  const { token, user } = res.data.data
  localStorage.setItem('token', token)
  localStorage.setItem('user', JSON.stringify(user))
  window.dispatchEvent(new Event('auth-change'))
}

export async function register(data: RegisterRequest) {
  const res = await authAPI.register(data)
  const { token, user } = res.data.data
  localStorage.setItem('token', token)
  localStorage.setItem('user', JSON.stringify(user))
  window.dispatchEvent(new Event('auth-change'))
}

export function logout() {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  window.dispatchEvent(new Event('auth-change'))
}

export function useAuthSubscription(callback: () => void) {
  if (typeof window !== 'undefined') {
    window.addEventListener('auth-change', callback)
    return () => window.removeEventListener('auth-change', callback)
  }
  return () => {}
}
