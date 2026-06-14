import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { rankingAPI } from '@/services/api'
import type { Entry, Ranking, Tier } from '@/types'
import { CATEGORIES, TIER_INFO, TIER_ORDER } from '@/utils/constants'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import { CardSkeleton } from '@/components/common/Skeleton'
import EmptyState from '@/components/common/EmptyState'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

// 小型等级分布预览
function TierDistribution({ entries }: { entries?: Entry[] }) {
  if (!entries || entries.length === 0) return null

  const counts: Record<string, number> = {}
  entries.forEach((e) => {
    if (e.tier) {
      counts[e.tier] = (counts[e.tier] || 0) + 1
    }
  })

  return (
    <div className="flex items-center gap-1 flex-wrap mt-2">
      {TIER_ORDER.map((tier) => {
        const count = counts[tier] || 0
        if (count === 0) return null
        return (
          <span key={tier} className="text-xs text-gray-500">
            {TIER_INFO[tier as Tier].emoji}{count}
          </span>
        )
      })}
    </div>
  )
}

export default function HomePage() {
  const [rankings, setRankings] = useState<Ranking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [category, setCategory] = useState('全部')
  const [keyword, setKeyword] = useState('')
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)

  const observerRef = useRef<HTMLDivElement>(null)

  const fetchRankings = useCallback(async (reset = false) => {
    setLoading(true)
    setError(null)
    try {
      const o = reset ? 0 : offset
      const res = await rankingAPI.listPublic({
        offset: o,
        limit: 20,
        category: category === '全部' ? '' : category,
        keyword,
      })
      const data = res.data.data
      if (reset) {
        setRankings(data.items)
        setOffset(data.items.length)
      } else {
        setRankings((prev) => [...prev, ...data.items])
        setOffset((prev) => prev + data.items.length)
      }
      setHasMore(data.items.length >= 20 && rankTotal(data) > o + data.items.length)
    } catch (err: any) {
      const msg = err.response?.data?.message || '加载失败'
      setError(msg)
      if (reset) setRankings([])
    } finally {
      setLoading(false)
    }
  }, [offset, category, keyword])

  // Helper to get total
  const rankTotal = (data: { total: number }) => data.total

  // IntersectionObserver for infinite scroll
  useEffect(() => {
    if (!observerRef.current || !hasMore || loading) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          fetchRankings()
        }
      },
      { threshold: 0.1 }
    )
    observer.observe(observerRef.current)
    return () => observer.disconnect()
  }, [hasMore, loading, fetchRankings])

  useEffect(() => {
    fetchRankings(true)
  }, [category])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchRankings(true)
  }

  const hasRankings = rankings.length > 0

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      {/* 搜索与筛选 */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">发现排行榜</h1>
        <p className="text-sm text-gray-500 mb-4">浏览公开排行榜，发现精彩内容</p>
        <form onSubmit={handleSearch} className="flex gap-3 mb-4">
          <div className="relative flex-1 max-w-md">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm z-10">🔍</span>
            <Input
              type="text"
              className="pl-9"
              placeholder="搜索排行标题..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>
          <Button type="submit">搜索</Button>
          {keyword && (
            <Button
              type="button"
              variant="outline"
              onClick={() => { setKeyword(''); fetchRankings(true) }}
            >
              清除
            </Button>
          )}
        </form>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setCategory('全部')}
            className={`tag-pill ${category === '全部' ? 'tag-pill-active' : 'tag-pill-inactive'}`}
          >
            全部
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setCategory(cat.value)}
              className={`tag-pill ${category === cat.value ? 'tag-pill-active' : 'tag-pill-inactive'}`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* 错误状态 */}
      {error && !loading && (
        <div className="text-center py-12">
          <p className="text-gray-400 mb-3">😵 {error}</p>
          <Button onClick={() => fetchRankings(true)}>
            重新加载
          </Button>
        </div>
      )}

      {/* 骨架屏加载 */}
      {loading && rankings.length === 0 && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* 空状态 */}
      {!loading && !error && rankings.length === 0 && (
        <EmptyState
          icon="🏆"
          title="还没有公开的排行榜"
          description={category !== '全部' ? `「${category}」分类暂无排行榜` : '成为第一个创建排行榜的人吧'}
          actionText="创建第一个排行"
          actionLink="/create"
        />
      )}

      {/* 排行卡片网格 */}
      {hasRankings && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {rankings.map((ranking) => (
            <Link
              key={ranking.id}
              to={`/ranking/${ranking.id}`}
              className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-card-hover hover:border-brand-200 transition-all duration-200 animate-fade-in"
            >
              {/* 封面 */}
              <div className="h-36 bg-gradient-to-br from-brand-100 to-brand-200 flex items-center justify-center overflow-hidden">
                {ranking.cover_url ? (
                  <img src={ranking.cover_url} alt={ranking.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <span className="text-4xl">🏆</span>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 group-hover:text-brand-600 truncate line-clamp-1">
                  {ranking.title}
                </h3>
                {ranking.description && (
                  <p className="text-xs text-gray-400 mt-1 line-clamp-1">{ranking.description}</p>
                )}
                <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                  <Badge variant="secondary" className="font-normal">{ranking.category}</Badge>
                  <span>{ranking.entries?.length || 0} 条目</span>
                  <span>·</span>
                  <span>👀 {ranking.view_count}</span>
                </div>
                {/* 等级分布预览 */}
                {ranking.entries && <TierDistribution entries={ranking.entries} />}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* IntersectionObserver 触发加载更多 */}
      {hasMore && hasRankings && (
        <div ref={observerRef} className="flex justify-center py-8">
          {loading ? (
            <LoadingSpinner text="加载更多..." />
          ) : (
            <Button
              variant="outline"
              onClick={() => fetchRankings()}
              className="text-sm"
            >
              加载更多
            </Button>
          )}
        </div>
      )}

      {/* 全部加载完毕 */}
      {!hasMore && hasRankings && (
        <p className="text-center text-sm text-gray-300 mt-8 mb-4">—— 已经到底了 ——</p>
      )}
    </div>
  )
}
