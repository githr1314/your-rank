import { useDroppable } from '@dnd-kit/core'
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable'
import { cn } from '@/utils/cn'
import { DroppableEmptyState } from '@/components/shared/EmptyState'
import { DraggableEntryCard } from './DraggableEntryCard'
import type { EntryResponse, TierEnum } from '@/types'

export interface TierRowProps {
  tier: Exclude<TierEnum, null>
  label: string
  entries: EntryResponse[]
  onEdit: (entry: EntryResponse) => void
  onDelete: (entry: EntryResponse) => void
  isOver?: boolean
}

/**
 * 单个等级行。
 * 左侧 TierBadge + 右侧横向滚动可排序条目列表。
 * droppable ID: `tier-{tier}`（如 tier-S）
 */
export function TierRow({
  tier,
  label,
  entries,
  onEdit,
  onDelete,
  isOver,
}: TierRowProps) {
  const droppableId = `tier-${tier}`
  const { setNodeRef } = useDroppable({ id: droppableId })
  const itemIds = entries.map((e) => e.id)

  const colorStyles = getTierColorStyles(tier)

  return (
    <div
      className={cn(
        'flex flex-row items-stretch rounded-lg overflow-hidden',
        'border transition-all duration-200 relative',
        isOver ? 'border-primary shadow-[0_0_0_1px_rgba(0,88,188,0.3)]' : 'border-border-light',
        'bg-glass-bg backdrop-blur-sm shadow-sm',
      )}
    >
      {/* Tier badge */}
      <div
        className={cn(
          'w-16 md:w-20 lg:w-24 flex-shrink-0 flex flex-col items-center justify-center',
          'font-tier-marker shadow-[inset_-1px_0_0_rgba(0,0,0,0.1)]',
          colorStyles.bg,
          colorStyles.text,
        )}
      >
        <span className="text-tier-marker leading-none">{tier}</span>
        <span
          className={cn(
            'text-[10px] md:text-label-sm font-label-sm font-medium tracking-normal mt-0.5',
            'opacity-80',
          )}
        >
          {label}
        </span>
      </div>

      {/* Entry list — droppable */}
      <div
        ref={setNodeRef}
        className={cn(
          'flex-1 flex flex-row items-center gap-2 px-3 py-2',
          'overflow-x-auto overflow-y-hidden no-scrollbar',
          colorStyles.tintBg,
        )}
      >
        {entries.length === 0 ? (
          <div className="w-full h-full flex items-center justify-center">
            <DroppableEmptyState className="border-0 bg-transparent py-4" />
          </div>
        ) : (
          <SortableContext
            items={itemIds}
            strategy={horizontalListSortingStrategy}
          >
            {entries.map((entry) => (
              <DraggableEntryCard
                key={entry.id}
                entry={entry}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </SortableContext>
        )}

        {/* Invisible spacer to fill remaining width */}
        {entries.length > 0 && (
          <div className="h-full min-w-[8px] flex-shrink-0" />
        )}
      </div>
    </div>
  )
}

function getTierColorStyles(tier: string) {
  switch (tier) {
    case 'S':
      return {
        bg: 'bg-tier-s-gradient',
        text: 'text-black',
        tintBg: 'bg-[linear-gradient(135deg,rgba(255,215,0,0.05),rgba(255,149,0,0.08))]',
      }
    case 'A':
      return {
        bg: 'bg-tier-a-crimson',
        text: 'text-white',
        tintBg: 'bg-tier-a-crimson/5',
      }
    case 'B':
      return {
        bg: 'bg-tier-b-electric-purple',
        text: 'text-white',
        tintBg: 'bg-tier-b-electric-purple/5',
      }
    case 'C':
      return {
        bg: 'bg-tier-c-graphite',
        text: 'text-white',
        tintBg: 'bg-tier-c-graphite/5',
      }
    case 'D':
      return {
        bg: 'bg-tier-d-soft-gray',
        text: 'text-white',
        tintBg: 'bg-tier-d-soft-gray/10',
      }
    default:
      return {
        bg: 'bg-surface-variant',
        text: 'text-on-surface',
        tintBg: 'bg-surface-container-low',
      }
  }
}
