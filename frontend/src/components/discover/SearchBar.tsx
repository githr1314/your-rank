import { type ChangeEvent } from 'react'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

/**
 * 搜索栏组件。
 * 带搜索图标和清除按钮的输入框。
 */
export function SearchBar({
  value,
  onChange,
  placeholder = '搜索排行榜...',
}: SearchBarProps) {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value)
  }

  const handleClear = () => {
    onChange('')
  }

  return (
    <div className="relative w-full">
      {/* 搜索图标 */}
      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-on-surface-variant"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </div>

      {/* 输入框 */}
      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full h-10 pl-10 pr-9 rounded-lg bg-surface-container border border-outline-variant
                   text-body-md text-on-surface placeholder:text-on-surface-variant/50
                   focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary
                   transition-all duration-200"
      />

      {/* 清除按钮 */}
      {value && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full
                     text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high
                     transition-colors"
          aria-label="清空搜索"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
    </div>
  )
}
