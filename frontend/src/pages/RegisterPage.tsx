import { useState, useRef, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '@/hooks/useAuth'
import * as authAPI from '@/services/authAPI'
import { cn } from '@/utils/cn'

interface FormErrors {
  username?: string
  email?: string
  password?: string
  verify_code?: string
}

export default function RegisterPage() {
  const navigate = useNavigate()
  const { register } = useAuth()

  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [verifyCode, setVerifyCode] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [countdown, setCountdown] = useState(0)
  const [isSendingCode, setIsSendingCode] = useState(false)
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const [errors, setErrors] = useState<FormErrors>({})

  // ── 表单校验 ──

  const validateUsername = (val: string): string | undefined => {
    if (!val.trim()) return '请输入用户名'
    if (val.trim().length < 2 || val.trim().length > 20) return '用户名长度 2-20 个字符'
    const usernameRegex = /^[一-龥a-zA-Z0-9_]{2,20}$/
    if (!usernameRegex.test(val.trim())) return '仅限中英文、数字、下划线'
    return undefined
  }

  const validateEmail = (val: string): string | undefined => {
    if (!val.trim()) return '请输入邮箱'
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(val.trim())) return '邮箱格式不正确'
    return undefined
  }

  const validatePassword = (val: string): string | undefined => {
    if (!val) return '请输入密码'
    if (val.length < 8 || val.length > 32) return '密码长度 8-32 个字符'
    const hasLetter = /[a-zA-Z]/.test(val)
    const hasDigit = /\d/.test(val)
    if (!hasLetter || !hasDigit) return '密码需包含字母和数字'
    return undefined
  }

  const validateVerifyCode = (val: string): string | undefined => {
    if (!val.trim()) return '请输入验证码'
    if (!/^\d{6}$/.test(val.trim())) return '验证码为 6 位数字'
    return undefined
  }

  const validateAll = (): boolean => {
    const newErrors: FormErrors = {
      username: validateUsername(username),
      email: validateEmail(email),
      password: validatePassword(password),
      verify_code: validateVerifyCode(verifyCode),
    }
    // Remove undefined entries
    const cleaned: FormErrors = {}
    for (const [key, val] of Object.entries(newErrors)) {
      if (val) cleaned[key as keyof FormErrors] = val
    }
    setErrors(cleaned)
    return Object.keys(cleaned).length === 0
  }

  // ── 发送验证码 ──

  const handleSendCode = async () => {
    const emailErr = validateEmail(email)
    if (emailErr) {
      setErrors((prev) => ({ ...prev, email: emailErr }))
      return
    }
    setErrors((prev) => ({ ...prev, email: undefined }))

    setIsSendingCode(true)
    try {
      await authAPI.sendVerifyCode({ email: email.trim() })
      toast.success('验证码已发送')
      startCountdown()
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response: { data?: { message?: string } } }).response?.data?.message || '发送失败'
          : '发送失败，请稍后重试'
      toast.error(msg)
    } finally {
      setIsSendingCode(false)
    }
  }

  const startCountdown = () => {
    setCountdown(60)
    if (countdownRef.current) clearInterval(countdownRef.current)
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (countdownRef.current) clearInterval(countdownRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  // ── 提交注册 ──

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!validateAll()) return

    setIsSubmitting(true)
    try {
      await register({
        username: username.trim(),
        email: email.trim(),
        password,
        verify_code: verifyCode.trim(),
      })
      toast.success('注册成功')
      navigate('/home', { replace: true })
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response: { data?: { message?: string } } }).response?.data?.message || '注册失败'
          : '注册失败，请稍后重试'
      toast.error(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── 输入清错 ──

  const clearError = (field: keyof FormErrors) => {
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  return (
    <div className="flex flex-col items-center w-full">
      {/* Card container */}
      <div className="w-full bg-white/72 backdrop-blur-xl rounded-xl border border-light p-8 shadow-[0_8px_32px_rgba(0,0,0,0.04)]">
        <div className="text-center mb-8">
          <h1 className="text-headline-md text-on-surface">注册</h1>
          <p className="text-body-md text-on-surface-variant mt-1">创建 Your Rank 账号</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
          {/* Username */}
          <div>
            <input
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value)
                clearError('username')
              }}
              placeholder="用户名"
              className={cn(
                'w-full px-4 py-3 text-body-md bg-surface-container-low rounded-lg border outline-none transition-colors',
                'placeholder:text-on-surface-variant/50',
                'focus:border-primary focus:ring-1 focus:ring-primary',
                errors.username ? 'border-error' : 'border-transparent',
              )}
              autoFocus
              autoComplete="username"
            />
            {errors.username && (
              <p className="text-label-sm text-error mt-1.5">{errors.username}</p>
            )}
            <p className="text-label-sm text-on-surface-variant/60 mt-1">2-20 个字符，中英文、数字或下划线</p>
          </div>

          {/* Email */}
          <div>
            <div className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  clearError('email')
                }}
                placeholder="邮箱"
                className={cn(
                  'flex-1 px-4 py-3 text-body-md bg-surface-container-low rounded-lg border outline-none transition-colors',
                  'placeholder:text-on-surface-variant/50',
                  'focus:border-primary focus:ring-1 focus:ring-primary',
                  errors.email ? 'border-error' : 'border-transparent',
                )}
                autoComplete="email"
              />
              <button
                type="button"
                onClick={handleSendCode}
                disabled={isSendingCode || countdown > 0}
                className={cn(
                  'px-4 py-3 rounded-lg text-label-sm font-medium whitespace-nowrap transition-colors',
                  countdown > 0 || isSendingCode
                    ? 'bg-surface-container-high text-on-surface-variant/50 cursor-not-allowed'
                    : 'bg-primary text-on-primary hover:bg-primary-container hover:text-on-primary-container',
                )}
              >
                {isSendingCode ? '发送中...' : countdown > 0 ? `${countdown}s` : '发送验证码'}
              </button>
            </div>
            {errors.email && (
              <p className="text-label-sm text-error mt-1.5">{errors.email}</p>
            )}
          </div>

          {/* Verify code */}
          <div>
            <input
              type="text"
              inputMode="numeric"
              value={verifyCode}
              onChange={(e) => {
                setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))
                clearError('verify_code')
              }}
              placeholder="验证码（6 位数字）"
              className={cn(
                'w-full px-4 py-3 text-body-md bg-surface-container-low rounded-lg border outline-none transition-colors tracking-widest',
                'placeholder:text-on-surface-variant/50 placeholder:tracking-normal',
                'focus:border-primary focus:ring-1 focus:ring-primary',
                errors.verify_code ? 'border-error' : 'border-transparent',
              )}
              autoComplete="one-time-code"
            />
            {errors.verify_code && (
              <p className="text-label-sm text-error mt-1.5">{errors.verify_code}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  clearError('password')
                }}
                placeholder="密码"
                className={cn(
                  'w-full px-4 py-3 text-body-md bg-surface-container-low rounded-lg border outline-none transition-colors pr-11',
                  'placeholder:text-on-surface-variant/50',
                  'focus:border-primary focus:ring-1 focus:ring-primary',
                  errors.password ? 'border-error' : 'border-transparent',
                )}
                autoComplete="new-password"
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
              <p className="text-label-sm text-error mt-1.5">{errors.password}</p>
            )}
            <p className="text-label-sm text-on-surface-variant/60 mt-1">8-32 个字符，需包含字母和数字</p>
          </div>

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
            {isSubmitting ? '注册中...' : '注册'}
          </button>
        </form>

        {/* Login link */}
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-border-light" />
          <span className="text-label-sm text-on-surface-variant/60">或者</span>
          <div className="flex-1 h-px bg-border-light" />
        </div>

        <p className="text-center text-body-md text-on-surface-variant">
          已有账号？
          <Link
            to="/login"
            className="ml-1 text-primary hover:text-primary-container transition-colors font-medium"
          >
            去登录
          </Link>
        </p>
      </div>
    </div>
  )
}
