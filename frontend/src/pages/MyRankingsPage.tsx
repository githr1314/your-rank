import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { rankingAPI } from '@/services/api'
import type { Ranking } from '@/types'
import { getUser } from '@/hooks/useAuth'
import { CardSkeleton } from '@/components/common/Skeleton'
import EmptyState from '@/components/common/EmptyState'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export default function MyRankingsPage() {
  const [rankings, setRankings] = useState<Ranking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const user = getUser()

  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await rankingAPI.listMine(0, 50)
        setRankings(res.data.data.items)
      } catch (err: any) {
        const msg = err.response?.data?.message || '加载失败'
        setError(msg)
        toast.error(msg)
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [])

  // 未登录
  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <EmptyState
          icon="🔒"
          title="请先登录"
          description="登录后查看你的排行榜"
          actionText="去登录"
          actionLink="/login"
        />
      </div>
    )
  }

  // 骨架屏
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">我的排行</h1>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    )
  }

  // 错误状态
  if (error && rankings.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <EmptyState
          icon="😵"
          title="加载失败"
          description={error}
          actionText="重试"
          onAction={() => window.location.reload()}
        />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">我的排行</h1>
          <p className="text-sm text-gray-500 mt-1">
            {rankings.length > 0 ? `共 ${rankings.length} 个排行榜` : '你还没有创建任何排行榜'}
          </p>
        </div>
        <Link to="/create">
          <Button>创建新排行</Button>
        </Link>
      </div>

      {/* 空状态 */}
      {rankings.length === 0 ? (
        <EmptyState
          icon="📋"
          title="还没有创建任何排行榜"
          description="点击下方按钮开始创建你的第一个 Tier List"
          actionText="创建第一个排行"
          actionLink="/create"
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {rankings.map((ranking) => (
            <div
              key={ranking.id}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-card-hover transition-all duration-200 group"
            >
              {/* 封面 */}
              <div className="h-32 bg-gradient-to-br from-brand-100 to-brand-200 flex items-center justify-center overflow-hidden">
                {ranking.cover_url ? (
                  <img src={ranking.cover_url} alt={ranking.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <span className="text-3xl">🏆</span>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 truncate">{ranking.title}</h3>
                <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                  <span className={`px-1.5 py-0.5 rounded ${
                    ranking.visibility === '公开' ? 'bg-green-50 text-green-600' :
                    ranking.visibility === '仅链接' ? 'bg-amber-50 text-amber-600' :
                    'bg-gray-50 text-gray-500'
                  }`}>
                    {ranking.visibility}
                  </span>
                  <span>·</span>
                  <span>{ranking.entries?.length || 0} 条目</span>
                </div>
                <div className="flex gap-2 mt-3">
                  <Link
                    to={`/ranking/${ranking.id}/manage`}
                    className="flex-1"
                  >
                    <Button className="w-full text-xs" size="sm">管理</Button>
                  </Link>
                  <Link
                    to={`/ranking/${ranking.id}`}
                    className="flex-1"
                  >
                    <Button variant="outline" className="w-full text-xs" size="sm">查看</Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
