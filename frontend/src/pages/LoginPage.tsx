import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { login } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

export default function LoginPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ account: '', password: '', remember_me: false })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.account || !form.password) {
      toast.error('请填写账号和密码')
      return
    }
    setLoading(true)
    try {
      await login(form)
      toast.success('登录成功')
      navigate('/home')
    } catch (err: any) {
      toast.error(err.response?.data?.message || '登录失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">欢迎回来</h1>
          <p className="mt-2 text-sm text-gray-500">登录你的 Your Rank 账号</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="account">邮箱或用户名</Label>
            <Input
              id="account"
              type="text"
              placeholder="输入邮箱或用户名"
              value={form.account}
              onChange={(e) => setForm({ ...form, account: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">密码</Label>
            <Input
              id="password"
              type="password"
              placeholder="输入密码"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>

          <div className="flex items-center">
            <input
              id="remember"
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
              checked={form.remember_me}
              onChange={(e) => setForm({ ...form, remember_me: e.target.checked })}
            />
            <Label htmlFor="remember" className="ml-2 text-sm text-gray-500 font-normal">
              记住我（7天内免登录）
            </Label>
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? '登录中...' : '登录'}
          </Button>

          <p className="text-center text-sm text-gray-500">
            还没有账号？
            <Link to="/register" className="text-brand-600 hover:text-brand-700 font-medium ml-1">
              立即注册
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
