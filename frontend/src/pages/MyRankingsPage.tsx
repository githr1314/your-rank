import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { RankingCard } from '@/components/ranking/RankingCard'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { EmptyState } from '@/components/shared/EmptyState'
import { cn } from '@/utils/cn'
import { CATEGORIES, DEFAULT_PAGE_SIZE } from '@/utils/constants'
import * as rankingAPI from '@/services/rankingAPI'
import toast from 'react-hot-toast'
import type { RankingCardResponse } from '@/types'

type SortBy = 'created_at' | 'updated_at'

export function MyRankingsPage() {
  const navigate = useNavigate()
  const [rankings, setRankings] = useState<RankingCardResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  // Filters
  const [selectedCategory, setSelectedCategory] = useState('全部')
  const [sortBy, setSortBy] = useState<SortBy>('updated_at')

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<RankingCardResponse | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const fetchMyRankings = useCallback(
    async (reset = false) => {
      const currentOffset = reset ? 0 : offset
      if (!reset && isLoadingMore) return

      if (reset) {
        setIsLoading(true)
      } else {
        setIsLoadingMore(true)
      }

      try {
        const categoryParam = selectedCategory === '全部' ? undefined : selectedCategory
        const res = await rankingAPI.listMy({
          offset: currentOffset,
          limit: DEFAULT_PAGE_SIZE,
          category: categoryParam,
          sort_by: sortBy,
        })

        const { items, total: totalCount } = res.data

        if (reset) {
          setRankings(items)
        } else {
          setRankings((prev) => [...prev, ...items])
        }

        setTotal(totalCount)
        setOffset(currentOffset + items.length)
        setHasMore(currentOffset + items.length < totalCount)
      } catch {
        toast.error('加载失败，请稍后重试')
      } finally {
        setIsLoading(false)
        setIsLoadingMore(false)
      }
    },
    [offset, isLoadingMore, selectedCategory, sortBy],
  )

  // 初始加载 + 筛选/排序变化时重置
  useEffect(() => {
    setOffset(0)
    setRankings([])
    setHasMore(true)
    fetchMyRankings(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, sortBy])

  // 加载更多 — IntersectionObserver
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading && !isLoadingMore) {
          fetchMyRankings()
        }
      },
      { rootMargin: '200px' },
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMore, isLoading, isLoadingMore])

  const handleDelete = useCallback(
    async (id: string) => {
      setIsDeleting(true)
      try {
        await rankingAPI.remove(id)
        toast.success('排行榜已删除')
        setRankings((prev) => prev.filter((r) => r.id !== id))
        setTotal((prev) => prev - 1)
        setDeleteTarget(null)
      } catch {
        toast.error('删除失败，请稍后重试')
      } finally {
        setIsDeleting(false)
      }
    },
    [],
  )

  const handleDeleteClick = useCallback((id: string) => {
    const target = rankings.find((r) => r.id === id)
    if (target) {
      setDeleteTarget(target)
    }
  }, [rankings])

  return (
    <div className="flex flex-col h-full">
      {/* 页面头部 */}
      <div className="flex items-center justify-between px-margin-edge pt-6 pb-2 flex-shrink-0">
        <h1 className="text-headline-md text-on-surface font-headline-md">
          我的排行
          {total > 0 && (
            <span className="text-body-md text-on-surface-variant font-normal ml-2">
              ({total})
            </span>
          )}
        </h1>
        <button
          onClick={() => navigate('/create')}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-on-primary text-label-sm font-label-sm hover:bg-primary-container hover:text-on-primary-container transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          创建排行
        </button>
      </div>

      {/* 筛选 + 排序栏 */}
      <div className="flex items-center gap-3 px-margin-edge py-3 flex-shrink-0 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-1.5">
          {['全部', ...CATEGORIES].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-label-sm font-label-sm transition-colors whitespace-nowrap',
                selectedCategory === cat
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high',
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setSortBy('updated_at')}
            className={cn(
              'px-3 py-1.5 rounded-lg text-label-sm transition-colors',
              sortBy === 'updated_at'
                ? 'bg-surface-container-high text-on-surface font-label-sm'
                : 'text-on-surface-variant hover:bg-surface-container',
            )}
          >
            最近更新
          </button>
          <button
            onClick={() => setSortBy('created_at')}
            className={cn(
              'px-3 py-1.5 rounded-lg text-label-sm transition-colors',
              sortBy === 'created_at'
                ? 'bg-surface-container-high text-on-surface font-label-sm'
                : 'text-on-surface-variant hover:bg-surface-container',
            )}
          >
            最早创建
          </button>
        </div>
      </div>

      {/* 排行榜卡片网格 */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-auto px-margin-edge pb-6"
      >
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-xl bg-surface-container-low animate-pulse">
                <div className="aspect-[16/10] rounded-t-xl bg-surface-container-high" />
                <div className="p-3.5 flex flex-col gap-2">
                  <div className="h-4 bg-surface-container-high rounded w-3/4" />
                  <div className="flex gap-1.5">
                    <div className="h-5 w-10 bg-surface-container-high rounded" />
                    <div className="h-5 w-10 bg-surface-container-high rounded" />
                  </div>
                  <div className="h-3 bg-surface-container-high rounded w-1/2 mt-1" />
                </div>
              </div>
            ))}
          </div>
        ) : rankings.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <EmptyState
              text="还没有创建排行，点击右上角开始创建"
              icon={
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-outline-variant/50">
                  <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
                  <rect x="9" y="3" width="6" height="4" rx="1" />
                  <line x1="12" y1="12" x2="12" y2="18" />
                  <line x1="9" y1="15" x2="15" y2="15" />
                </svg>
              }
            />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {rankings.map((ranking) => (
                <RankingCard
                  key={ranking.id}
                  ranking={ranking}
                  onDelete={handleDeleteClick}
                  showActions
                />
              ))}
            </div>

            {/* 加载更多入口 */}
            {hasMore && (
              <div ref={sentinelRef} className="flex items-center justify-center py-6">
                {isLoadingMore && (
                  <div className="flex items-center gap-2 text-on-surface-variant text-body-md">
                    <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
                      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                    </svg>
                    加载更多...
                  </div>
                )}
              </div>
            )}

            {/* 全部加载完成 */}
            {!hasMore && rankings.length > 0 && (
              <div className="text-center py-6 text-label-sm text-on-surface-variant/60">
                已显示全部 {total} 个排行
              </div>
            )}
          </>
        )}
      </div>

      {/* 删除确认弹窗 */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        title="删除排行"
        description={
          <span>
            删除后不可恢复。请输入
            <strong className="text-on-surface"> {deleteTarget?.title} </strong>
            以确认删除。
          </span>
        }
        confirmText="确认删除"
        onConfirm={() => {
          if (deleteTarget) {
            handleDelete(deleteTarget.id)
          }
        }}
        requireInput={deleteTarget?.title || ''}
        isLoading={isDeleting}
        variant="danger"
      />
    </div>
  )
}
