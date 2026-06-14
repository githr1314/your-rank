import { useState, useRef, useCallback } from 'react'
import { compressImage, blobToFile } from '@/utils/compressImage'
import { toast } from 'sonner'

interface UploadFileItem {
  id: string
  file: File
  name: string
  status: 'pending' | 'uploading' | 'done' | 'error'
  progress: number
  url?: string
  error?: string
}

interface UploadBatchProps {
  /** 上传完成回调（全部完成后调用） */
  onComplete: (urls: string[]) => void
  /** 单个文件上传 API */
  uploadFn: (file: File) => Promise<string>
  /** 最大文件数 */
  maxFiles?: number
  /** 是否多选 */
  multiple?: boolean
  /** 已上传的图片 URLs */
  existingUrls?: string[]
}

let fileIdCounter = 0
function nextFileId(): string {
  fileIdCounter += 1
  return `file-${fileIdCounter}-${Date.now()}`
}

export default function UploadBatch({
  onComplete,
  uploadFn,
  maxFiles = 9,
  multiple = true,
  existingUrls = [],
}: UploadBatchProps) {
  const [files, setFiles] = useState<UploadFileItem[]>(
    existingUrls.map((url, i) => ({
      id: `existing-${i}`,
      file: new File([], `existing-${i}`),
      name: url.split('/').pop() || `图片 ${i + 1}`,
      status: 'done' as const,
      progress: 100,
      url,
    }))
  )
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const uploadingRef = useRef(false)

  const currentCount = files.filter((f) => f.status === 'done' || f.status === 'uploading').length
  const remaining = maxFiles - currentCount

  // 上传单个文件
  const uploadSingle = async (item: UploadFileItem) => {
    try {
      // 前端压缩
      const compressed = await compressImage(item.file)
      const uploadFile = blobToFile(compressed, item.file)

      const url = await uploadFn(uploadFile)

      setFiles((prev) =>
        prev.map((f) =>
          f.id === item.id
            ? { ...f, status: 'done' as const, progress: 100, url }
            : f
        )
      )
      return url
    } catch (err: any) {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === item.id
            ? { ...f, status: 'error' as const, error: err.message || '上传失败' }
            : f
        )
      )
      return null
    }
  }

  // 处理文件选择
  const handleFiles = useCallback(async (selectedFiles: FileList | File[]) => {
    if (uploadingRef.current) return

    const fileArray = Array.from(selectedFiles)

    // 校验数量和类型
    const validFiles = fileArray.filter((f) => {
      if (!f.type.startsWith('image/')) {
        toast.error(`${f.name} 不是图片文件`)
        return false
      }
      if (f.size > 10 * 1024 * 1024) {
        toast.error(`${f.name} 超过 10MB`)
        return false
      }
      return true
    })

    if (validFiles.length === 0) return

    if (validFiles.length > remaining) {
      toast.error(`最多上传 ${maxFiles} 张图片`)
      return
    }

    const newItems: UploadFileItem[] = validFiles.map((file) => ({
      id: nextFileId(),
      file,
      name: file.name,
      status: 'pending' as const,
      progress: 0,
    }))

    setFiles((prev) => [...prev, ...newItems])
    uploadingRef.current = true

    // 逐个上传
    const successfulUrls: string[] = []
    for (const item of newItems) {
      // 更新为上传中
      setFiles((prev) =>
        prev.map((f) =>
          f.id === item.id ? { ...f, status: 'uploading' as const } : f
        )
      )

      // 模拟进度动画
      const progressInterval = setInterval(() => {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === item.id && f.progress < 90
              ? { ...f, progress: f.progress + 10 }
              : f
          )
        )
      }, 200)

      const url = await uploadSingle(item)
      clearInterval(progressInterval)

      if (url) {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === item.id ? { ...f, progress: 100 } : f
          )
        )
        successfulUrls.push(url)
      }
    }

    uploadingRef.current = false

    if (successfulUrls.length > 0) {
      toast.success(`成功上传 ${successfulUrls.length} 张图片`)
      onComplete(successfulUrls)
    }
  }, [remaining, maxFiles, uploadFn, onComplete])

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
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files)
    }
  }

  // 文件选择
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files)
    }
    e.target.value = ''
  }

  // 移除文件
  const handleRemove = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id))
  }

  // 重试
  const handleRetry = (id: string) => {
    const item = files.find((f) => f.id === id)
    if (item && item.file.size > 0) {
      uploadingRef.current = true
      uploadSingle(item).then((url) => {
        uploadingRef.current = false
        if (url) {
          onComplete([url])
        }
      })
    }
  }

  return (
    <div className="space-y-3">
      {/* 上传区域 */}
      {remaining > 0 && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`
            border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200
            ${isDragOver
              ? 'border-brand-400 bg-brand-50 scale-[1.01]'
              : 'border-gray-300 hover:border-brand-300 hover:bg-gray-50'
            }
          `}
        >
          {isDragOver ? (
            <p className="text-brand-600 font-medium text-sm">放开以上传图片</p>
          ) : (
            <>
              <span className="text-3xl block mb-2">📸</span>
              <p className="text-sm text-gray-500">
                拖拽图片到此处，或点击选择
              </p>
              <p className="text-xs text-gray-400 mt-1">
                支持 JPG/PNG/GIF/WebP，每文件最大 10MB，最多 {maxFiles} 张
              </p>
              <p className="text-xs text-gray-400">
                还可上传 {remaining} 张
              </p>
            </>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            className="hidden"
            multiple={multiple}
            onChange={handleFileChange}
          />
        </div>
      )}

      {/* 文件列表 */}
      {files.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {files.map((item) => (
            <div
              key={item.id}
              className="relative bg-white rounded-lg border border-gray-200 p-2 group"
            >
              {/* 缩略图或图标 */}
              {item.url ? (
                <img
                  src={item.url}
                  alt={item.name}
                  className="w-full h-16 object-cover rounded mb-1"
                />
              ) : (
                <div className="w-full h-16 bg-gradient-to-br from-brand-50 to-brand-100 rounded mb-1 flex items-center justify-center">
                  <span className="text-xs text-brand-400">
                    {item.name.split('.').pop()?.toUpperCase()}
                  </span>
                </div>
              )}

              {/* 文件名 */}
              <p className="text-[10px] text-gray-500 truncate">{item.name}</p>

              {/* 进度条 */}
              {item.status === 'uploading' && (
                <div className="absolute inset-0 bg-white/80 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mb-1 overflow-hidden">
                      <div
                        className="h-full bg-brand-500 rounded-full transition-all duration-300"
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-brand-600">{item.progress}%</span>
                  </div>
                </div>
              )}

              {/* 错误状态 */}
              {item.status === 'error' && (
                <div className="absolute inset-0 bg-red-50/90 rounded-lg flex flex-col items-center justify-center">
                  <span className="text-[10px] text-red-500 mb-1">上传失败</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleRetry(item.id) }}
                    className="text-[10px] text-brand-600 hover:underline"
                  >
                    重试
                  </button>
                </div>
              )}

              {/* 删除按钮（已完成或错误时显示） */}
              {(item.status === 'done' || item.status === 'error') && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleRemove(item.id) }}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
