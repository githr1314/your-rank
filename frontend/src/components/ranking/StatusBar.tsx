import { cn } from '@/utils/cn'

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export interface StatusBarProps {
  saveStatus: SaveStatus
  isDirty: boolean
  entryCount: number
}

/**
 * 底部状态栏。
 * 显示条目总数和保存状态。
 * 不直接渲染在页面底部，而是作为固定 footer 的一部分。
 */
export function StatusBar({ saveStatus, isDirty, entryCount }: StatusBarProps) {
  return (
    <footer
      className={cn(
        'h-status-bar-height flex-shrink-0',
        'bg-surface-variant',
        'flex items-center justify-between',
        'px-margin-edge border-t border-light',
        'relative z-50',
      )}
    >
      {/* Left: hint */}
      <div className="flex items-center gap-2 text-on-surface-variant">
        <span className="text-[11px] font-label-sm">拖拽条目进行排序</span>
      </div>

      {/* Right: save status */}
      <div className="flex items-center gap-3">
        {/* Entry count */}
        <span className="text-[11px] font-label-sm text-on-surface-variant">
          共 {entryCount} 项
        </span>

        {/* Save status indicator */}
        <div
          className={cn(
            'flex items-center gap-1.5 px-2 py-0.5 rounded',
            'text-label-sm font-label-sm font-medium',
            saveStatus === 'saved' && 'text-surface-tint bg-primary/10',
            saveStatus === 'saving' && 'text-on-surface-variant bg-surface-container-high',
            saveStatus === 'error' && 'text-error bg-error-container',
            saveStatus === 'idle' && isDirty && 'text-on-surface-variant bg-surface-container-high',
            saveStatus === 'idle' && !isDirty && 'text-on-surface-variant/50',
          )}
        >
          {/* Icon */}
          {saveStatus === 'saving' && (
            <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
              <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
          )}
          {saveStatus === 'saved' && (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          )}
          {saveStatus === 'error' && (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          )}
          {(saveStatus === 'idle' && isDirty) && (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          )}

          {/* Text */}
          {saveStatus === 'saving' && '保存中...'}
          {saveStatus === 'saved' && '已保存'}
          {saveStatus === 'error' && '保存失败'}
          {saveStatus === 'idle' && isDirty && '未保存'}
          {saveStatus === 'idle' && !isDirty && '已就绪'}
        </div>
      </div>
    </footer>
  )
}
