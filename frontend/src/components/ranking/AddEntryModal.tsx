import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { cn } from '@/utils/cn'

export interface AddEntryModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: { name: string; description: string; image_url: string; link_url: string }) => void
  isLoading?: boolean
}

/**
 * 添加条目对话框。
 * 必需：名称。可选：描述、配图 URL、外部链接。
 */
export function AddEntryModal({
  open,
  onOpenChange,
  onSubmit,
  isLoading = false,
}: AddEntryModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [linkUrl, setLinkUrl] = useState('')

  const handleSubmit = () => {
    if (!name.trim()) return
    onSubmit({
      name: name.trim(),
      description: description.trim(),
      image_url: imageUrl.trim(),
      link_url: linkUrl.trim(),
    })
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setName('')
      setDescription('')
      setImageUrl('')
      setLinkUrl('')
    }
    onOpenChange(nextOpen)
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 data-[state=open]:animate-fade-in" />
        <Dialog.Content
          className={cn(
            'fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2',
            'w-[calc(100%-32px)] max-w-md',
            'bg-surface-container-lowest rounded-xl p-6',
            'shadow-lg data-[state=open]:animate-fade-in',
            'outline-none',
          )}
        >
          <Dialog.Title className="text-headline-sm text-on-surface mb-5">
            添加条目
          </Dialog.Title>

          <div className="flex flex-col gap-4">
            {/* Name (required) */}
            <div>
              <label className="text-label-sm font-label-sm text-on-surface-variant mb-1 block">
                名称 <span className="text-error">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="条目名称"
                maxLength={200}
                autoFocus
                className={cn(
                  'w-full px-3.5 py-2.5 rounded-lg',
                  'border border-outline-variant bg-surface-container-low',
                  'text-body-md text-on-surface outline-none',
                  'placeholder:text-on-surface-variant/50',
                  'transition-colors focus:border-primary focus:ring-1 focus:ring-primary/20',
                )}
              />
            </div>

            {/* Description (optional) */}
            <div>
              <label className="text-label-sm font-label-sm text-on-surface-variant mb-1 block">
                描述
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="简短描述（可选）"
                rows={2}
                className={cn(
                  'w-full px-3.5 py-2.5 rounded-lg resize-none',
                  'border border-outline-variant bg-surface-container-low',
                  'text-body-md text-on-surface outline-none',
                  'placeholder:text-on-surface-variant/50',
                  'transition-colors focus:border-primary focus:ring-1 focus:ring-primary/20',
                )}
              />
            </div>

            {/* Image URL (optional) */}
            <div>
              <label className="text-label-sm font-label-sm text-on-surface-variant mb-1 block">
                配图 URL
              </label>
              <input
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="图片链接（可选）"
                className={cn(
                  'w-full px-3.5 py-2.5 rounded-lg',
                  'border border-outline-variant bg-surface-container-low',
                  'text-body-md text-on-surface outline-none',
                  'placeholder:text-on-surface-variant/50',
                  'transition-colors focus:border-primary focus:ring-1 focus:ring-primary/20',
                )}
              />
            </div>

            {/* Link URL (optional) */}
            <div>
              <label className="text-label-sm font-label-sm text-on-surface-variant mb-1 block">
                外部链接
              </label>
              <input
                type="text"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="外部详情链接（可选）"
                className={cn(
                  'w-full px-3.5 py-2.5 rounded-lg',
                  'border border-outline-variant bg-surface-container-low',
                  'text-body-md text-on-surface outline-none',
                  'placeholder:text-on-surface-variant/50',
                  'transition-colors focus:border-primary focus:ring-1 focus:ring-primary/20',
                )}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 mt-6">
            <Dialog.Close asChild>
              <button
                className={cn(
                  'px-4 py-2 rounded-lg',
                  'bg-surface-container text-on-surface-variant',
                  'text-label-sm font-label-sm',
                  'hover:bg-surface-container-high transition-colors',
                )}
              >
                取消
              </button>
            </Dialog.Close>
            <button
              onClick={handleSubmit}
              disabled={!name.trim() || isLoading}
              className={cn(
                'px-4 py-2 rounded-lg text-label-sm font-label-sm transition-colors',
                'bg-primary text-on-primary',
                'hover:bg-primary-container hover:text-on-primary-container',
                (!name.trim() || isLoading) && 'opacity-50 cursor-not-allowed',
              )}
            >
              {isLoading ? '添加中...' : '添加'}
            </button>
          </div>

          {/* Close button */}
          <Dialog.Close asChild>
            <button
              className={cn(
                'absolute right-4 top-4 flex items-center justify-center',
                'w-7 h-7 rounded-full',
                'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high',
                'transition-colors',
              )}
              aria-label="关闭"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
