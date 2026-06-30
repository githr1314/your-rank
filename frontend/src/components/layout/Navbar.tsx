import { Link, useNavigate } from 'react-router-dom'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import * as Avatar from '@radix-ui/react-avatar'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/utils/cn'

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/home')
  }

  return (
    <header className="h-top-bar-height flex-shrink-0 bg-glass-bg backdrop-blur-xl border-b border-light flex items-center justify-between px-margin-edge z-40 relative">
      <div className="flex items-center gap-6">
        <Link
          to="/home"
          className="text-headline-sm font-headline-sm text-on-surface no-underline hover:opacity-80 transition-opacity"
        >
          Your Rank
        </Link>
        <nav className="flex items-center gap-5">
          <Link
            to="/home"
            className="text-body-md text-on-surface-variant hover:text-on-surface transition-colors no-underline"
          >
            发现
          </Link>
          {isAuthenticated && (
            <Link
              to="/my-rankings"
              className="text-body-md text-on-surface-variant hover:text-on-surface transition-colors no-underline"
            >
              我的排行
            </Link>
          )}
        </nav>
      </div>

      <div className="flex items-center gap-2">
        {isAuthenticated && user ? (
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button className="outline-none rounded-full hover:ring-2 hover:ring-primary/30 transition-all">
                <Avatar.Root className="w-8 h-8 rounded-full overflow-hidden bg-surface-container-high flex items-center justify-center">
                  {user.avatar_url ? (
                    <Avatar.Image
                      src={user.avatar_url}
                      alt={user.nickname || user.username}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Avatar.Fallback
                      className="w-full h-full flex items-center justify-center text-label-sm font-label-sm bg-primary text-on-primary"
                      delayMs={0}
                    >
                      {(user.nickname || user.username)?.[0]?.toUpperCase() || '?'}
                    </Avatar.Fallback>
                  )}
                </Avatar.Root>
              </button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
              <DropdownMenu.Content
                align="end"
                sideOffset={8}
                className={cn(
                  'min-w-[180px] rounded-xl p-1.5',
                  'bg-white/90 backdrop-blur-xl',
                  'shadow-[0_8px_32px_rgba(0,0,0,0.08)]',
                  'border border-light',
                  'data-[state=open]:animate-fade-in',
                )}
              >
                <div className="px-3 py-2 text-body-md text-on-surface font-medium truncate">
                  {user.nickname || user.username}
                </div>

                <DropdownMenu.Separator className="h-px bg-border-light my-1" />

                <DropdownMenu.Item
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg text-body-md text-on-surface-variant',
                    'outline-none cursor-pointer',
                    'hover:bg-surface-container hover:text-on-surface transition-colors',
                  )}
                  onClick={() => navigate('/profile')}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  个人中心
                </DropdownMenu.Item>

                <DropdownMenu.Separator className="h-px bg-border-light my-1" />

                <DropdownMenu.Item
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg text-body-md text-on-surface-variant',
                    'outline-none cursor-pointer',
                    'hover:bg-error-container hover:text-on-error-container transition-colors',
                  )}
                  onClick={handleLogout}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  退出登录
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        ) : (
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-body-md text-on-surface-variant hover:text-on-surface transition-colors no-underline"
            >
              登录
            </Link>
            <Link
              to="/register"
              className="px-4 py-1.5 rounded-lg bg-primary text-on-primary text-label-sm font-label-sm no-underline hover:bg-primary-container hover:text-on-primary-container transition-colors"
            >
              注册
            </Link>
          </div>
        )}
      </div>
    </header>
  )
}
