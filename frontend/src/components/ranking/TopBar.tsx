import { Link, useNavigate } from 'react-router-dom'
import { cn } from '@/utils/cn'

export interface TopBarProps {
  title: string
  rankingId: string
  shareCode: string
  onDelete: () => void
}

/**
 * 顶部导航栏。
 * ← 返回按钮 + 面包屑 + 排行标题 + 分享按钮 + 更多菜单（删除）
 */
export function TopBar({ title, rankingId: _rankingId, shareCode, onDelete }: TopBarProps) {
  const navigate = useNavigate()

  const handleShare = () => {
    const shareUrl = `${window.location.origin}/s/${shareCode}`
    navigator.clipboard.writeText(shareUrl).then(
      () => {
        // Will be replaced by toast in the page
        console.log('分享链接已复制')
      },
      () => {
        // Fallback: show the URL
        console.log(shareUrl)
      },
    )
  }

  return (
    <header
      className={cn(
        'h-top-bar-height flex-shrink-0',
        'bg-glass-bg backdrop-blur-md',
        'border-b border-light',
        'flex justify-between items-center px-margin-edge',
        'z-50 relative',
      )}
    >
      {/* Left: back + breadcrumb + title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={() => navigate(-1)}
          className={cn(
            'w-10 h-10 flex items-center justify-center rounded-full',
            'hover:bg-surface-variant/50 transition-colors',
            'text-on-surface-variant flex-shrink-0',
          )}
          aria-label="返回"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="group-hover:-translate-x-1 transition-transform"
          >
            <path d="M19 12H5" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </button>

        <div className="flex items-center gap-2 min-w-0">
          <Link
            to="/my-rankings"
            className="text-label-sm font-label-sm text-on-surface-variant hover:text-on-surface transition-colors no-underline whitespace-nowrap hidden sm:inline"
          >
            我的排行
          </Link>
          <span className="text-on-surface-variant/40 hidden sm:inline">/</span>
          <h1
            className={cn(
              'text-headline-sm font-headline-sm text-on-surface',
              'tracking-tight truncate',
            )}
          >
            {title}
          </h1>
        </div>
      </div>

      {/* Right: share + more menu */}
      <div className="flex items-center gap-1 text-on-surface-variant">
        <button
          onClick={handleShare}
          className={cn(
            'w-10 h-10 flex items-center justify-center rounded-full',
            'hover:bg-surface-variant/50 transition-colors',
          )}
          aria-label="分享"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
        </button>

        <button
          onClick={onDelete}
          className={cn(
            'w-10 h-10 flex items-center justify-center rounded-full',
            'hover:bg-error-container hover:text-error transition-colors',
          )}
          aria-label="删除排行"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 6h18" />
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
          </svg>
        </button>
      </div>
    </header>
  )
}
