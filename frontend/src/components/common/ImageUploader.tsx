import { useState, useRef, useCallback } from 'react'
import { compressImage, blobToFile } from '@/utils/compressImage'
import ImageCropper from './ImageCropper'
import { toast } from 'sonner'

interface ImageUploaderProps {
  /** 上传成功的回调 */
  onUploaded: (url: string) => void
  /** 上传 API 函数，接收 File 返回 Promise<string> */
  uploadFn: (file: File) => Promise<string>
  /** 当前图片 URL（用于显示已有图片） */
  currentUrl?: string
  /** 裁剪形状 */
  shape?: 'square' | 'circle'
  /** 是否启用裁剪 */
  enableCrop?: boolean
  /** 占位文本 */
  placeholder?: string
  /** 尺寸提示 */
  sizeHint?: string
  className?: string
}

export default function ImageUploader({
  onUploaded,
  uploadFn,
  currentUrl,
  shape = 'square',
  enableCrop = true,
  placeholder = '点击或拖拽上传图片',
  sizeHint = '推荐 1:1 比例',
  className = '',
}: ImageUploaderProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState(currentUrl || '')
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [showCropper, setShowCropper] = useState(false)
  const [, setCroppedFile] = useState<File | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // 处理文件选择
  const handleFile = useCallback(async (file: File) => {
    // 校验类型
    if (!file.type.startsWith('image/')) {
      toast.error('请选择图片文件')
      return
    }
    // 校验大小
    if (file.size > 10 * 1024 * 1024) {
      toast.error('文件大小不能超过 10MB')
      return
    }

    setPendingFile(file)

    if (enableCrop) {
      setShowCropper(true)
    } else {
      await doUpload(file)
    }
  }, [enableCrop, uploadFn, onUploaded])

  // 裁剪完成
  const handleCropComplete = async (blob: Blob) => {
    setShowCropper(false)
    if (!pendingFile) return
    const file = new File([blob], pendingFile.name, { type: blob.type || 'image/png' })
    setCroppedFile(file)
    await doUpload(file)
  }

  // 执行上传
  const doUpload = async (file: File) => {
    setUploading(true)
    try {
      // 前端压缩
      const compressed = await compressImage(file)
      const uploadFile = blobToFile(compressed, file)

      const url = await uploadFn(uploadFile)
      setPreview(url)
      onUploaded(url)
      toast.success('图片上传成功')
    } catch (err: any) {
      toast.error(err.message || '上传失败')
    } finally {
      setUploading(false)
      setPendingFile(null)
    }
  }

  // 拖拽事件
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  // 点击上传
  const handleClick = () => {
    fileInputRef.current?.click()
  }

  // 文件选择
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    // 重置 input 以便重复选择同一文件
    e.target.value = ''
  }

  // 剪贴板粘贴
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items
    if (!items) return
    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile()
        if (file) handleFile(file)
        break
      }
    }
  }, [handleFile])

  // 移除图片
  const handleRemove = () => {
    setPreview('')
    onUploaded('')
    setCroppedFile(null)
  }

  const hasImage = preview || currentUrl

  return (
    <>
      <div
        className={`relative ${className}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onPaste={handlePaste}
        tabIndex={0}
      >
        {hasImage ? (
          <div className="relative group">
            <div className={`overflow-hidden border border-gray-200 ${shape === 'circle' ? 'rounded-full w-24 h-24' : 'rounded-xl'} ${shape === 'square' ? 'w-28 h-28' : ''}`}>
              <img
                src={preview || currentUrl}
                alt="预览"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center gap-2">
              <button
                onClick={handleClick}
                className="text-white text-xs bg-white/20 px-2 py-1 rounded hover:bg-white/30"
                disabled={uploading}
              >
                {uploading ? '上传中...' : '更换'}
              </button>
              <button
                onClick={handleRemove}
                className="text-white text-xs bg-red-500/60 px-2 py-1 rounded hover:bg-red-500/80"
              >
                删除
              </button>
            </div>
          </div>
        ) : (
          <div
            onClick={handleClick}
            className={`
              flex flex-col items-center justify-center cursor-pointer
              border-2 border-dashed rounded-xl transition-all duration-200
              ${isDragOver
                ? 'border-brand-400 bg-brand-50 scale-[1.02]'
                : 'border-gray-300 hover:border-brand-300 hover:bg-gray-50'
              }
              ${shape === 'circle' ? 'w-24 h-24 rounded-full' : 'w-28 h-28'}
            `}
          >
            {uploading ? (
              <div className="w-6 h-6 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
            ) : (
              <>
                <span className="text-2xl text-gray-300">📷</span>
                <span className="text-[10px] text-gray-400 mt-1 text-center px-1">
                  {placeholder}
                </span>
              </>
            )}
          </div>
        )}

        {/* 隐藏的文件选择器 */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          className="hidden"
          onChange={handleFileChange}
        />

        {sizeHint && !hasImage && (
          <p className="text-xs text-gray-400 mt-2">{sizeHint}</p>
        )}
      </div>

      {/* 裁剪弹窗 */}
      {showCropper && pendingFile && (
        <ImageCropper
          file={pendingFile}
          shape={shape}
          aspectRatio={1}
          onCrop={handleCropComplete}
          onClose={() => {
            setShowCropper(false)
            setPendingFile(null)
          }}
        />
      )}
    </>
  )
}
