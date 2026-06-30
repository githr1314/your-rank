import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react'
import * as authAPI from '@/services/authAPI'
import { TOKEN_KEY } from '@/utils/constants'
import type { LoginRequest, RegisterRequest, UserProfile } from '@/types'

interface AuthContextType {
  user: UserProfile | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (data: LoginRequest) => Promise<void>
  register: (data: RegisterRequest) => Promise<void>
  logout: () => void
  updateUser: (user: UserProfile) => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // 初始化：检查 localStorage 中是否有 token
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (token) {
      // Token 存在但用户信息未加载，后续页面自行获取
      // 这里仅标记加载完成，实际用户信息由各页面自行获取
      setIsLoading(false)
    } else {
      setIsLoading(false)
    }
  }, [])

  // 监听 auth-change 自定义事件
  useEffect(() => {
    const handleAuthChange = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (detail) {
        setUser(detail as UserProfile)
      } else {
        setUser(null)
      }
    }

    window.addEventListener('auth-change', handleAuthChange)
    return () => window.removeEventListener('auth-change', handleAuthChange)
  }, [])

  const login = useCallback(async (data: LoginRequest) => {
    const res = await authAPI.login(data)
    const { token, user: userData } = res.data
    localStorage.setItem(TOKEN_KEY, token)
    setUser(userData)
    window.dispatchEvent(new CustomEvent('auth-change', { detail: userData }))
  }, [])

  const register = useCallback(async (data: RegisterRequest) => {
    const res = await authAPI.register(data)
    const { token, user: userData } = res.data
    localStorage.setItem(TOKEN_KEY, token)
    setUser(userData)
    window.dispatchEvent(new CustomEvent('auth-change', { detail: userData }))
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    setUser(null)
    window.dispatchEvent(new CustomEvent('auth-change', { detail: null }))
  }, [])

  const updateUser = useCallback((updated: UserProfile) => {
    setUser(updated)
    window.dispatchEvent(new CustomEvent('auth-change', { detail: updated }))
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}
