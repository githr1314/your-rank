import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ImageUploader } from '@/components/shared/ImageUploader'
import { cn } from '@/utils/cn'
import { CATEGORIES, VISIBILITY_OPTIONS } from '@/utils/constants'
import * as rankingAPI from '@/services/rankingAPI'
import toast from 'react-hot-toast'
import type { CategoryEnum, VisibilityEnum } from '@/types'

export function CreateRankingPage() {
  const navigate = useNavigate()

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [coverUrl, setCoverUrl] = useState('')
  const [category, setCategory] = useState<CategoryEnum>('其他')
  const [visibility, setVisibility] = useState<VisibilityEnum>('公开')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [titleError, setTitleError] = useState<string | null>(null)

  const validate = (): boolean => {
    const trimmedTitle = title.trim()
    if (!trimmedTitle) {
      setTitleError('请输入排行榜标题')
      return false
    }
    if (trimmedTitle.length > 100) {
      setTitleError('标题不能超过 100 个字符')
      return false
    }
    setTitleError(null)
    return true
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (!validate()) return

    setIsSubmitting(true)
    try {
      const res = await rankingAPI.create({
        title: title.trim(),
        description: description.trim(),
        cover_url: coverUrl || undefined,
        category,
        visibility,
      })

      toast.success('排行榜创建成功')
      // 跳转到排行管理页
      navigate(`/ranking/${res.data.id}/manage`)
    } catch {
      toast.error('创建失败，请稍后重试')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    navigate(-1)
  }

  return (
    <div className="flex flex-col h-full">
      {/* 页面头部 */}
      <div className="flex items-center justify-between px-margin-edge pt-6 pb-2 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={handleCancel}
            className="flex items-center justify-center w-9 h-9 rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors"
            aria-label="返回"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </button>
          <h1 className="text-headline-md text-on-surface font-headline-md">
            创建排行
          </h1>
        </div>
      </div>

      {/* 表单 */}
      <div className="flex-1 overflow-auto px-margin-edge pb-8">
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto flex flex-col gap-6 pt-4">
          {/* 封面图上传 */}
          <section>
            <label className="block text-label-sm text-on-surface-variant mb-2 font-label-sm">
              封面图 <span className="text-on-surface-variant/50">（选填）</span>
            </label>
            <ImageUploader
              value={coverUrl}
              onChange={setCoverUrl}
              cropShape="square"
              className="w-full"
            />
          </section>

          {/* 标题 */}
          <section>
            <label
              htmlFor="ranking-title"
              className="block text-label-sm text-on-surface-variant mb-2 font-label-sm"
            >
              标题 <span className="text-error">*</span>
            </label>
            <input
              id="ranking-title"
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value)
                if (titleError) setTitleError(null)
              }}
              placeholder="给你的排行取个名字"
              maxLength={100}
              className={cn(
                'w-full px-4 py-3 rounded-xl border text-body-md text-on-surface',
                'bg-surface-container-lowest outline-none transition-colors',
                'placeholder:text-on-surface-variant/40',
                titleError
                  ? 'border-error focus:border-error focus:ring-1 focus:ring-error/20'
                  : 'border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary/20',
              )}
              disabled={isSubmitting}
            />
            {titleError && (
              <p className="mt-1.5 text-label-sm text-error">{titleError}</p>
            )}
            <p className="mt-1 text-label-sm text-on-surface-variant/50 text-right">
              {title.length}/100
            </p>
          </section>

          {/* 描述 */}
          <section>
            <label
              htmlFor="ranking-description"
              className="block text-label-sm text-on-surface-variant mb-2 font-label-sm"
            >
              描述 <span className="text-on-surface-variant/50">（选填）</span>
            </label>
            <textarea
              id="ranking-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="简单介绍一下你的排行..."
              rows={3}
              maxLength={500}
              className={cn(
                'w-full px-4 py-3 rounded-xl border text-body-md text-on-surface',
                'bg-surface-container-lowest outline-none resize-none transition-colors',
                'placeholder:text-on-surface-variant/40',
                'border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary/20',
              )}
              disabled={isSubmitting}
            />
          </section>

          {/* 分类 */}
          <section>
            <label className="block text-label-sm text-on-surface-variant mb-2 font-label-sm">
              分类
            </label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat as CategoryEnum)}
                  className={cn(
                    'px-4 py-2 rounded-lg text-label-sm transition-colors',
                    category === cat
                      ? 'bg-primary text-on-primary font-label-sm'
                      : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high',
                  )}
                  disabled={isSubmitting}
                >
                  {cat}
                </button>
              ))}
            </div>
          </section>

          {/* 可见范围 */}
          <section>
            <label className="block text-label-sm text-on-surface-variant mb-2 font-label-sm">
              可见范围
            </label>
            <div className="flex gap-3">
              {VISIBILITY_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setVisibility(opt as VisibilityEnum)}
                  className={cn(
                    'flex-1 flex flex-col items-center gap-1.5 px-4 py-3 rounded-xl border-2 transition-all',
                    visibility === opt
                      ? 'border-primary bg-primary/5'
                      : 'border-outline-variant bg-surface-container-lowest hover:border-primary/30',
                  )}
                  disabled={isSubmitting}
                >
                  {/* 图标 */}
                  <span className="text-on-surface-variant">
                    {opt === '公开' && (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="3" />
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      </svg>
                    )}
                    {opt === '私密' && (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    )}
                    {opt === '仅链接' && (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                      </svg>
                    )}
                  </span>
                  <span className={cn(
                    'text-label-sm',
                    visibility === opt ? 'text-primary font-label-sm' : 'text-on-surface-variant',
                  )}>
                    {opt}
                  </span>
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-label-sm text-on-surface-variant/60">
              {visibility === '公开' && '所有人可见，会在发现页展示'}
              {visibility === '私密' && '仅自己可见'}
              {visibility === '仅链接' && '知道链接的人可以查看，不会在发现页展示'}
            </p>
          </section>

          {/* 操作按钮 */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 px-4 py-3 rounded-xl bg-surface-container text-on-surface-variant text-body-md hover:bg-surface-container-high transition-colors"
              disabled={isSubmitting}
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className={cn(
                'flex-1 px-4 py-3 rounded-xl text-body-md font-headline-md transition-colors',
                isSubmitting || !title.trim()
                  ? 'bg-surface-container-high text-on-surface-variant/50 cursor-not-allowed'
                  : 'bg-primary text-on-primary hover:bg-primary-container hover:text-on-primary-container',
              )}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                  创建中...
                </span>
              ) : (
                '创建排行'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
