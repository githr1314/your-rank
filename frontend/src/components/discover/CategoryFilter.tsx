import { CATEGORIES } from '@/utils/constants'
import { cn } from '@/utils/cn'

interface CategoryFilterProps {
  selected: string | null
  onChange: (category: string | null) => void
}

/**
 * 分类筛选标签行。
 * 横向可滚动的标签列表，支持选中状态切换。
 * 点击"全部"(null) 清除分类筛选。
 */
export function CategoryFilter({ selected, onChange }: CategoryFilterProps) {
  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar">
      {/* 全部选项 */}
      <button
        type="button"
        onClick={() => onChange(null)}
        className={cn(
          'flex-shrink-0 px-4 py-1.5 rounded-lg text-label-sm font-label-sm whitespace-nowrap',
          'transition-all duration-200',
          'hover:ring-1 hover:ring-primary/20',
          selected === null
            ? 'bg-primary text-on-primary shadow-sm'
            : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high',
        )}
      >
        全部
      </button>

      {/* 分类选项 */}
      {CATEGORIES.map((cat) => (
        <button
          key={cat}
          type="button"
          onClick={() => onChange(cat)}
          className={cn(
            'flex-shrink-0 px-4 py-1.5 rounded-lg text-label-sm font-label-sm whitespace-nowrap',
            'transition-all duration-200',
            'hover:ring-1 hover:ring-primary/20',
            selected === cat
              ? 'bg-primary text-on-primary shadow-sm'
              : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high',
          )}
        >
          {cat}
        </button>
      ))}
    </div>
  )
}
