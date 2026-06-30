import { useRef, useState, useCallback, useEffect, type DragEvent } from 'react'
import { cn } from '@/utils/cn'
import { ALLOWED_IMAGE_TYPES, MAX_FILE_SIZE, IMAGE_MAX_DIMENSION } from '@/utils/constants'
import http from '@/services/http'
import type { APIResponse, UploadResponse } from '@/types'

export type CropShape = 'circle' | 'square'

export interface ImageUploaderProps {
  value?: string
  onChange?: (url: string) => void
  cropShape?: CropShape
  className?: string
}

/**
 * 图片上传组件。
 * 支持三种上传方式：点击选择、拖拽、剪贴板粘贴。
 * 上传前自动 canvas 压缩（长边 <= 1920px，质量 0.8）。
 * 显示上传进度条，上传成功后回显图片预览。
 */
export function ImageUploader({ value, onChange, cropShape = 'square', className }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(value ?? null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  // 清理本地预览 URL
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  const validateFile = useCallback((file: File): string | null => {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return '不支持的文件格式，仅支持 JPG/PNG/GIF/WebP'
    }
    if (file.size > MAX_FILE_SIZE) {
      return `文件超过 10MB 限制`
    }
    return null
  }, [])

  const compressImage = useCallback((file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        let { width, height } = img
        if (width > IMAGE_MAX_DIMENSION || height > IMAGE_MAX_DIMENSION) {
          const ratio = Math.min(IMAGE_MAX_DIMENSION / width, IMAGE_MAX_DIMENSION / height)
          width = Math.round(width * ratio)
          height = Math.round(height * ratio)
        }

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('无法创建 canvas 上下文'))
          return
        }
        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob)
            } else {
              reject(new Error('图片压缩失败'))
            }
          },
          file.type,
          0.8,
        )
      }
      img.onerror = () => {
        reject(new Error('图片加载失败'))
      }
      img.src = URL.createObjectURL(file)
    })
  }, [])

  const handleFileProcess = useCallback(
    async (file: File) => {
      setError(null)

      const validationError = validateFile(file)
      if (validationError) {
        setError(validationError)
        return
      }

      // 显示临时本地预览
      const localUrl = URL.createObjectURL(file)
      setPreviewUrl(localUrl)

      // 压缩
      let compressedBlob: Blob
      try {
        compressedBlob = await compressImage(file)
      } catch (err) {
        setError(err instanceof Error ? err.message : '图片处理失败')
        URL.revokeObjectURL(localUrl)
        setPreviewUrl(null)
        return
      }

      // 构造压缩后的 File
      const compressedFile = new File([compressedBlob], file.name, {
        type: file.type,
        lastModified: Date.now(),
      })

      // 上传，使用 onUploadProgress 跟踪进度
      setIsUploading(true)
      setUploadProgress(0)

      try {
        const uploadFormData = new FormData()
        uploadFormData.append('file', compressedFile)

        const res = await http.post<APIResponse<UploadResponse>>('/upload', uploadFormData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 60000,
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const pct = Math.round((progressEvent.loaded * 100) / progressEvent.total)
              setUploadProgress(Math.min(pct, 99))
            }
          },
        })

        // 成功后替换预览为真实 URL
        const resultUrl = res.data.data.url
        URL.revokeObjectURL(localUrl)
        setPreviewUrl(resultUrl)
        onChange?.(resultUrl)
        setUploadProgress(100)
      } catch (err) {
        // 上传失败，回退到本地预览
        const message =
          err instanceof Error ? err.message : typeof err === 'object' && err !== null && 'response' in err
            ? '上传失败，请重试'
            : '上传失败'
        setError(message)
      } finally {
        setIsUploading(false)
      }
    },
    [validateFile, compressImage, onChange],
  )

  // 点击触发文件选择
  const handleClick = () => {
    if (!isUploading) {
      inputRef.current?.click()
    }
  }

  // 文件输入变化
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileProcess(file)
    }
    // 清空 input 以便重复选择同一文件
    e.target.value = ''
  }

  // 拖拽事件
  const handleDragOver = (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }

  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleFileProcess(file)
    }
  }

  // 剪贴板粘贴
  const handlePaste = useCallback(
    (e: ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items) return

      for (const item of Array.from(items)) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile()
          if (file) {
            e.preventDefault()
            handleFileProcess(file)
            break
          }
        }
      }
    },
    [handleFileProcess],
  )

  // 注册全局粘贴事件
  useEffect(() => {
    const el = dropZoneRef.current
    if (!el) return

    el.addEventListener('paste', handlePaste)
    return () => el.removeEventListener('paste', handlePaste)
  }, [handlePaste])

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div
        ref={dropZoneRef}
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') handleClick()
        }}
        className={cn(
          'relative w-full aspect-video max-h-48 flex flex-col items-center justify-center gap-2',
          'rounded-xl border-2 border-dashed outline-none cursor-pointer',
          'transition-all duration-200 select-none',
          isDragOver
            ? 'border-primary bg-primary/5'
            : previewUrl
              ? 'border-transparent'
              : 'border-outline-variant hover:border-primary/50 hover:bg-surface-container-low/50',
          isUploading && 'pointer-events-none',
        )}
      >
        {/* 预览 */}
        {previewUrl && !isUploading && (
          <div className="absolute inset-0 rounded-xl overflow-hidden">
            <img
              src={previewUrl}
              alt="预览"
              className={cn(
                'w-full h-full object-cover',
                cropShape === 'circle' && 'rounded-full',
              )}
            />
            {/* hover 遮罩 */}
            <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center group">
              <span className="text-white text-body-md opacity-0 group-hover:opacity-100 transition-opacity">
                点击更换图片
              </span>
            </div>
          </div>
        )}

        {/* 占位图标 + 文字 */}
        {!previewUrl && !isUploading && (
          <>
            <svg
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-outline-variant/80"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-body-md text-on-surface-variant">点击或拖拽上传图片</span>
              <span className="text-label-sm text-on-surface-variant/60">支持 JPG / PNG / GIF / WebP，最大 10MB</span>
            </div>
          </>
        )}

        {/* 上传进度 */}
        {isUploading && (
          <div className="absolute inset-0 rounded-xl bg-black/30 flex flex-col items-center justify-center gap-2">
            <div className="w-3/4 max-w-xs h-2 rounded-full bg-white/30 overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-300 ease-out"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <span className="text-white text-label-sm">上传中 {uploadProgress}%</span>
          </div>
        )}

        {/* 裁剪形状指示器 */}
        {cropShape === 'circle' && previewUrl && !isUploading && (
          <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/40 text-white text-label-sm">
            圆形裁剪
          </div>
        )}
      </div>

      {/* 错误提示 */}
      {error && (
        <p className="text-label-sm text-error mx-1">{error}</p>
      )}

      {/* 隐藏的文件输入 */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  )
}
