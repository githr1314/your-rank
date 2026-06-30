import { Link } from 'react-router-dom'
import type { RankingCardResponse } from '@/types'
import { cn } from '@/utils/cn'

interface RankingCardProps {
  ranking: RankingCardResponse
}

/** 各等级对应的显示色值 */
const TIER_STYLES: Record<string, { bg: string; text: string }> = {
  S: { bg: '#FFD700', text: '#ffffff' },
  A: { bg: '#FF3B30', text: '#ffffff' },
  B: { bg: '#AF52DE', text: '#ffffff' },
  C: { bg: '#48484A', text: '#ffffff' },
  D: { bg: '#AEAEB2', text: '#ffffff' },
} as const

const TIER_LABELS = ['S', 'A', 'B', 'C', 'D'] as const

/**
 * 排行榜卡片。
 * 展示封面缩略图、标题、条目数、浏览数、等级分布。
 * 可点击跳转到排行详情页。
 */
export function RankingCard({ ranking }: RankingCardProps) {
  const hasTiers = ranking.tier_summary &&
    TIER_LABELS.some((t) => (ranking.tier_summary[t] ?? 0) > 0)

  return (
    <Link
      to={`/ranking/${ranking.id}`}
      className={cn(
        'group block rounded-xl overflow-hidden',
        'bg-surface-container-lowest border border-light',
        'shadow-sm hover:shadow-card-hover',
        'transition-all duration-300',
      )}
    >
      {/* 封面图区域 */}
      <div className="aspect-[16/9] overflow-hidden bg-surface-container-high">
        {ranking.cover_url ? (
          <img
            src={ranking.cover_url}
            alt={ranking.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-fixed to-primary-fixed-dim">
            <span className="text-display-lg font-display-lg text-primary/15 select-none">
              YR
            </span>
          </div>
        )}
      </div>

      {/* 卡身信息 */}
      <div className="p-4 space-y-2">
        {/* 标题 */}
        <h3
          className={cn(
            'text-body-md text-on-surface font-medium',
            'line-clamp-1 group-hover:text-primary',
            'transition-colors duration-200',
          )}
          title={ranking.title}
        >
          {ranking.title}
        </h3>

        {/* 统计信息 */}
        <div className="flex items-center gap-3 text-label-sm text-on-surface-variant">
          <span className="flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
            </svg>
            {ranking.entry_count} 条目
          </span>

          <span className="flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            {ranking.view_count}
          </span>

          {/* 分类标签 */}
          {ranking.category && (
            <span className="ml-auto px-1.5 py-0.5 rounded bg-surface-container text-[11px] text-on-surface-variant/70">
              {ranking.category}
            </span>
          )}
        </div>

        {/* 等级分布 */}
        {hasTiers && (
          <div className="flex gap-1.5 pt-0.5">
            {TIER_LABELS.map((tier) => {
              const count = ranking.tier_summary?.[tier]
              if (!count || count === 0) return null

              return (
                <div
                  key={tier}
                  className="flex items-center gap-1"
                  title={`${tier} 等级: ${count} 条目`}
                >
                  <span
                    className="w-4 h-4 rounded-sm flex items-center justify-center text-[10px] font-bold"
                    style={{
                      backgroundColor: TIER_STYLES[tier].bg,
                      color: TIER_STYLES[tier].text,
                    }}
                  >
                    {tier}
                  </span>
                  <span className="text-[11px] text-on-surface-variant/60 font-medium">
                    {count}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </Link>
  )
}

/**
 * 卡片骨架屏 — 加载中占位。
 */
export function RankingCardSkeleton() {
  return (
    <div className="rounded-xl overflow-hidden bg-surface-container-lowest border border-light animate-pulse">
      <div className="aspect-[16/9] bg-surface-container-high" />
      <div className="p-4 space-y-3">
        <div className="h-4 w-3/4 rounded bg-surface-container" />
        <div className="h-3 w-1/2 rounded bg-surface-container" />
        <div className="flex gap-2 pt-1">
          <div className="w-4 h-4 rounded-sm bg-surface-container" />
          <div className="w-4 h-4 rounded-sm bg-surface-container" />
          <div className="w-4 h-4 rounded-sm bg-surface-container" />
        </div>
      </div>
    </div>
  )
}
