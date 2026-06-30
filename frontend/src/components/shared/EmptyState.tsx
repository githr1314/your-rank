import { type ReactNode } from 'react'
import { cn } from '@/utils/cn'

export interface EmptyStateProps {
  icon?: ReactNode
  text?: string
  className?: string
}

/**
 * 空状态占位提示。
 * 用于空行、空列表、搜索无结果等场景。
 * 默认虚线边框 + 提示文字。
 */
export function EmptyState({ icon, text = '暂无内容', className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 px-6 py-8',
        'border-2 border-dashed border-outline-variant rounded-xl',
        'bg-surface-container-low/20',
        'transition-colors',
        className,
      )}
    >
      {icon && (
        <div className="text-outline-variant/60">
          {icon}
        </div>
      )}
      <p className="text-body-md text-on-surface-variant text-center leading-relaxed">
        {text}
      </p>
    </div>
  )
}

/**
 * 拖拽放置区专用的空状态 — 虚线提示 + 默认拖拽文案。
 */
export function DroppableEmptyState({ className }: { className?: string }) {
  return (
    <EmptyState
      text="拖拽条目到此处"
      className={className}
      icon={
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
      }
    />
  )
}
