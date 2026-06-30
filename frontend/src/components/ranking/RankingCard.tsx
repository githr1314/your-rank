import { useNavigate } from 'react-router-dom'
import { cn } from '@/utils/cn'
import type { RankingCardResponse } from '@/types'

export interface RankingCardProps {
  ranking: RankingCardResponse
  onDelete?: (id: string) => void
  showActions?: boolean
}

/** Tier 等级色映射 */
const TIER_COLORS: Record<string, string> = {
  S: 'bg-tier-s',
  A: 'bg-tier-a-crimson',
  B: 'bg-tier-b-electric-purple',
  C: 'bg-tier-c-graphite',
  D: 'bg-tier-d-soft-gray',
}

const TIER_ORDER = ['S', 'A', 'B', 'C', 'D']

/**
 * 排行榜卡片组件。
 * 展示封面缩略图、标题、条目总数、等级分布概览、浏览热度。
 * 可用于发现页卡片网格和我的排行榜页。
 */
export function RankingCard({ ranking, onDelete, showActions = false }: RankingCardProps) {
  const navigate = useNavigate()

  const handleClick = () => {
    navigate(`/ranking/${ranking.id}`)
  }

  const handleManage = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigate(`/ranking/${ranking.id}/manage`)
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDelete?.(ranking.id)
  }

  const tierSummary = ranking.tier_summary || {}
  const totalTiered = TIER_ORDER.reduce((sum, t) => sum + (tierSummary[t] || 0), 0)
  const hasTierData = totalTiered > 0

  return (
    <div
      onClick={handleClick}
      className={cn(
        'group relative flex flex-col rounded-xl overflow-hidden',
        'bg-surface-container-lowest border border-border-light',
        'cursor-pointer transition-all duration-200',
        'hover:shadow-card-hover hover:-translate-y-0.5',
      )}
    >
      {/* 封面图区域 */}
      <div className="relative aspect-[16/10] bg-surface-container overflow-hidden">
        {ranking.cover_url ? (
          <img
            src={ranking.cover_url}
            alt={ranking.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.2"
              className="text-outline-variant/50"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </div>
        )}

        {/* 操作按钮 — hover 显示 */}
        {showActions && (
          <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleManage}
              className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/80 backdrop-blur-sm text-on-surface-variant hover:text-primary hover:bg-white transition-colors"
              title="管理排行"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
            <button
              onClick={handleDelete}
              className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/80 backdrop-blur-sm text-on-surface-variant hover:text-error hover:bg-error-container transition-colors"
              title="删除排行"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </button>
          </div>
        )}

        {/* 可见范围标签 */}
        <div className="absolute top-2 left-2">
          <span className={cn(
            'px-2 py-0.5 rounded-full text-label-sm',
            ranking.visibility === '公开' && 'bg-primary/10 text-primary',
            ranking.visibility === '私密' && 'bg-surface-container-high text-on-surface-variant',
            ranking.visibility === '仅链接' && 'bg-tier-b-electric-purple/10 text-tier-b-electric-purple',
          )}>
            {ranking.visibility}
          </span>
        </div>
      </div>

      {/* 信息区域 */}
      <div className="flex flex-col gap-2 p-3.5">
        {/* 标题 */}
        <h3 className="text-body-md font-headline-md text-on-surface line-clamp-2 leading-snug">
          {ranking.title}
        </h3>

        {/* 等级分布概览 */}
        {hasTierData && (
          <div className="flex items-center gap-1.5">
            {TIER_ORDER.map((tier) => {
              const count = tierSummary[tier] || 0
              if (count === 0) return null
              return (
                <div
                  key={tier}
                  className={cn(
                    'flex items-center gap-1 px-1.5 py-0.5 rounded-md',
                    TIER_COLORS[tier] || 'bg-surface-container',
                  )}
                >
                  <span className="text-label-sm font-bold text-white">{tier}</span>
                  <span className="text-label-sm text-white/80">{count}</span>
                </div>
              )
            })}
          </div>
        )}

        {/* 底部分隔线 + 统计 */}
        <div className="flex items-center justify-between pt-1 border-t border-border-light">
          <div className="flex items-center gap-3 text-label-sm text-on-surface-variant">
            <span className="flex items-center gap-1">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
              {ranking.entry_count} 项
            </span>
            <span className="flex items-center gap-1">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              {ranking.view_count}
            </span>
          </div>
          <span className="text-label-sm text-on-surface-variant/60">
            {formatRelativeTime(ranking.created_at)}
          </span>
        </div>
      </div>
    </div>
  )
}

function formatRelativeTime(dateStr: string): string {
  const now = Date.now()
  const date = new Date(dateStr).getTime()
  const diffMs = now - date
  const diffMin = Math.floor(diffMs / 60000)
  const diffHour = Math.floor(diffMs / 3600000)
  const diffDay = Math.floor(diffMs / 86400000)
  const diffWeek = Math.floor(diffDay / 7)
  const diffMonth = Math.floor(diffDay / 30)

  if (diffMin < 1) return '刚刚'
  if (diffMin < 60) return `${diffMin} 分钟前`
  if (diffHour < 24) return `${diffHour} 小时前`
  if (diffDay < 7) return `${diffDay} 天前`
  if (diffWeek < 4) return `${diffWeek} 周前`
  return `${diffMonth} 个月前`
}
