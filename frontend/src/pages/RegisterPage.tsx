import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register as registerUser } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.username || !form.email || !form.password) {
      toast.error('请填写所有必填字段')
      return
    }
    if (form.username.length < 2 || form.username.length > 20) {
      toast.error('用户名需 2-20 个字符')
      return
    }
    if (form.password.length < 8 || form.password.length > 32) {
      toast.error('密码需 8-32 个字符')
      return
    }
    setLoading(true)
    try {
      await registerUser(form)
      toast.success('注册成功')
      navigate('/home')
    } catch (err: any) {
      toast.error(err.response?.data?.message || '注册失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">创建账号</h1>
          <p className="mt-2 text-sm text-gray-500">加入 Your Rank，开始你的排行之旅</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">用户名 *</Label>
            <Input
              id="username"
              type="text"
              placeholder="2-20字符，中英文、数字、下划线"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">邮箱 *</Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">密码 *</Label>
            <Input
              id="password"
              type="password"
              placeholder="8-32字符，包含字母和数字"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? '注册中...' : '注册'}
          </Button>

          <p className="text-center text-sm text-gray-500">
            已有账号？
            <Link to="/login" className="text-brand-600 hover:text-brand-700 font-medium ml-1">
              去登录
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
