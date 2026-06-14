import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { rankingAPI } from '@/services/api'
import type { Entry, Ranking, Tier } from '@/types'
import { TIER_INFO, TIER_ORDER } from '@/utils/constants'
import { isAuthenticated, getUser } from '@/hooks/useAuth'
import { TierRowSkeleton } from '@/components/common/Skeleton'
import EmptyState from '@/components/common/EmptyState'
import SharePosterModal from '@/components/common/SharePosterModal'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export default function RankingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [ranking, setRanking] = useState<Ranking | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [shareUrl, setShareUrl] = useState('')
  const [showShareModal, setShowShareModal] = useState(false)
  const user = getUser()

  const fetchRanking = async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const res = await rankingAPI.get(id)
      setRanking(res.data.data)
      setShareUrl(`${window.location.origin}/s/${res.data.data.share_code}`)
    } catch (err: any) {
      const msg = err.response?.data?.message || '排行榜不存在或无权查看'
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRanking()
  }, [id])

  const copyShareLink = () => {
    navigator.clipboard.writeText(shareUrl)
    toast.success('分享链接已复制')
  }

  // 骨架屏加载
  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="text-center mb-10">
          <div className="h-8 bg-gray-200 rounded w-64 mx-auto animate-pulse mb-2" />
          <div className="h-4 bg-gray-100 rounded w-96 mx-auto animate-pulse mb-2" />
          <div className="h-4 bg-gray-100 rounded w-48 mx-auto animate-pulse" />
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
      <div className="max-w-5xl mx-auto px-4 py-8">
        <EmptyState
          icon="🔍"
          title="排行榜不存在"
          description={error}
          actionText="重试"
          onAction={fetchRanking}
        />
        <div className="text-center mt-4 space-x-4">
          <Link to="/home" className="text-sm text-brand-600 hover:text-brand-700">
            回到发现页
          </Link>
          <Link to="/my-rankings" className="text-sm text-brand-600 hover:text-brand-700">
            我的排行
          </Link>
        </div>
      </div>
    )
  }

  if (!ranking) return null

  // 按等级分组
  const entriesByTier: Record<Tier, Entry[]> = { S: [], A: [], B: [], C: [], D: [] }
  const unplaced: Entry[] = []
  ranking.entries?.forEach((e) => {
    if (e.tier && e.tier in entriesByTier) {
      entriesByTier[e.tier as Tier].push(e)
    } else {
      unplaced.push(e)
    }
  })

  const isOwner = user?.id === ranking.user_id

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 animate-fade-in">
      {/* 排行头部 */}
      <div className="text-center mb-10">
        {ranking.cover_url && (
          <img
            src={ranking.cover_url}
            alt={ranking.title}
            className="w-full max-w-lg mx-auto h-48 object-cover rounded-xl mb-6 shadow-sm"
          />
        )}
        <h1 className="text-3xl font-bold text-gray-900">{ranking.title}</h1>
        {ranking.description && (
          <p className="mt-2 text-gray-500">{ranking.description}</p>
        )}
        <div className="flex items-center justify-center gap-3 mt-3 text-xs text-gray-400">
          <span className="bg-gray-100 px-2 py-0.5 rounded">{ranking.category}</span>
          <span>·</span>
          <span>{ranking.entries?.length || 0} 条目</span>
          <span>·</span>
          <span>👀 {ranking.view_count}</span>
          {ranking.user && (
            <>
              <span>·</span>
              <span>by {ranking.user.nickname || ranking.user.username}</span>
            </>
          )}
        </div>

        {/* 操作按钮 */}
        <div className="flex items-center justify-center gap-2 mt-4">
          {isOwner && (
            <Link to={`/ranking/${ranking.id}/manage`}>
              <Button size="sm">✏️ 管理排行</Button>
            </Link>
          )}
          <Button variant="outline" size="sm" onClick={() => setShowShareModal(true)}>
            📤 分享海报
          </Button>
          <Button variant="outline" size="sm" onClick={copyShareLink}>
            🔗 复制链接
          </Button>
        </div>
      </div>

      {/* Tier 行展示 */}
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
                          <img
                            src={entry.image_url}
                            alt={entry.name}
                            className="w-full h-24 object-cover rounded-md mb-2"
                          />
                        )}
                        <p className="text-sm font-medium text-gray-800 truncate">{entry.name}</p>
                        {entry.description && (
                          <p className="text-xs text-gray-400 mt-1 truncate">{entry.description}</p>
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

      {/* 待放置条目 */}
      {unplaced.length > 0 && (
        <div className="mt-6 rounded-xl border-2 border-dashed border-gray-300 p-4">
          <h3 className="text-sm font-bold text-gray-500 mb-3">🗂 待放置 ({unplaced.length})</h3>
          <div className="flex flex-wrap gap-3">
            {unplaced.map((entry) => (
              <div key={entry.id} className="entry-card !cursor-default opacity-60">
                {entry.image_url && (
                  <img src={entry.image_url} alt={entry.name} className="w-full h-20 object-cover rounded-md mb-2" />
                )}
                <p className="text-sm font-medium text-gray-800 truncate">{entry.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 分享海报弹窗 */}
      {showShareModal && ranking && (
        <SharePosterModal
          ranking={ranking}
          shareUrl={shareUrl}
          onClose={() => setShowShareModal(false)}
        />
      )}

      {/* 底部引导 */}
      <div className="text-center mt-12 py-8 border-t border-gray-100">
        <p className="text-gray-400 text-sm">🌊 由 Your Rank 生成</p>
        {!isAuthenticated() && (
          <Link to="/register">
            <Button className="mt-3">
              自己也来创建一个 →
            </Button>
          </Link>
        )}
      </div>
    </div>
  )
}
