import { useEffect, useRef, useState } from 'react'

interface UseInViewOptions {
  root?: Element | Document | null
  rootMargin?: string
  threshold?: number | number[]
}

/**
 * 检测元素是否进入视口。
 * 用于无限滚动触发加载更多。
 */
export function useInView(options?: UseInViewOptions) {
  const ref = useRef<HTMLDivElement | null>(null)
  const [isInView, setIsInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(([entry]) => {
      setIsInView(entry.isIntersecting)
    }, options)

    observer.observe(el)
    return () => observer.disconnect()
    // 故意不依赖 options — 重新创建 observer 的成本高于 stale options 的风险
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { ref, isInView }
}
