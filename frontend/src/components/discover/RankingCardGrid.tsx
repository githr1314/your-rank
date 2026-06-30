import type { RankingCardResponse } from '@/types'
import { RankingCard, RankingCardSkeleton } from './RankingCard'
import { EmptyState } from '@/components/shared'
import { cn } from '@/utils/cn'

interface RankingCardGridProps {
  rankings: RankingCardResponse[]
  loading: boolean
  initialLoading: boolean
  hasMore: boolean
  error: string | null
  isEmpty: boolean
  onRetry: () => void
}

/**
 * 排行榜卡片网格。
 * 4 列网格布局，支持无限滚动哨兵、加载骨架屏、空状态、错误重试。
 */
export function RankingCardGrid({
  rankings,
  loading,
  initialLoading,
  hasMore,
  error,
  isEmpty,
  onRetry,
}: RankingCardGridProps) {
  // 初始加载中 — 显示 8 个骨架屏
  if (initialLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <RankingCardSkeleton key={`skeleton-${i}`} />
        ))}
      </div>
    )
  }

  // 搜索无结果 — 空状态
  if (isEmpty && !loading) {
    return (
      <div className="py-16">
        <EmptyState
          text="没有找到排行榜，试试其他关键词或分类"
          icon={
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
              <line x1="8" y1="11" x2="14" y2="11" />
            </svg>
          }
        />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* 卡片网格 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {rankings.map((ranking) => (
          <RankingCard key={ranking.id} ranking={ranking} />
        ))}

        {/* 加载更多时的骨架屏 */}
        {loading &&
          Array.from({ length: 4 }).map((_, i) => (
            <RankingCardSkeleton key={`skeleton-more-${i}`} />
          ))}
      </div>

      {/* 错误状态 */}
      {error && (
        <div className="flex flex-col items-center gap-3 py-8">
          <p className="text-body-md text-on-surface-variant">{error}</p>
          <button
            type="button"
            onClick={onRetry}
            className={cn(
              'px-5 py-2 rounded-lg',
              'bg-primary text-on-primary text-label-sm font-label-sm',
              'hover:bg-primary-container hover:text-on-primary-container',
              'transition-colors duration-200',
            )}
          >
            重试
          </button>
        </div>
      )}

      {/* 全部加载完毕 */}
      {!hasMore && rankings.length > 0 && !loading && (
        <div className="flex items-center justify-center gap-2 py-6 text-label-sm text-on-surface-variant/50">
          <div className="w-8 h-px bg-border-light" />
          <span>已加载全部</span>
          <div className="w-8 h-px bg-border-light" />
        </div>
      )}
    </div>
  )
}
