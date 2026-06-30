import { useDroppable } from '@dnd-kit/core'
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable'
import { cn } from '@/utils/cn'
import { DroppableEmptyState } from '@/components/shared/EmptyState'
import { DraggableEntryCard } from './DraggableEntryCard'
import type { EntryResponse } from '@/types'

export interface PendingZoneProps {
  entries: EntryResponse[]
  onEdit: (entry: EntryResponse) => void
  onDelete: (entry: EntryResponse) => void
  isOver?: boolean
}

/**
 * 待放置区 — 新条目默认进入此区。
 * 有 header 栏显示"待放置"和条目计数。
 * droppable ID: pending
 */
export function PendingZone({
  entries,
  onEdit,
  onDelete,
  isOver,
}: PendingZoneProps) {
  const { setNodeRef } = useDroppable({ id: 'pending' })
  const itemIds = entries.map((e) => e.id)

  return (
    <div
      className={cn(
        'flex flex-col rounded-lg overflow-hidden border transition-all duration-200',
        isOver
          ? 'border-primary shadow-[0_0_0_1px_rgba(0,88,188,0.3)]'
          : 'border-border-light',
        'shadow-inner',
      )}
    >
      {/* Header */}
      <div className="h-8 md:h-10 flex-shrink-0 bg-surface-variant/50 border-b border-light flex items-center px-4 gap-2">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-on-surface-variant flex-shrink-0"
        >
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
        <span
          className={cn(
            'text-label-sm font-label-sm font-semibold text-on-surface',
            'uppercase tracking-wider',
          )}
        >
          待放置
        </span>
        <span
          className={cn(
            'ml-auto bg-surface-container-high text-on-surface-variant',
            'text-[10px] px-2 py-0.5 rounded-full border border-border-light',
          )}
        >
          {entries.length} 项
        </span>
      </div>

      {/* Items area — droppable */}
      <div
        ref={setNodeRef}
        className={cn(
          'flex-1 flex flex-row flex-wrap content-start gap-2 p-3',
          'overflow-y-auto no-scrollbar',
          isOver && 'bg-primary/5',
        )}
      >
        {entries.length === 0 ? (
          <div className="w-full h-full min-h-[80px] flex items-center justify-center">
            <DroppableEmptyState className="border-0 bg-transparent py-4" />
          </div>
        ) : (
          <SortableContext items={itemIds} strategy={rectSortingStrategy}>
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="w-[68px] h-[68px] md:w-[88px] md:h-[88px] flex-shrink-0"
              >
                <DraggableEntryCard
                  entry={entry}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              </div>
            ))}
          </SortableContext>
        )}
      </div>
    </div>
  )
}
