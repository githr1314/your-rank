import { useState, useEffect, useCallback, useRef } from 'react'
import { SearchBar } from '@/components/discover/SearchBar'
import { CategoryFilter } from '@/components/discover/CategoryFilter'
import { RankingCardGrid } from '@/components/discover/RankingCardGrid'
import { useDebounce } from '@/hooks/useDebounce'
import { useInView } from '@/hooks/useInView'
import * as rankingAPI from '@/services/rankingAPI'
import { DEFAULT_PAGE_SIZE } from '@/utils/constants'
import type { RankingCardResponse } from '@/types'

/**
 * 发现页（/home）。
 *
 * 展示所有公开排行榜卡片网格，支持：
 * - 关键词搜索（300ms 防抖）
 * - 分类标签筛选
 * - 四列卡片网格
 * - 无限滚动加载（IntersectionObserver）
 * - 空状态 / 加载骨架屏 / 错误重试
 */
export function DiscoverPage() {
  // ── 筛选状态 ──
  const [keyword, setKeyword] = useState('')
  const [category, setCategory] = useState<string | null>(null)

  // ── 数据状态 ──
  const [items, setItems] = useState<RankingCardResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)

  // ── 用于触发重试的递增 key ──
  const [refreshKey, setRefreshKey] = useState(0)

  // ── 防抖后的关键词 ──
  const debouncedKeyword = useDebounce(keyword, 300)

  // ── 用 ref 缓存 loadMore 所需的筛选值，避免闭包陈旧 ──
  const filterRef = useRef({ keyword: debouncedKeyword, category })
  filterRef.current = { keyword: debouncedKeyword, category }

  // ── 无限滚动哨兵 ──
  const { ref: sentinelRef, isInView } = useInView({ rootMargin: '200px' })

  // ── 分页偏移量（ref 避免闭包陷阱） ──
  const pageOffsetRef = useRef(DEFAULT_PAGE_SIZE)

  // ── 重置分页并重新加载（关键词/分类/refreshKey变化时触发） ──
  useEffect(() => {
    let cancelled = false

    async function loadInitial() {
      setError(null)
      setLoading(true)
      setInitialLoading(true)
      setItems([])
      setHasMore(true)
      pageOffsetRef.current = DEFAULT_PAGE_SIZE

      try {
        const params: Record<string, string | number> = {
          offset: 0,
          limit: DEFAULT_PAGE_SIZE,
        }
        if (debouncedKeyword) params.keyword = debouncedKeyword
        if (category) params.category = category

        const res = await rankingAPI.listPublic(params)
        if (cancelled) return

        const { items: newItems, total } = res.data
        setItems(newItems)
        setHasMore(newItems.length < total)
      } catch {
        if (!cancelled) {
          setError('加载失败，请检查网络后重试')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
          setInitialLoading(false)
        }
      }
    }

    loadInitial()
    return () => {
      cancelled = true
    }
  }, [debouncedKeyword, category, refreshKey])

  // ── 加载更多（无限滚动触发） ──
  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return

    setLoading(true)
    setError(null)

    const { keyword: kw, category: cat } = filterRef.current
    const currentOffset = pageOffsetRef.current

    try {
      const params: Record<string, string | number> = {
        offset: currentOffset,
        limit: DEFAULT_PAGE_SIZE,
      }
      if (kw) params.keyword = kw
      if (cat) params.category = cat

      const res = await rankingAPI.listPublic(params)
      const { items: newItems, total } = res.data

      setItems((prev) => {
        const updated = [...prev, ...newItems]
        // 用更新后的 length 判断 hasMore
        setHasMore(updated.length < total)
        return updated
      })
      pageOffsetRef.current = currentOffset + newItems.length
    } catch {
      setError('加载更多失败，请重试')
    } finally {
      setLoading(false)
    }
  }, [loading, hasMore])

  // ── 哨兵进入视口 → 加载更多 ──
  useEffect(() => {
    if (isInView && hasMore && !loading && !initialLoading) {
      loadMore()
    }
  }, [isInView, hasMore, loading, initialLoading, loadMore])

  // ── 错误重试 ──
  const handleRetry = useCallback(() => {
    if (error) {
      if (items.length > 0) {
        // 有已有数据 → 重试加载更多
        loadMore()
      } else {
        // 无数据 → 触发 useEffect 重新加载
        setRefreshKey((prev) => prev + 1)
      }
    }
  }, [error, items.length, loadMore])

  // ── 渲染 ──
  return (
    <div className="flex flex-col h-full">
      {/* 粘性头部：搜索栏 + 分类筛选 */}
      <div className="flex-shrink-0 sticky top-0 z-10 bg-background/80 backdrop-blur-xl pt-4 pb-4 space-y-3 border-b border-transparent">
        <SearchBar value={keyword} onChange={setKeyword} />
        <CategoryFilter selected={category} onChange={setCategory} />
      </div>

      {/* 卡片网格区域 */}
      <div className="flex-1 min-h-0 pt-4">
        <RankingCardGrid
          rankings={items}
          loading={loading}
          initialLoading={initialLoading}
          hasMore={hasMore}
          error={error}
          isEmpty={items.length === 0 && !initialLoading && !loading}
          onRetry={handleRetry}
        />
      </div>

      {/* 无限滚动哨兵 */}
      {hasMore && !initialLoading && (
        <div ref={sentinelRef} className="h-4" aria-hidden="true" />
      )}
    </div>
  )
}
