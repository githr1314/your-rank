import { useRef, useState, useEffect } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import QRCode from 'qrcode'
import html2canvas from 'html2canvas'
import toast from 'react-hot-toast'
import type { RankingResponse, EntryResponse } from '@/types'
import { TIERS } from '@/utils/constants'
import { cn } from '@/utils/cn'

export interface SharePosterModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  ranking: RankingResponse
  shareUrl: string
}

/**
 * Tier 配置 — 用于海报中渲染条目卡片时显示等级徽章颜色。
 */
const POSTER_TIER_CONFIG: Record<string, { bg: string; text: string }> = {
  S: { bg: '#FFD700', text: '#1a1c1c' },
  A: { bg: '#FF3B30', text: '#ffffff' },
  B: { bg: '#AF52DE', text: '#ffffff' },
  C: { bg: '#48484A', text: '#ffffff' },
  D: { bg: '#AEAEB2', text: '#1a1c1c' },
}

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
 * 分享海报生成弹窗。
 * 使用 html2canvas 捕获 Tier List 内容，qrcode 生成分享链接二维码，
 * 合成为一张可下载的长图海报。
 */
export function SharePosterModal({
  open,
  onOpenChange,
  ranking,
  shareUrl,
}: SharePosterModalProps) {
  const posterRef = useRef<HTMLDivElement>(null)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const grouped = groupEntriesByTier(ranking.entries)

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!open) {
      setDownloadUrl(null)
      setIsGenerating(false)
    }
  }, [open])

  /**
   * 生成海报：
   * 1. 使用 html2canvas 捕获海报容器内容
   * 2. 生成 QR 码
   * 3. 合成最终海报 canvas
   */
  const generatePoster = async () => {
    if (!posterRef.current) return
    setIsGenerating(true)

    try {
      // Capture poster content
      const contentCanvas = await html2canvas(posterRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#f9f9f9',
        logging: false,
      })

      // Generate QR code
      const qrCanvas = document.createElement('canvas')
      await QRCode.toCanvas(qrCanvas, shareUrl, {
        width: 160,
        margin: 2,
        color: {
          dark: '#1a1c1c',
          light: '#ffffff',
        },
      })

      // Create composite poster canvas
      const padding = 32
      const qrSize = 120
      const footerHeight = qrSize + padding * 2

      const finalCanvas = document.createElement('canvas')
      finalCanvas.width = contentCanvas.width
      finalCanvas.height = contentCanvas.height + footerHeight
      const ctx = finalCanvas.getContext('2d')!

      // White background (full canvas)
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height)

      // Draw captured content
      ctx.drawImage(contentCanvas, 0, 0)

      // Draw QR code in bottom-right
      const qrX = finalCanvas.width - qrSize - padding
      const qrY = contentCanvas.height + padding
      ctx.drawImage(qrCanvas, qrX, qrY, qrSize, qrSize)

      // Draw "Your Rank" branding text on left of bottom area
      ctx.fillStyle = '#1a1c1c'
      ctx.font = 'bold 18px Inter, system-ui, sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText('Your Rank', padding, contentCanvas.height + qrSize / 2 + 4)

      ctx.font = '14px Inter, system-ui, sans-serif'
      ctx.fillStyle = '#414755'
      ctx.fillText('扫码查看完整排行', padding, contentCanvas.height + qrSize / 2 + 26)

      setDownloadUrl(finalCanvas.toDataURL('image/png'))
    } catch (err) {
      console.error('Failed to generate poster:', err)
      toast.error('海报生成失败，请重试')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownload = () => {
    if (!downloadUrl) return
    const link = document.createElement('a')
    link.download = `your-rank-${ranking.share_code || 'poster'}.png`
    link.href = downloadUrl
    link.click()
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl)
    toast.success('链接已复制到剪贴板')
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 data-[state=open]:animate-fade-in" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-32px)] max-w-md max-h-[85vh] bg-surface-container-lowest rounded-xl shadow-lg data-[state=open]:animate-fade-in outline-none flex flex-col">
          <Dialog.Title className="text-headline-sm text-on-surface px-6 pt-6 pb-2">
            分享海报
          </Dialog.Title>

          <div className="flex-1 overflow-auto px-6 py-4">
            {/* Show spinner while generating, show poster preview afterwards */}
            {isGenerating && !downloadUrl && (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
              </div>
            )}

            {/* Generated poster preview */}
            {downloadUrl && (
              <img
                src={downloadUrl}
                alt="分享海报预览"
                className="w-full rounded-lg shadow-sm"
              />
            )}

            {!isGenerating && !downloadUrl && (
              <div className="flex flex-col items-center justify-center py-8 gap-3">
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="text-outline-variant"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
                <p className="text-body-md text-on-surface-variant">
                  点击下方按钮生成精美分享海报
                </p>
              </div>
            )}

            {/* Hidden poster content for html2canvas capture */}
            <div
              ref={posterRef}
              className="w-[375px] bg-[#f9f9f9] p-4"
              style={{
                position: 'fixed',
                left: '-9999px',
                top: 0,
              }}
            >
              {/* Cover */}
              {ranking.cover_url && (
                <div className="w-full h-36 rounded-lg overflow-hidden mb-3 bg-[#e8e8e8]">
                  <img
                    src={ranking.cover_url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Title */}
              <h2 className="text-lg font-bold text-[#1a1c1c] mb-1">
                {ranking.title}
              </h2>
              {ranking.description && (
                <p className="text-xs text-[#414755] mb-3 leading-relaxed">
                  {ranking.description}
                </p>
              )}

              {/* Creator */}
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[rgba(0,0,0,0.06)]">
                <div className="w-6 h-6 rounded-full bg-[#0058bc] flex items-center justify-center text-white text-[10px] font-bold">
                  {(ranking.user?.nickname || ranking.user?.username || '?')[0].toUpperCase()}
                </div>
                <span className="text-xs text-[#1a1c1c]">
                  {ranking.user?.nickname || ranking.user?.username}
                </span>
              </div>

              {/* Tier rows */}
              {TIERS.map((tier) => {
                const tierKey = tier as string
                const config = POSTER_TIER_CONFIG[tierKey] || { bg: '#e8e8e8', text: '#717786' }
                const entries = grouped[tierKey]

                return (
                  <div key={tierKey} className="mb-2 flex items-start gap-2">
                    {/* Tier badge */}
                    <div
                      className="flex-shrink-0 w-7 h-7 rounded-md flex items-center justify-center text-[11px] font-bold shadow-sm"
                      style={{ backgroundColor: config.bg, color: config.text }}
                    >
                      {tierKey}
                    </div>

                    {/* Entry cards */}
                    <div className="flex-1 flex flex-wrap gap-1.5">
                      {entries.length > 0
                        ? entries.map((entry) => (
                            <div
                              key={entry.id}
                              className="w-16 rounded-lg bg-white border border-[rgba(0,0,0,0.06)] overflow-hidden shadow-sm"
                            >
                              <div className="w-full aspect-[4/3] bg-[#e8e8e8] overflow-hidden">
                                {entry.image_url && (
                                  <img
                                    src={entry.image_url}
                                    alt=""
                                    className="w-full h-full object-cover"
                                  />
                                )}
                              </div>
                              <div className="px-1 py-0.5">
                                <p className="text-[10px] text-[#1a1c1c] truncate">
                                  {entry.name}
                                </p>
                              </div>
                            </div>
                          ))
                        : (
                          <div className="h-8 flex-1 rounded-md border border-dashed border-[rgba(0,0,0,0.1)]" />
                        )}
                    </div>
                  </div>
                )
              })}

              {/* Unassigned entries */}
              {grouped['null'].length > 0 && (
                <div className="mt-3 flex items-start gap-2">
                  <div className="flex-shrink-0 w-7 h-7 rounded-md flex items-center justify-center text-[11px] font-bold shadow-sm bg-[#e8e8e8] text-[#717786]">
                    ?
                  </div>
                  <div className="flex-1 flex flex-wrap gap-1.5">
                    {grouped['null'].map((entry) => (
                      <div
                        key={entry.id}
                        className="w-16 rounded-lg bg-white border border-[rgba(0,0,0,0.06)] overflow-hidden shadow-sm"
                      >
                        <div className="w-full aspect-[4/3] bg-[#e8e8e8] overflow-hidden">
                          {entry.image_url && (
                            <img
                              src={entry.image_url}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                        <div className="px-1 py-0.5">
                          <p className="text-[10px] text-[#1a1c1c] truncate">
                            {entry.name}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 px-6 pb-6 pt-2">
            <Dialog.Close asChild>
              <button className="px-4 py-2 rounded-lg bg-surface-container text-on-surface-variant text-label-sm hover:bg-surface-container-high transition-colors">
                关闭
              </button>
            </Dialog.Close>
            <button
              onClick={handleCopyLink}
              className="px-4 py-2 rounded-lg border border-outline-variant text-on-surface text-label-sm hover:bg-surface-container transition-colors"
            >
              复制链接
            </button>
            {downloadUrl ? (
              <button
                onClick={handleDownload}
                className="px-4 py-2 rounded-lg bg-primary text-on-primary text-label-sm hover:bg-primary-container hover:text-on-primary-container transition-colors"
              >
                下载海报
              </button>
            ) : (
              <button
                onClick={generatePoster}
                disabled={isGenerating}
                className={cn(
                  'px-4 py-2 rounded-lg text-label-sm transition-colors',
                  isGenerating
                    ? 'bg-surface-container text-on-surface-variant/50 cursor-not-allowed'
                    : 'bg-primary text-on-primary hover:bg-primary-container hover:text-on-primary-container',
                )}
              >
                {isGenerating ? '生成中...' : '生成海报'}
              </button>
            )}
          </div>

          <Dialog.Close asChild>
            <button
              className="absolute right-4 top-4 flex items-center justify-center w-7 h-7 rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
              aria-label="关闭"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M12 4L4 12M4 4l8 8"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
