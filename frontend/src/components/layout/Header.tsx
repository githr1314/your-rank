import { Link, useNavigate } from 'react-router-dom'
import { getUser, logout, useAuthSubscription } from '@/hooks/useAuth'
import { useEffect, useState } from 'react'
import type { User } from '@/types'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

export default function Header() {
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(getUser())

  useEffect(() => {
    return useAuthSubscription(() => setUser(getUser()))
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/home')
  }

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/home" className="flex items-center gap-2 font-bold text-xl text-brand-700">
            <span className="text-2xl">🏆</span>
            <span>Your Rank</span>
          </Link>

          {/* 导航 */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
            <Link to="/home" className="hover:text-brand-600 transition-colors">
              发现
            </Link>
            {user && (
              <>
                <Link to="/my-rankings" className="hover:text-brand-600 transition-colors">
                  我的排行
                </Link>
                <Link to="/create" className="hover:text-brand-600 transition-colors">
                  创建排行
                </Link>
              </>
            )}
          </nav>

          {/* 用户区域 */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <Link
                  to="/profile"
                  className="flex items-center gap-2 text-sm text-gray-700 hover:text-brand-600"
                >
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-brand-100 text-brand-600 font-bold text-sm">
                      {user.nickname?.charAt(0) || user.username.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline">{user.nickname || user.username}</span>
                </Link>
                <Button variant="ghost" size="sm" onClick={handleLogout} className="text-gray-400 hover:text-gray-600">
                  退出
                </Button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="outline" size="sm">登录</Button>
                </Link>
                <Link to="/register">
                  <Button size="sm">注册</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
