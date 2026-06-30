import { useState, type ReactNode } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { cn } from '@/utils/cn'

export interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string | ReactNode
  confirmText?: string
  onConfirm: () => void
  variant?: 'default' | 'danger'
  /** 如需用户输入确认文字，设为要求输入的值 */
  requireInput?: string
  isLoading?: boolean
}

/**
 * 二次确认弹窗。
 * 用于删除排行、删除条目、注销账号等敏感操作。
 * 支持选项：danger 样式变体、输入确认文字。
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = '确认',
  onConfirm,
  variant = 'danger',
  requireInput,
  isLoading = false,
}: ConfirmDialogProps) {
  const [inputValue, setInputValue] = useState('')
  const canConfirm = requireInput ? inputValue === requireInput : true

  const handleConfirm = () => {
    if (!canConfirm) return
    onConfirm()
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setInputValue('')
    }
    onOpenChange(nextOpen)
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 data-[state=open]:animate-fade-in" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-32px)] max-w-sm bg-surface-container-lowest rounded-xl p-6 shadow-lg data-[state=open]:animate-fade-in outline-none">
          <Dialog.Title className="text-headline-sm text-on-surface mb-2">
            {title}
          </Dialog.Title>
          <Dialog.Description asChild>
            <div className="text-body-md text-on-surface-variant mb-5 leading-relaxed">
              {description}
            </div>
          </Dialog.Description>

          {requireInput && (
            <div className="mb-5">
              <p className="text-label-sm text-on-surface-variant mb-1.5">
                请输入 <strong className="text-on-surface">{requireInput}</strong> 以确认
              </p>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-outline-variant bg-surface-container-low text-body-md text-on-surface outline-none placeholder:text-on-surface-variant/50 transition-colors focus:border-primary focus:ring-1 focus:ring-primary/20"
                placeholder={requireInput}
              />
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Dialog.Close asChild>
              <button
                className="px-4 py-2 rounded-lg bg-surface-container text-on-surface-variant text-label-sm font-label-sm hover:bg-surface-container-high transition-colors"
              >
                取消
              </button>
            </Dialog.Close>
            <button
              onClick={handleConfirm}
              disabled={!canConfirm || isLoading}
              className={cn(
                'px-4 py-2 rounded-lg text-label-sm font-label-sm transition-colors',
                variant === 'danger'
                  ? 'bg-error text-on-error hover:bg-error-container hover:text-on-error-container'
                  : 'bg-primary text-on-primary hover:bg-primary-container hover:text-on-primary-container',
                (!canConfirm || isLoading) && 'opacity-50 cursor-not-allowed',
              )}
            >
              {isLoading ? '处理中...' : confirmText}
            </button>
          </div>

          <Dialog.Close asChild>
            <button
              className="absolute right-4 top-4 flex items-center justify-center w-7 h-7 rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
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
