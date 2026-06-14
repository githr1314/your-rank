import { useState, useRef, useCallback } from 'react'
import type { Entry, Ranking, Tier } from '@/types'
import { TIER_INFO, TIER_ORDER } from '@/utils/constants'
import { Button } from '@/components/ui/button'

interface SharePosterModalProps {
  ranking: Ranking
  shareUrl: string
  onClose: () => void
}

export default function SharePosterModal({ ranking, shareUrl, onClose }: SharePosterModalProps) {
  const [generating, setGenerating] = useState(false)
  const [posterUrl, setPosterUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const posterRef = useRef<HTMLDivElement>(null)
  const qrCanvasRef = useRef<HTMLCanvasElement>(null)

  // 按等级分组
  const entriesByTier: Record<Tier, Entry[]> = { S: [], A: [], B: [], C: [], D: [] }
  ranking.entries?.forEach((e) => {
    if (e.tier && e.tier in entriesByTier) {
      entriesByTier[e.tier as Tier].push(e)
    }
  })

  // 生成二维码（使用内置 canvas 生成）
  const generateQRCode = useCallback(async (): Promise<string> => {
    // 动态导入 qrcode
    const QRCode = (await import('qrcode')).default
    const canvas = document.createElement('canvas')
    await QRCode.toCanvas(canvas, shareUrl, {
      width: 200,
      margin: 2,
      color: { dark: '#1F2937', light: '#FFFFFF' },
    })
    return canvas.toDataURL('image/png')
  }, [shareUrl])

  // 生成海报
  const generatePoster = useCallback(async () => {
    setGenerating(true)
    try {
      // 等待 DOM 渲染完成
      await new Promise((resolve) => setTimeout(resolve, 100))

      // 生成二维码
      const qrDataUrl = await generateQRCode()

      // 渲染二维码到海报
      if (qrCanvasRef.current) {
        const img = new Image()
        img.src = qrDataUrl
        await new Promise((resolve) => { img.onload = resolve })
        const ctx = qrCanvasRef.current.getContext('2d')
        if (ctx) {
          ctx.clearRect(0, 0, 200, 200)
          ctx.drawImage(img, 0, 0, 200, 200)
        }
      }

      // 使用 html2canvas 截图海报区域
      const html2canvas = (await import('html2canvas')).default
      if (!posterRef.current) return

      const canvas = await html2canvas(posterRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#FFFFFF',
        logging: false,
      })

      setPosterUrl(canvas.toDataURL('image/png'))
    } catch (err) {
      console.error('海报生成失败:', err)
      // 降级：分享链接
      setPosterUrl(null)
    } finally {
      setGenerating(false)
    }
  }, [shareUrl, generateQRCode])

  // 下载海报
  const handleDownload = () => {
    if (!posterUrl) return
    const a = document.createElement('a')
    a.href = posterUrl
    a.download = `${ranking.title}-排行海报.png`
    a.click()
  }

  // 复制到剪贴板
  const handleCopy = async () => {
    if (!posterUrl) return
    try {
      const blob = await (await fetch(posterUrl)).blob()
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob }),
      ])
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // 降级：复制链接
      navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-modal animate-slide-up max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg">分享海报</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
          </div>

          {/* 生成按钮 */}
          {!posterUrl && (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">生成包含 Tier List 的精美海报，分享给朋友</p>
              <Button onClick={generatePoster} disabled={generating}>
                {generating ? '生成中...' : '生成海报'}
              </Button>
            </div>
          )}

          {/* 海报预览 */}
          {posterUrl && (
            <div className="space-y-4">
              <img
                src={posterUrl}
                alt="分享海报"
                className="w-full rounded-xl border border-gray-200 shadow-sm"
              />

              <div className="flex gap-2">
                <Button onClick={handleDownload} className="flex-1">
                  💾 下载海报
                </Button>
                <Button variant="outline" onClick={handleCopy} className="flex-1">
                  {copied ? '✓ 已复制' : '📋 复制到剪贴板'}
                </Button>
              </div>

              <Button variant="outline" onClick={generatePoster} disabled={generating} className="w-full">
                {generating ? '重新生成中...' : '重新生成'}
              </Button>
            </div>
          )}

          {/* 底部操作 */}
          <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => {
                navigator.clipboard.writeText(shareUrl)
              }}
            >
              🔗 复制分享链接
            </Button>
          </div>
        </div>
      </div>

      {/* 隐藏的海报模板（用于 html2canvas 截图） */}
      <div className="fixed left-[-9999px] top-0">
        <div
          ref={posterRef}
          className="bg-white"
          style={{ width: '600px', padding: '24px' }}
        >
          {/* 标题区 */}
          <div className="text-center mb-6">
            {ranking.cover_url && (
              <img
                src={ranking.cover_url}
                alt="封面"
                className="w-full h-48 object-cover rounded-xl mb-4"
                crossOrigin="anonymous"
              />
            )}
            <h2 className="text-2xl font-bold text-gray-900">{ranking.title}</h2>
            {ranking.description && (
              <p className="text-sm text-gray-500 mt-1">{ranking.description}</p>
            )}
          </div>

          {/* Tier List */}
          <div className="space-y-3">
            {TIER_ORDER.map((tier) => {
              const info = TIER_INFO[tier]
              const entries = entriesByTier[tier] || []
              const sorted = [...entries].sort((a, b) => a.sort_order - b.sort_order)

              return (
                <div key={tier} className="flex items-stretch gap-2">
                  {/* Tier 标签 */}
                  <div
                    className="flex-shrink-0 w-16 flex items-center justify-center rounded-lg font-bold text-lg"
                    style={{
                      background:
                        tier === 'S' ? 'linear-gradient(135deg, #FFD700, #FFA500)' :
                        tier === 'A' ? 'linear-gradient(135deg, #FF4500, #FF8C00)' :
                        tier === 'B' ? 'linear-gradient(135deg, #8B5CF6, #A78BFA)' :
                        tier === 'C' ? 'linear-gradient(135deg, #6B7280, #9CA3AF)' :
                        'linear-gradient(135deg, #D1D5DB, #E5E7EB)',
                      color: tier === 'C' || tier === 'D' ? '#374151' : '#FFFFFF',
                    }}
                  >
                    <span>{info.emoji}</span>
                    <span className="ml-1">{tier}</span>
                  </div>

                  {/* 条目列表 */}
                  <div className="flex-1 bg-gray-50 rounded-lg p-2 min-h-[60px] flex flex-wrap gap-2 content-start">
                    {sorted.length > 0 ? (
                      sorted.map((entry) => (
                        <div
                          key={entry.id}
                          className="bg-white rounded border border-gray-200 px-3 py-2 flex items-center gap-2 shadow-sm"
                        >
                          {entry.image_url && (
                            <img
                              src={entry.image_url}
                              alt=""
                              className="w-8 h-8 rounded object-cover"
                              crossOrigin="anonymous"
                            />
                          )}
                          <span className="text-sm text-gray-800 font-medium">{entry.name}</span>
                        </div>
                      ))
                    ) : (
                      <span className="text-xs text-gray-300 italic p-2">（空）</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* 底部：二维码 + 品牌 */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
            <div>
              <p className="text-lg font-bold text-brand-600">Your Rank</p>
              <p className="text-xs text-gray-400">你的排行，你说了算</p>
            </div>
            <div className="flex items-center gap-3">
              <canvas ref={qrCanvasRef} width={200} height={200} className="w-16 h-16" />
              <span className="text-[10px] text-gray-400 max-w-[100px]">
                扫码查看完整排行
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
