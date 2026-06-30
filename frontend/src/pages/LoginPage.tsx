import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/utils/cn'

type LoginMethod = 'email' | 'username'

export default function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { login } = useAuth()

  const [loginMethod, setLoginMethod] = useState<LoginMethod>('email')
  const [account, setAccount] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<{ account?: string; password?: string }>({})

  const validate = (): boolean => {
    const newErrors: { account?: string; password?: string } = {}

    if (!account.trim()) {
      newErrors.account = loginMethod === 'email' ? '请输入邮箱' : '请输入用户名'
    } else if (loginMethod === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(account.trim())) {
        newErrors.account = '邮箱格式不正确'
      }
    } else {
      if (account.trim().length < 2) {
        newErrors.account = '用户名至少 2 个字符'
      }
    }

    if (!password) {
      newErrors.password = '请输入密码'
    } else if (password.length < 8) {
      newErrors.password = '密码至少 8 个字符'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setIsSubmitting(true)
    try {
      await login({ account: account.trim(), password, remember_me: rememberMe })
      toast.success('登录成功')
      const redirectTo = searchParams.get('redirect') || '/home'
      navigate(redirectTo, { replace: true })
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response: { data?: { message?: string } } }).response?.data?.message || '登录失败'
          : '登录失败，请稍后重试'
      toast.error(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col items-center w-full">
      {/* Card container */}
      <div className="w-full bg-white/72 backdrop-blur-xl rounded-xl border border-light p-8 shadow-[0_8px_32px_rgba(0,0,0,0.04)]">
        <div className="text-center mb-8">
          <h1 className="text-headline-md text-on-surface">登录</h1>
          <p className="text-body-md text-on-surface-variant mt-1">欢迎回到 Your Rank</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
          {/* Login method toggle */}
          <div>
            <div className="flex bg-surface-container rounded-lg p-1 mb-2">
              <button
                type="button"
                onClick={() => {
                  setLoginMethod('email')
                  setAccount('')
                  setErrors({})
                }}
                className={cn(
                  'flex-1 py-2 text-body-md font-medium rounded-lg transition-colors',
                  loginMethod === 'email'
                    ? 'bg-white text-on-surface shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface',
                )}
              >
                邮箱登录
              </button>
              <button
                type="button"
                onClick={() => {
                  setLoginMethod('username')
                  setAccount('')
                  setErrors({})
                }}
                className={cn(
                  'flex-1 py-2 text-body-md font-medium rounded-lg transition-colors',
                  loginMethod === 'username'
                    ? 'bg-white text-on-surface shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface',
                )}
              >
                用户名登录
              </button>
            </div>

            <div className="relative">
              <input
                type={loginMethod === 'email' ? 'email' : 'text'}
                value={account}
                onChange={(e) => {
                  setAccount(e.target.value)
                  if (errors.account) setErrors((prev) => ({ ...prev, account: undefined }))
                }}
                placeholder={loginMethod === 'email' ? 'your@email.com' : '用户名'}
                className={cn(
                  'w-full px-4 py-3 text-body-md bg-surface-container-low rounded-lg border outline-none transition-colors',
                  'placeholder:text-on-surface-variant/50',
                  'focus:border-primary focus:ring-1 focus:ring-primary',
                  errors.account ? 'border-error' : 'border-transparent',
                )}
                autoFocus
                autoComplete="username"
              />
              {errors.account && (
                <p className="text-label-sm text-error mt-1">{errors.account}</p>
              )}
            </div>
          </div>

          {/* Password */}
          <div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }))
                }}
                placeholder="密码"
                className={cn(
                  'w-full px-4 py-3 text-body-md bg-surface-container-low rounded-lg border outline-none transition-colors pr-11',
                  'placeholder:text-on-surface-variant/50',
                  'focus:border-primary focus:ring-1 focus:ring-primary',
                  errors.password ? 'border-error' : 'border-transparent',
                )}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors"
                aria-label={showPassword ? '隐藏密码' : '显示密码'}
              >
                {showPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-label-sm text-error mt-1">{errors.password}</p>
            )}
          </div>

          {/* Remember me */}
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <div
              onClick={() => setRememberMe((v) => !v)}
              className={cn(
                'w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors',
                rememberMe
                  ? 'bg-primary border-primary'
                  : 'border-outline-variant hover:border-primary',
              )}
            >
              {rememberMe && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </div>
            <span className="text-body-md text-on-surface-variant">记住我</span>
          </label>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className={cn(
              'w-full py-3 rounded-lg text-body-md font-medium transition-all',
              'bg-primary text-on-primary',
              'hover:bg-primary-container hover:text-on-primary-container',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              isSubmitting && 'opacity-70',
            )}
          >
            {isSubmitting ? '登录中...' : '登录'}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-border-light" />
          <span className="text-label-sm text-on-surface-variant/60">或者</span>
          <div className="flex-1 h-px bg-border-light" />
        </div>

        {/* Register link */}
        <p className="text-center text-body-md text-on-surface-variant">
          还没有账号？
          <Link
            to="/register"
            className="ml-1 text-primary hover:text-primary-container transition-colors font-medium"
          >
            去注册
          </Link>
        </p>
      </div>
    </div>
  )
}
