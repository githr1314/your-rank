import type { EntryResponse } from '@/types'
import { cn } from '@/utils/cn'

export interface EntryCardReadonlyProps {
  entry: EntryResponse
  className?: string
}

/**
 * 只读条目卡片 — 纯展示，无拖拽交互。
 * 展示配图（可选）和名称，等级徽章在父组件 TierRowReadonly 中统一展示。
 */
export function EntryCardReadonly({ entry, className }: EntryCardReadonlyProps) {
  return (
    <div
      className={cn(
        'flex-shrink-0 w-28 sm:w-32 rounded-xl bg-surface-container-lowest border border-border-light overflow-hidden',
        'transition-shadow hover:shadow-card-hover',
        className,
      )}
    >
      {/* Image area */}
      <div className="w-full aspect-[4/3] overflow-hidden bg-surface-container-high">
        {entry.image_url ? (
          <img
            src={entry.image_url}
            alt={entry.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="text-outline-variant"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </div>
        )}
      </div>

      {/* Name */}
      <div className="px-2 py-1.5">
        <p className="text-label-sm text-on-surface font-medium truncate" title={entry.name}>
          {entry.name}
        </p>
      </div>
    </div>
  )
}
