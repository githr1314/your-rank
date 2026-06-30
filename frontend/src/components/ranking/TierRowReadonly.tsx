import type { EntryResponse, TierEnum } from '@/types'
import { cn } from '@/utils/cn'
import { EntryCardReadonly } from './EntryCardReadonly'

export interface TierRowReadonlyProps {
  tier: TierEnum
  entries: EntryResponse[]
  className?: string
}

const TIER_CONFIG: Record<string, { label: string; bgClass: string; textClass: string }> = {
  S: { label: 'S', bgClass: 'bg-tier-s-gradient', textClass: 'text-on-surface' },
  A: { label: 'A', bgClass: 'bg-tier-a-crimson', textClass: 'text-white' },
  B: { label: 'B', bgClass: 'bg-tier-b-electric-purple', textClass: 'text-white' },
  C: { label: 'C', bgClass: 'bg-tier-c-graphite', textClass: 'text-white' },
  D: { label: 'D', bgClass: 'bg-tier-d-soft-gray', textClass: 'text-on-surface' },
}

/**
 * 只读等级行 — 展示单个等级（S/A/B/C/D）的条目卡片列表。
 * 左侧为等级徽章，右侧为横向可滚动的条目卡片列表。
 */
export function TierRowReadonly({ tier, entries, className }: TierRowReadonlyProps) {
  const config = tier ? TIER_CONFIG[tier] : null

  return (
    <div className={cn('flex items-start gap-4 px-margin-edge py-3', className)}>
      {/* Tier Badge */}
      <div
        className={cn(
          'flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center',
          'text-[22px] font-bold leading-none shadow-sm',
          config
            ? `${config.bgClass} ${config.textClass}`
            : 'bg-surface-container text-on-surface-variant',
        )}
      >
        {config?.label || '?'}
      </div>

      {/* Entry Cards List */}
      <div className="flex-1 min-w-0">
        {entries.length > 0 ? (
          <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
            {entries.map((entry) => (
              <EntryCardReadonly key={entry.id} entry={entry} />
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-24 rounded-xl border-2 border-dashed border-outline-variant/30 bg-surface-container-low/10">
            <p className="text-body-md text-on-surface-variant/50">暂无条目</p>
          </div>
        )}
      </div>
    </div>
  )
}
