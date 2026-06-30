import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import * as rankingAPI from '@/services/rankingAPI'
import type { EntryResponse, RankingResponse, TierEnum } from '@/types'
import { TIERS } from '@/utils/constants'
import { TierRowReadonly } from '@/components/ranking/TierRowReadonly'

/**
 * 将条目按等级分组。
 */
function groupEntriesByTier(entries: EntryResponse[]) {
  const groups: Record<string, EntryResponse[]> = {
    S: [],
    A: [],
    B: [],
    C: [],
    D: [],
    null: [],
  }
  for (const entry of entries) {
    const key = entry.tier ?? 'null'
    if (key in groups) {
      groups[key].push(entry)
    } else {
      groups['null'].push(entry)
    }
  }
  for (const key of Object.keys(groups)) {
    groups[key].sort((a, b) => a.sort_order - b.sort_order)
  }
  return groups
}

/**
 * 排行详情页（只读）。
 * 根据 URL 中的 id 加载排行榜数据，展示完整的 Tier List 视图。
 * 路由: /ranking/:id
 */
export function RankingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [ranking, setRanking] = useState<RankingResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return

    setLoading(true)
    setError(null)

    rankingAPI
      .getById(id)
      .then((res) => {
        setRanking(res.data)
      })
      .catch((err) => {
        const msg = err?.response?.data?.message || '加载失败，请稍后重试'
        setError(msg)
        toast.error(msg)
      })
      .finally(() => setLoading(false))
  }, [id])

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  // Error / not found state
  if (error || !ranking) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 px-margin-edge">
        <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center">
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="text-outline-variant"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <p className="text-body-lg text-on-surface-variant text-center">
          {error || '排行榜不存在'}
        </p>
        <button
          onClick={() => navigate('/home')}
          className="px-5 py-2.5 rounded-lg bg-primary text-on-primary text-label-sm hover:opacity-90 transition-opacity"
        >
          返回发现页
        </button>
      </div>
    )
  }

  const grouped = groupEntriesByTier(ranking.entries)

  return (
    <div className="max-w-4xl mx-auto pb-8">
      {/* Header */}
      <div className="px-margin-edge pt-6 pb-4">
        {/* Cover image */}
        {ranking.cover_url && (
          <div className="w-full h-48 rounded-xl overflow-hidden mb-4 bg-surface-container-high">
            <img
              src={ranking.cover_url}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Title */}
        <h1 className="text-display-lg text-on-surface mb-1">{ranking.title}</h1>

        {/* Description */}
        {ranking.description && (
          <p className="text-body-lg text-on-surface-variant mb-4 leading-relaxed">
            {ranking.description}
          </p>
        )}

        {/* Creator & Stats */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-surface-container-high flex-shrink-0">
            {ranking.user?.avatar_url ? (
              <img
                src={ranking.user.avatar_url}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-primary text-on-primary text-sm font-bold">
                {(ranking.user?.nickname || ranking.user?.username || '?')[0].toUpperCase()}
              </div>
            )}
          </div>
          <div>
            <p className="text-body-md text-on-surface font-medium">
              {ranking.user?.nickname || ranking.user?.username || '未知用户'}
            </p>
            <p className="text-label-sm text-on-surface-variant">
              {ranking.entries.length} 个条目 &middot; {ranking.view_count} 次浏览
            </p>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="mx-margin-edge h-px bg-border-light mb-2" />

      {/* Tier Rows */}
      <div className="space-y-1">
        {TIERS.map((tier) => {
          const tierKey = tier as string
          return (
            <TierRowReadonly
              key={tierKey}
              tier={tierKey as TierEnum}
              entries={grouped[tierKey]}
            />
          )
        })}

        {/* Pending entries (tier = null) */}
        {grouped['null'].length > 0 && (
          <div className="mt-6">
            <div className="px-margin-edge mb-2">
              <h2 className="text-body-md text-on-surface-variant font-medium">
                待分类
              </h2>
            </div>
            <TierRowReadonly tier={null} entries={grouped['null']} />
          </div>
        )}
      </div>
    </div>
  )
}
