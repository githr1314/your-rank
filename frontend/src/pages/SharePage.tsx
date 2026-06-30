import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import * as shareAPI from '@/services/shareAPI'
import type { EntryResponse, RankingResponse, TierEnum } from '@/types'
import { TIERS } from '@/utils/constants'
import { useAuth } from '@/hooks/useAuth'
import { TierRowReadonly } from '@/components/ranking/TierRowReadonly'
import { SharePosterModal } from '@/components/shared/SharePosterModal'

/**
 * 将条目按等级分组并排序。
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
 * 分享页。
 * 通过 8 位分享码加载排行数据，纯展示完整 Tier List。
 * 包含分享海报生成、创建者信息、"自己也来创建一个" CTA。
 * 路由: /s/:code
 */
export function SharePage() {
  const { code } = useParams<{ code: string }>()
  const { isAuthenticated } = useAuth()
  const [ranking, setRanking] = useState<RankingResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showPoster, setShowPoster] = useState(false)

  const shareUrl = code
    ? `${window.location.origin}/s/${code}`
    : window.location.href

  useEffect(() => {
    if (!code) return

    setLoading(true)
    setError(null)

    shareAPI
      .getByShareCode(code)
      .then((res) => {
        setRanking(res.data)
      })
      .catch((err) => {
        const msg =
          err?.response?.data?.message || '排行榜不存在或已删除'
        setError(msg)
        toast.error(msg)
      })
      .finally(() => setLoading(false))
  }, [code])

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center flex-1">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  // Error / not found state
  if (error || !ranking) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 gap-4 px-6">
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
        <Link
          to="/home"
          className="px-5 py-2.5 rounded-lg bg-primary text-on-primary text-label-sm no-underline hover:opacity-90 transition-opacity"
        >
          浏览公开排行
        </Link>
      </div>
    )
  }

  const grouped = groupEntriesByTier(ranking.entries)

  return (
    <div className="flex-1 flex flex-col">
      {/* Scrollable content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto pb-8">
          {/* Header */}
          <div className="px-margin-edge pt-8 pb-4">
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
            <h1 className="text-display-lg text-on-surface mb-1">
              {ranking.title}
            </h1>

            {/* Description */}
            {ranking.description && (
              <p className="text-body-lg text-on-surface-variant mb-4 leading-relaxed">
                {ranking.description}
              </p>
            )}

            {/* Creator info */}
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

            {/* Pending entries */}
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
      </div>

      {/* Footer — sticky at the bottom */}
      <div className="border-t border-border-light bg-glass-bg backdrop-blur-xl flex-shrink-0">
        <div className="max-w-4xl mx-auto px-margin-edge py-4 flex items-center justify-between">
          <p className="text-label-sm text-on-surface-variant">
            由 Your Rank 生成
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowPoster(true)}
              className="px-4 py-2 rounded-lg border border-outline-variant text-on-surface text-label-sm hover:bg-surface-container transition-colors"
            >
              生成海报
            </button>
            <Link
              to={isAuthenticated ? '/create' : '/register'}
              className="px-4 py-2 rounded-lg bg-primary text-on-primary text-label-sm no-underline hover:opacity-90 transition-opacity"
            >
              自己也来创建一个
            </Link>
          </div>
        </div>
      </div>

      {/* Share Poster Modal */}
      <SharePosterModal
        open={showPoster}
        onOpenChange={setShowPoster}
        ranking={ranking}
        shareUrl={shareUrl}
      />
    </div>
  )
}
