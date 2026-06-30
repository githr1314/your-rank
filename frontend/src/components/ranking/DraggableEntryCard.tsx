import { forwardRef, type HTMLAttributes } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { cn } from '@/utils/cn'
import type { EntryResponse, TierEnum } from '@/types'

export interface DraggableEntryCardProps {
  entry: EntryResponse
  isDragOverlay?: boolean
  onEdit?: (entry: EntryResponse) => void
  onDelete?: (entry: EntryResponse) => void
}

/**
 * 可拖拽的条目卡片。
 * 使用 @dnd-kit useSortable 实现行内排序和跨容器拖拽。
 */
export function DraggableEntryCard({
  entry,
  isDragOverlay,
  onEdit,
  onDelete,
}: DraggableEntryCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: entry.id,
    data: { type: 'entry', entry },
  })

  const style = transform
    ? {
        transform: CSS.Transform.toString(transform),
        transition: transition || undefined,
      }
    : undefined

  if (isDragOverlay) {
    return (
      <EntryCardContent
        entry={entry}
        className="shadow-card-drag scale-105 opacity-95"
      />
    )
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        'h-full aspect-square flex-shrink-0 relative rounded-lg overflow-hidden',
        'bg-surface-container-highest cursor-grab active:cursor-grabbing',
        'border border-border-light/50 select-none',
        'transition-shadow duration-200',
        'hover:shadow-card-hover hover:z-10',
        isDragging && 'opacity-40 shadow-card-drag',
        'group/card',
      )}
    >
      <EntryCardContent entry={entry} />

      {/* Action buttons — shown on hover */}
      <div
        className={cn(
          'absolute top-1 right-1 flex gap-0.5 opacity-0 group-hover/card:opacity-100',
          'transition-opacity duration-150 z-10',
        )}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {onEdit && (
          <button
            onClick={() => onEdit(entry)}
            className="w-6 h-6 flex items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors text-[10px]"
            aria-label="编辑"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
            </svg>
          </button>
        )}
        {onDelete && (
          <button
            onClick={() => onDelete(entry)}
            className="w-6 h-6 flex items-center justify-center rounded-full bg-black/50 text-white hover:bg-error transition-colors text-[10px]"
            aria-label="删除"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18" />
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
            </svg>
          </button>
        )}
      </div>

      {/* Tier badge overlay */}
      {entry.tier && (
        <div className="absolute top-1 left-1 z-10">
          <TierBadgeInline tier={entry.tier} />
        </div>
      )}

      {/* Name overlay at bottom */}
      <div className="absolute bottom-0 left-0 right-0 z-10 px-1.5 pb-1 pt-4 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none">
        <span className="block text-[10px] md:text-label-sm font-label-sm text-white truncate text-center leading-tight">
          {entry.name}
        </span>
      </div>

      {/* Image */}
      {entry.image_url ? (
        <img
          src={entry.image_url}
          alt={entry.name}
          className="absolute inset-0 w-full h-full object-cover"
          draggable={false}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-surface-container-high">
          <span className="text-label-sm text-on-surface-variant/40 truncate px-2 text-center">
            {entry.name}
          </span>
        </div>
      )}
    </div>
  )
}

/** The inner card content used by both the draggable and overlay variants */
interface EntryCardContentProps extends HTMLAttributes<HTMLDivElement> {
  entry: EntryResponse
}

const EntryCardContent = forwardRef<HTMLDivElement, EntryCardContentProps>(
  ({ entry, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'h-full aspect-square relative rounded-lg overflow-hidden',
          'bg-surface-container-highest border border-border-light/50',
          className,
        )}
        {...props}
      >
        {entry.image_url ? (
          <img
            src={entry.image_url}
            alt={entry.name}
            className="absolute inset-0 w-full h-full object-cover"
            draggable={false}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-surface-container-high">
            <span className="text-label-sm text-on-surface-variant/40 truncate px-2 text-center">
              {entry.name}
            </span>
          </div>
        )}

        {entry.tier && (
          <div className="absolute top-1 left-1 z-10">
            <TierBadgeInline tier={entry.tier} />
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 z-10 px-1.5 pb-1 pt-4 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none">
          <span className="block text-[10px] md:text-label-sm font-label-sm text-white truncate text-center leading-tight">
            {entry.name}
          </span>
        </div>
      </div>
    )
  },
)

EntryCardContent.displayName = 'EntryCardContent'

/** Small inline tier badge */
function TierBadgeInline({ tier }: { tier: Exclude<TierEnum, null> }) {
  const colorMap: Record<string, string> = {
    S: 'bg-tier-s text-black',
    A: 'bg-tier-a-crimson text-white',
    B: 'bg-tier-b-electric-purple text-white',
    C: 'bg-tier-c-graphite text-white',
    D: 'bg-tier-d-soft-gray text-white',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center w-4 h-4 rounded text-[8px] font-bold leading-none',
        colorMap[tier] || 'bg-surface-container-high text-on-surface-variant',
      )}
    >
      {tier}
    </span>
  )
}
