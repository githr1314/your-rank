import { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'

interface ImageCropperProps {
  file: File
  aspectRatio?: number // 宽高比，1=方形，null=圆形
  shape?: 'square' | 'circle'
  onCrop: (croppedBlob: Blob) => void
  onClose: () => void
}

export default function ImageCropper({
  file,
  shape = 'square',
  onCrop,
  onClose,
}: ImageCropperProps) {
  const [imageSrc, setImageSrc] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [startPos, setStartPos] = useState({ x: 0, y: 0 })
  const [crop, setCrop] = useState({ x: 0, y: 0, size: 200 })
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 })

  const imageRef = useRef<HTMLImageElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // 加载图片
  useEffect(() => {
    const url = URL.createObjectURL(file)
    setImageSrc(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  // 图片加载完成后初始化裁剪区域
  const onImageLoad = useCallback(() => {
    if (!imageRef.current) return
    const { naturalWidth, naturalHeight } = imageRef.current
    setImageDimensions({ width: naturalWidth, height: naturalHeight })

    // 初始裁剪框为图片最小边的 60%
    const minDim = Math.min(naturalWidth, naturalHeight)
    const size = Math.round(minDim * 0.6)
    setCrop({
      x: Math.round((naturalWidth - size) / 2),
      y: Math.round((naturalHeight - size) / 2),
      size,
    })
  }, [])

  // 鼠标/触摸拖拽裁剪
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
    setStartPos({ x: e.clientX - crop.x, y: e.clientY - crop.y })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    const newX = Math.max(0, Math.min(e.clientX - startPos.x, imageDimensions.width - crop.size))
    const newY = Math.max(0, Math.min(e.clientY - startPos.y, imageDimensions.height - crop.size))
    setCrop((prev) => ({ ...prev, x: newX, y: newY }))
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // 执行裁剪
  const handleCrop = () => {
    const canvas = document.createElement('canvas')
    canvas.width = crop.size
    canvas.height = crop.size

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 如果是圆形，裁剪路径
    if (shape === 'circle') {
      ctx.beginPath()
      ctx.arc(crop.size / 2, crop.size / 2, crop.size / 2, 0, Math.PI * 2)
      ctx.closePath()
      ctx.clip()
    }

    // 计算显示比例
    const img = imageRef.current
    if (!img) return

    ctx.drawImage(
      img,
      crop.x,
      crop.y,
      crop.size,
      crop.size,
      0,
      0,
      crop.size,
      crop.size
    )

    canvas.toBlob(
      (blob) => {
        if (blob) onCrop(blob)
      },
      file.type || 'image/png',
      0.9
    )
  }

  if (!imageSrc) return null

  // 检查裁剪是否有效
  const isCropValid = crop.size > 10

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div
        className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-modal animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-bold text-lg text-gray-900 mb-4">裁剪图片</h3>

        {/* 裁剪容器 */}
        <div
          ref={containerRef}
          className="relative overflow-hidden rounded-lg bg-gray-100 mb-4"
          style={{ maxHeight: '400px' }}
        >
          <img
            ref={imageRef}
            src={imageSrc}
            alt="裁剪预览"
            className="w-full h-auto"
            onLoad={onImageLoad}
            draggable={false}
          />

          {/* 裁剪遮罩 */}
          {imageDimensions.width > 0 && (
            <div
              className="absolute inset-0"
              style={{
                background: 'rgba(0,0,0,0.4)',
                clipPath: shape === 'circle'
                  ? `circle(${crop.size / 2}px at ${crop.x + crop.size / 2}px ${crop.y + crop.size / 2}px)`
                  : `inset(${crop.y}px ${imageDimensions.width - crop.x - crop.size}px ${imageDimensions.height - crop.y - crop.size}px ${crop.x}px)`,
              }}
            />
          )}

          {/* 裁剪框边缘 */}
          {imageDimensions.width > 0 && (
            <div
              className={`absolute border-2 border-white cursor-move ${shape === 'circle' ? 'rounded-full' : 'rounded'}`}
              style={{
                left: crop.x,
                top: crop.y,
                width: crop.size,
                height: crop.size,
              }}
              onMouseDown={handleMouseDown}
            >
              {/* 四角手柄 */}
              <div className="absolute -top-1 -left-1 w-3 h-3 bg-white rounded-sm shadow" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-sm shadow" />
              <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-white rounded-sm shadow" />
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-white rounded-sm shadow" />
            </div>
          )}
        </div>

        <p className="text-xs text-gray-400 mb-4 text-center">拖拽裁剪框调整区域</p>

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose}>取消</Button>
          <Button onClick={handleCrop} disabled={!isCropValid}>
            确认裁剪
          </Button>
        </div>
      </div>
    </div>
  )
}
