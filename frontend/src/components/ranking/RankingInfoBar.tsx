import { useState } from 'react'
import { cn } from '@/utils/cn'
import { VISIBILITY_OPTIONS, CATEGORIES } from '@/utils/constants'
import type { CategoryEnum, VisibilityEnum } from '@/types'

export interface RankingInfoBarProps {
  title: string
  category: string
  visibility: string
  onTitleChange: (title: string) => void
  onCategoryChange: (category: CategoryEnum) => void
  onVisibilityChange: (visibility: VisibilityEnum) => void
}

/**
 * 排行信息栏 — 可折叠。
 * 显示标题输入框、分类选择、可见范围切换。
 */
export function RankingInfoBar({
  title,
  category,
  visibility,
  onTitleChange,
  onCategoryChange,
  onVisibilityChange,
}: RankingInfoBarProps) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <section
      className={cn(
        'flex-shrink-0 border-b border-light/50 relative z-40',
        'bg-surface/50 backdrop-blur-sm',
        collapsed ? 'h-10' : 'min-h-[60px]',
      )}
    >
      <div className="flex items-center justify-between px-margin-edge h-10">
        {collapsed ? (
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="text-body-md font-medium text-on-surface truncate">
              {title || '未命名排行'}
            </span>
            <CategoryBadge category={category} />
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-3 py-2 flex-1">
            {/* Title */}
            <input
              type="text"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder="排行榜标题"
              maxLength={100}
              className={cn(
                'flex-1 min-w-[160px] max-w-md px-3 py-1.5 rounded-lg',
                'border border-outline-variant bg-surface-container-lowest',
                'text-body-md text-on-surface outline-none',
                'placeholder:text-on-surface-variant/50',
                'transition-colors focus:border-primary focus:ring-1 focus:ring-primary/20',
              )}
            />

            {/* Category */}
            <select
              value={category}
              onChange={(e) => onCategoryChange(e.target.value as CategoryEnum)}
              className={cn(
                'px-2.5 py-1.5 rounded-lg',
                'border border-outline-variant bg-surface-container-lowest',
                'text-label-sm font-label-sm text-on-surface outline-none',
                'transition-colors focus:border-primary focus:ring-1 focus:ring-primary/20',
              )}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            {/* Visibility */}
            <div className="flex items-center gap-1.5">
              {VISIBILITY_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  onClick={() => onVisibilityChange(opt as VisibilityEnum)}
                  className={cn(
                    'px-2.5 py-1 rounded-lg text-label-sm font-label-sm transition-colors',
                    visibility === opt
                      ? 'bg-primary text-on-primary'
                      : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high',
                  )}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Toggle collapse */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            'w-8 h-8 flex items-center justify-center rounded-full',
            'hover:bg-surface-variant/50 transition-colors text-on-surface-variant',
            'flex-shrink-0',
          )}
          aria-label={collapsed ? '展开' : '折叠'}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={cn('transition-transform', collapsed && 'rotate-180')}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </div>
    </section>
  )
}

function CategoryBadge({ category }: { category: string }) {
  return (
    <span
      className={cn(
        'px-2 py-0.5 rounded text-[10px] font-bold tracking-wider',
        'bg-surface-container-high border border-border-light',
        'text-on-surface-variant uppercase',
      )}
    >
      {category}
    </span>
  )
}
