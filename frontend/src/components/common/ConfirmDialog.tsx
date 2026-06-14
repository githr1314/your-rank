import { useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'default'
  onConfirm: () => void
  onCancel: () => void
  requireInput?: string
  inputValue?: string
  onInputChange?: (value: string) => void
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmText = '确认',
  cancelText = '取消',
  variant = 'default',
  onConfirm,
  onCancel,
  requireInput,
  inputValue,
  onInputChange,
}: ConfirmDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open && requireInput && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open, requireInput])

  useEffect(() => {
    if (!open) return
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [open, onCancel])

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  const isDisabled = requireInput ? inputValue !== requireInput : false

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 animate-fade-in"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-bold text-lg text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-500 mb-4">{message}</p>

        {requireInput && (
          <div className="mb-4">
            <p className="text-xs text-gray-400 mb-1">
              请输入 <strong className="text-gray-600">{requireInput}</strong> 以确认
            </p>
            <Input
              ref={inputRef}
              type="text"
              placeholder={requireInput}
              value={inputValue || ''}
              onChange={(e) => onInputChange?.(e.target.value)}
            />
          </div>
        )}

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onCancel}>
            {cancelText}
          </Button>
          <Button
            variant={variant === 'danger' ? 'destructive' : variant === 'warning' ? 'default' : 'default'}
            onClick={onConfirm}
            disabled={isDisabled}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  )
}
