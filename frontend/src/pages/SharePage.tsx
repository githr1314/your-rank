import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { rankingAPI } from '@/services/api'
import type { Entry, Ranking, Tier } from '@/types'
import { TIER_INFO, TIER_ORDER } from '@/utils/constants'
import { TierRowSkeleton } from '@/components/common/Skeleton'
import EmptyState from '@/components/common/EmptyState'
import { Button } from '@/components/ui/button'

export default function SharePage() {
  const { code } = useParams<{ code: string }>()
  const [ranking, setRanking] = useState<Ranking | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchRanking = async () => {
    if (!code) return
    setLoading(true)
    setError(null)
    try {
      const res = await rankingAPI.getByShareCode(code)
      setRanking(res.data.data)
    } catch (err: any) {
      const msg = err.response?.data?.message || '分享链接无效或排行不存在'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRanking()
  }, [code])

  // 骨架屏加载
  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="text-center mb-10">
          <div className="h-8 bg-gray-200 rounded w-64 mx-auto animate-pulse mb-2" />
          <div className="h-4 bg-gray-100 rounded w-96 mx-auto animate-pulse" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <TierRowSkeleton key={i} />
          ))}
        </div>
      </div>
    )
  }

  // 错误状态
  if (error) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 animate-fade-in">
        <EmptyState
          icon="🔗"
          title="排行不存在"
          description={error}
          actionText="重试"
          onAction={fetchRanking}
        />
        <div className="text-center mt-4">
          <Link to="/home" className="text-sm text-brand-600 hover:text-brand-700">
            回到发现页 →
          </Link>
        </div>
      </div>
    )
  }

  if (!ranking) return null

  const entriesByTier: Record<Tier, Entry[]> = { S: [], A: [], B: [], C: [], D: [] }
  ranking.entries?.forEach((e) => {
    if (e.tier && e.tier in entriesByTier) {
      entriesByTier[e.tier as Tier].push(e)
    }
  })

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 animate-fade-in">
      {/* 排行头部 */}
      <div className="text-center mb-10">
        {ranking.cover_url && (
          <img
            src={ranking.cover_url}
            alt={ranking.title}
            className="w-full max-w-md mx-auto h-48 object-cover rounded-xl mb-6 shadow-sm"
          />
        )}
        <h1 className="text-3xl font-bold text-gray-900">{ranking.title}</h1>
        {ranking.description && (
          <p className="mt-2 text-gray-500 max-w-2xl mx-auto">{ranking.description}</p>
        )}
        {ranking.user && (
          <p className="mt-2 text-sm text-gray-400">
            由 {ranking.user.nickname || ranking.user.username} 创建
          </p>
        )}
        <div className="flex items-center justify-center gap-2 mt-2 text-xs text-gray-400">
          <span>{ranking.category}</span>
          <span>·</span>
          <span>{ranking.entries?.length || 0} 条目</span>
          <span>·</span>
          <span>👀 {ranking.view_count}</span>
        </div>
      </div>

      {/* Tier 展示 */}
      <div className="space-y-4">
        {TIER_ORDER.map((tier) => {
          const info = TIER_INFO[tier]
          const entryList = entriesByTier[tier]
          return (
            <div key={tier} className={`rounded-xl border-2 ${info.cssClass} p-4`}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">{info.emoji}</span>
                <h3 className="font-bold text-sm">{info.name}</h3>
                <span className={`tier-badge ${info.badgeClass} ml-2`}>{tier}</span>
                <span className="text-xs text-gray-400 ml-auto">{entryList.length} 条目</span>
              </div>
              {entryList.length > 0 ? (
                <div className="flex flex-wrap gap-3">
                  {entryList
                    .sort((a, b) => a.sort_order - b.sort_order)
                    .map((entry) => (
                      <div key={entry.id} className="entry-card !cursor-default">
                        {entry.image_url && (
                          <img src={entry.image_url} alt={entry.name} className="w-full h-24 object-cover rounded-md mb-2" />
                        )}
                        <p className="text-sm font-medium text-gray-800 truncate">{entry.name}</p>
                        {entry.description && (
                          <p className="text-xs text-gray-400 mt-0.5 truncate">{entry.description}</p>
                        )}
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400 italic">（空）</p>
              )}
            </div>
          )
        })}
      </div>

      {/* 底部引导 */}
      <div className="text-center mt-12 py-8 border-t border-gray-100">
        <p className="text-gray-400 text-sm">🌊 由 Your Rank 生成</p>
        <Link to="/register">
          <Button className="mt-3">
            自己也来创建一个 →
          </Button>
        </Link>
      </div>
    </div>
  )
}
