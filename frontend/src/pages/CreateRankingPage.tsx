import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { rankingAPI, uploadAPI } from '@/services/api'
import type { Category, Visibility } from '@/types'
import { CATEGORIES, VISIBILITIES } from '@/utils/constants'
import ImageUploader from '@/components/common/ImageUploader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

export default function CreateRankingPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '其他' as Category,
    visibility: '公开' as Visibility,
  })
  const [coverUrl, setCoverUrl] = useState('')
  const [loading, setLoading] = useState(false)

  const handleCoverUpload = async (file: File): Promise<string> => {
    const res = await uploadAPI.uploadImage(file)
    return res.data.data.url
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) {
      toast.error('请输入排行榜标题')
      return
    }
    if (form.title.length > 100) {
      toast.error('标题不能超过100字符')
      return
    }
    setLoading(true)
    try {
      const res = await rankingAPI.create({
        ...form,
        cover_url: coverUrl || undefined,
      })
      toast.success('创建成功')
      navigate(`/ranking/${res.data.data.id}/manage`)
    } catch (err: any) {
      toast.error(err.response?.data?.message || '创建失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 animate-fade-in">
      <div className="mb-8">
        <button onClick={() => navigate(-1)} className="text-sm text-gray-400 hover:text-gray-600 mb-2">
          ← 返回
        </button>
        <h1 className="text-2xl font-bold text-gray-900">创建排行榜</h1>
        <p className="text-sm text-gray-500 mt-1">创建一个 Tier List 排行榜，添加条目后拖拽入列</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 space-y-6">
        {/* 封面图 */}
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-2 block">封面图片</Label>
          <div className="flex items-start gap-4">
            <ImageUploader
              onUploaded={setCoverUrl}
              uploadFn={handleCoverUpload}
              currentUrl={coverUrl}
              shape="square"
              placeholder="选择封面"
              sizeHint="推荐 800x400px，支持 JPG/PNG/GIF/WebP，最大 10MB"
            />
          </div>
        </div>

        {/* 标题 */}
        <div className="space-y-2">
          <Label htmlFor="title" className="text-sm font-medium text-gray-700">
            排行榜标题 <span className="text-red-500">*</span>
          </Label>
          <Input
            id="title"
            type="text"
            placeholder="例如：2024年度游戏 Tier List"
            maxLength={100}
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <p className="text-xs text-gray-400">{form.title.length}/100</p>
        </div>

        {/* 描述 */}
        <div className="space-y-2">
          <Label htmlFor="description" className="text-sm font-medium text-gray-700">排行描述</Label>
          <Textarea
            id="description"
            className="min-h-[80px]"
            placeholder="简要说明排行主题或评选标准..."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>

        {/* 分类 */}
        <div>
          <Label className="block text-sm font-medium text-gray-700 mb-2">分类标签</Label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => setForm({ ...form, category: cat.value })}
                className={`tag-pill ${form.category === cat.value ? 'tag-pill-active' : 'tag-pill-inactive'}`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* 可见范围 */}
        <div>
          <Label className="block text-sm font-medium text-gray-700 mb-2">可见范围</Label>
          <div className="space-y-2">
            {VISIBILITIES.map((vis) => (
              <button
                key={vis.value}
                type="button"
                onClick={() => setForm({ ...form, visibility: vis.value })}
                className={`w-full text-left px-4 py-3 rounded-xl border transition-all
                  ${form.visibility === vis.value
                    ? 'border-brand-400 bg-brand-50 ring-1 ring-brand-400'
                    : 'border-gray-200 hover:border-gray-300'}`}
              >
                <div className="flex items-center">
                  <span className={`w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center
                    ${form.visibility === vis.value ? 'border-brand-500' : 'border-gray-300'}`}
                  >
                    {form.visibility === vis.value && (
                      <span className="w-2 h-2 rounded-full bg-brand-500" />
                    )}
                  </span>
                  <div>
                    <span className="font-medium text-sm text-gray-900">{vis.label}</span>
                    <span className="text-xs text-gray-400 ml-2">{vis.desc}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? '创建中...' : '创建排行榜'}
        </Button>

        <p className="text-xs text-gray-400 text-center">
          创建后将自动进入管理页，可添加条目并拖拽到各等级行
        </p>
      </form>
    </div>
  )
}
