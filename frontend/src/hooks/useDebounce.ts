import { useState, useEffect } from 'react'

/**
 * 防抖 hook — 延迟更新值，避免频繁触发副作用。
 * @param value 要防抖的值
 * @param delay 延迟毫秒数
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}
