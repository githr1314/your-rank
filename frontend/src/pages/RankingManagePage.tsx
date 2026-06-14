import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core'
import { SortableContext, useSortable, horizontalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { rankingAPI, entryAPI, uploadAPI } from '@/services/api'
import type { Entry, Ranking, Tier, Category, Visibility } from '@/types'
import { CATEGORIES, TIER_INFO, TIER_ORDER } from '@/utils/constants'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import ImageUploader from '@/components/common/ImageUploader'
import SharePosterModal from '@/components/common/SharePosterModal'

// ===================== 可拖拽条目卡片 =====================
function SortableEntryCard({ entry, onEdit, onDelete }: {
  entry: Entry
  onEdit: (e: Entry) => void
  onDelete: (e: Entry) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: entry.id,
    data: { entry, tier: entry.tier },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`entry-card ${isDragging ? 'dragging' : ''}`}
    >
      {entry.image_url && (
        <img src={entry.image_url} alt={entry.name} className="w-full h-20 object-cover rounded-md mb-2" />
      )}
      <p className="text-sm font-medium text-gray-800 truncate">{entry.name}</p>
      {entry.description && (
        <p className="text-xs text-gray-400 mt-0.5 truncate">{entry.description}</p>
      )}
      <div className="flex gap-2 mt-2">
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(entry) }}
          className="text-xs text-gray-400 hover:text-brand-600 transition-colors"
        >
          编辑
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(entry) }}
          className="text-xs text-gray-400 hover:text-red-600 transition-colors"
        >
          删除
        </button>
      </div>
    </div>
  )
}

// ===================== 等级行放置区 =====================
function TierDropZone({ tier, entries, isOver, onEdit, onDelete }: {
  tier: Tier
  entries: Entry[]
  isOver: boolean
  onEdit: (e: Entry) => void
  onDelete: (e: Entry) => void
}) {
  const info = TIER_INFO[tier]
  const sorted = [...entries].sort((a, b) => a.sort_order - b.sort_order)

  const isEmpty = sorted.length === 0

  // 将整个等级行注册为 droppable，这样空行也能接收拖入的条目
  const { setNodeRef: setDroppableRef, isOver: isDroppableOver } = useDroppable({
    id: tier,
  })

  return (
    <div
      ref={setDroppableRef}
      className={`rounded-xl border-2 ${info.cssClass} p-4 transition-all duration-200
        ${isOver || isDroppableOver ? 'ring-2 ring-brand-400 shadow-sm' : ''}`}
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">{info.emoji}</span>
        <h3 className="font-bold text-sm">{info.name}</h3>
        <span className={`tier-badge ${info.badgeClass} ml-1`}>{tier}</span>
        {/* 等级分布统计 */}
        <span className="text-xs text-gray-400 ml-auto flex items-center gap-1">
          <span>{sorted.length} 条目</span>
          {sorted.length > 0 && (
            <span className="text-[10px] bg-white/60 px-1.5 py-0.5 rounded">
              {((sorted.length / Math.max(sorted.length + 1, 1)) * 100).toFixed(0)}%
            </span>
          )}
        </span>
      </div>
      <div className={`tier-drop-zone relative ${isOver ? 'over' : ''} ${isEmpty ? 'min-h-[80px]' : ''}`}>
        <SortableContext items={sorted.map((e) => e.id)} strategy={horizontalListSortingStrategy}>
          {isEmpty ? (
            <div className="w-full flex flex-col items-center justify-center py-6 text-gray-300">
              <span className="text-2xl mb-1">---</span>
              <p className="text-xs italic">
                {isOver ? '释放以放置到此等级' : '拖拽条目到此处'}
              </p>
            </div>
          ) : (
            sorted.map((entry) => (
              <SortableEntryCard key={entry.id} entry={entry} onEdit={onEdit} onDelete={onDelete} />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  )
}

// ===================== 编辑条目弹窗 =====================
function EditEntryModal({ entry, onSave, onClose }: {
  entry: Entry | null
  onSave: (data: { name: string; description: string; image_url: string; link_url: string }) => void
  onClose: () => void
}) {
  const [name, setName] = useState(entry?.name || '')
  const [description, setDescription] = useState(entry?.description || '')
  const [imageUrl, setImageUrl] = useState(entry?.image_url || '')
  const [linkUrl, setLinkUrl] = useState(entry?.link_url || '')

  useEffect(() => {
    if (entry) {
      setName(entry.name)
      setDescription(entry.description)
      setImageUrl(entry.image_url)
      setLinkUrl(entry.link_url)
    }
  }, [entry])

  if (!entry) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-bold text-lg mb-4">编辑条目</h3>
        <div className="space-y-3">
          <Input placeholder="条目名称" value={name} onChange={(e) => setName(e.target.value)} maxLength={200} />
          <Input placeholder="描述（选填）" value={description} onChange={(e) => setDescription(e.target.value)} />
          <Input placeholder="图片URL（选填）" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
          <Input placeholder="外部链接（选填）" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} />
        </div>
        <div className="flex gap-2 justify-end mt-4">
          <Button variant="outline" onClick={onClose}>取消</Button>
          <Button onClick={() => onSave({ name, description, image_url: imageUrl, link_url: linkUrl })}>
            保存
          </Button>
        </div>
      </div>
    </div>
  )
}

// ===================== 编辑排行信息弹窗 =====================
function EditRankingModal({ ranking, onSave, onClose }: {
  ranking: Ranking | null
  onSave: (data: { title: string; description: string; category: Category; visibility: Visibility; cover_url: string }) => void
  onClose: () => void
}) {
  const [title, setTitle] = useState(ranking?.title || '')
  const [description, setDescription] = useState(ranking?.description || '')
  const [category, setCategory] = useState<Category>(ranking?.category || '其他')
  const [visibility, setVisibility] = useState<Visibility>(ranking?.visibility || '公开')
  const [coverUrl, setCoverUrl] = useState(ranking?.cover_url || '')

  useEffect(() => {
    if (ranking) {
      setTitle(ranking.title)
      setDescription(ranking.description)
      setCategory(ranking.category)
      setVisibility(ranking.visibility)
      setCoverUrl(ranking.cover_url || '')
    }
  }, [ranking])

  if (!ranking) return null

  const handleCoverUpload = async (file: File): Promise<string> => {
    const res = await uploadAPI.uploadImage(file)
    return res.data.data.url
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-md" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-bold text-lg mb-4">编辑排行信息</h3>
        <div className="space-y-4">
          {/* 封面 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">封面</label>
            <ImageUploader
              onUploaded={setCoverUrl}
              uploadFn={handleCoverUpload}
              currentUrl={coverUrl}
              shape="square"
              placeholder="选择封面"
            />
          </div>

          {/* 标题 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">标题</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100} />
          </div>

          {/* 描述 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </div>

          {/* 分类 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">分类</label>
            <select className="select-field" value={category} onChange={(e) => setCategory(e.target.value as Category)}>
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          {/* 可见性 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">可见范围</label>
            <select className="select-field" value={visibility} onChange={(e) => setVisibility(e.target.value as Visibility)}>
              <option value="公开">公开 - 出现在发现页</option>
              <option value="仅链接">仅链接可见 - 知道链接才能看</option>
              <option value="私密">私密 - 仅自己可见</option>
            </select>
          </div>
        </div>
        <div className="flex gap-2 justify-end mt-6">
          <Button variant="outline" onClick={onClose}>取消</Button>
          <Button
            onClick={() => onSave({ title, description, category, visibility, cover_url: coverUrl })}
            disabled={!title.trim()}
          >
            保存修改
          </Button>
        </div>
      </div>
    </div>
  )
}

// ===================== 主页面 =====================
export default function RankingManagePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [ranking, setRanking] = useState<Ranking | null>(null)
  const [entriesByTier, setEntriesByTier] = useState<Record<Tier, Entry[]>>({ S: [], A: [], B: [], C: [], D: [] })
  const [unplaced, setUnplaced] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [activeEntry, setActiveEntry] = useState<Entry | null>(null)
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null)
  const [editingRanking, setEditingRanking] = useState(false)
  // Save-tracking removed (v3: unused)
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved' | ''>('')
  const [overTier, setOverTier] = useState<string | null>(null)
  const [isDragOverDelete, setIsDragOverDelete] = useState(false)

  // 删除确认弹窗
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteInputValue, setDeleteInputValue] = useState('')

  // 分享弹窗
  const [showShareModal, setShowShareModal] = useState(false)

  // 添加条目表单
  const [newEntryName, setNewEntryName] = useState('')
  const [newEntryImage, setNewEntryImage] = useState('')
  const [addingEntry, setAddingEntry] = useState(false)

  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  // 将待放置区注册为 droppable，使得条目可拖回待放置区
  const { setNodeRef: unplacedDroppableRef, isOver: isUnplacedOver } = useDroppable({
    id: 'unplaced-zone',
  })

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  // 加载排行和条目
  useEffect(() => {
    if (!id) return
    const fetch = async () => {
      try {
        const res = await rankingAPI.get(id)
        const r = res.data.data
        setRanking(r)

        const grouped: Record<Tier, Entry[]> = { S: [], A: [], B: [], C: [], D: [] }
        const pending: Entry[] = []
        r.entries?.forEach((e) => {
          if (e.tier && e.tier in grouped) {
            grouped[e.tier as Tier].push(e)
          } else {
            pending.push(e)
          }
        })
        setEntriesByTier(grouped)
        setUnplaced(pending)
      } catch {
        toast.error('排行榜不存在或无权访问')
        navigate('/my-rankings')
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [id])

  // 拖拽开始
  const handleDragStart = (event: DragStartEvent) => {
    const entry = event.active.data.current?.entry as Entry | undefined
    if (entry) setActiveEntry(entry)
  }

  // 拖拽经过
  const handleDragOver = (event: DragOverEvent) => {
    const overId = event.over?.id as string
    if (overId === 'unplaced-zone') {
      setOverTier('unplaced-zone')
    } else if (TIER_ORDER.includes(overId as Tier)) {
      setOverTier(overId)
    } else {
      const overEntry = findEntry(overId)
      setOverTier(overEntry?.tier || null)
    }
  }

  // 拖拽结束
  const handleDragEnd = (event: DragEndEvent) => {
    setActiveEntry(null)
    setOverTier(null)
    setIsDragOverDelete(false)

    const { active, over } = event
    if (!over) return

    // 检测是否拖到删除区
    const overId = over.id as string
    if (overId === 'delete-zone') {
      // 触发删除流程 - 二次确认
      const activeData = active.data.current?.entry as Entry | undefined
      if (activeData) {
        setEditingEntry(activeData) // 跳转到编辑模式进行删除确认
      }
      return
    }

    const activeId = active.id as string
    const activeData = active.data.current?.entry as Entry | undefined
    if (!activeData) return

    // 确定目标 tier
    let targetTier: Tier | null = null

    if (TIER_ORDER.includes(overId as Tier)) {
      targetTier = overId as Tier
    } else {
      const overEntry = findEntry(overId)
      if (overEntry) {
        targetTier = overEntry.tier
      }
    }

    if (overId === 'unplaced-zone') {
      targetTier = null
    }

    // 如果目标位置相同且是本行，不做变更
    if (targetTier === activeData.tier) {
      return
    }

    // 从原位置移除
    const newGrouped = { ...entriesByTier }
    const newUnplaced = [...unplaced]

    if (activeData.tier && activeData.tier in newGrouped) {
      newGrouped[activeData.tier as Tier] = newGrouped[activeData.tier as Tier].filter((e) => e.id !== activeId)
    } else {
      const idx = newUnplaced.findIndex((e) => e.id === activeId)
      if (idx >= 0) newUnplaced.splice(idx, 1)
    }

    // 添加到目标位置
    const movedEntry: Entry = { ...activeData, tier: targetTier }

    if (targetTier) {
      const targetList = [...newGrouped[targetTier]]
      const overIdx = targetList.findIndex((e) => e.id === overId)
      if (overIdx >= 0) {
        targetList.splice(overIdx, 0, movedEntry)
      } else {
        targetList.push(movedEntry)
      }
      newGrouped[targetTier] = targetList.map((e, i) => ({ ...e, sort_order: i }))
    } else {
      newUnplaced.push({ ...movedEntry, tier: null })
    }

    setEntriesByTier(newGrouped)
    setUnplaced(newUnplaced)
    setSaveStatus('unsaved')

    scheduleSave(newGrouped, newUnplaced)
  }

  // 防抖保存
  const scheduleSave = useCallback((grouped: Record<Tier, Entry[]>, pending: Entry[]) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    setSaveStatus('unsaved')

    debounceRef.current = setTimeout(async () => {
      setSaveStatus('saving')
      try {
        const updates: { id: string; tier: Tier | null; sort_order: number }[] = []

        for (const tier of TIER_ORDER) {
          grouped[tier].forEach((e, i) => {
            updates.push({ id: e.id, tier, sort_order: i })
          })
        }
        pending.forEach((e, i) => {
          updates.push({ id: e.id, tier: null, sort_order: i })
        })

        await entryAPI.reorder({ updates })
        setSaveStatus('saved')
        setTimeout(() => setSaveStatus(''), 2000)
      } catch {
        toast.error('保存失败，请重试')
        setSaveStatus('unsaved')
      }
    }, 800)
  }, [])

  // 查找条目
  const findEntry = (id: string): Entry | undefined => {
    for (const tier of TIER_ORDER) {
      const found = entriesByTier[tier].find((e) => e.id === id)
      if (found) return found
    }
    return unplaced.find((e) => e.id === id)
  }

  // 添加条目
  const handleAddEntry = async () => {
    if (!newEntryName.trim() || !id) return
    setAddingEntry(true)
    try {
      const res = await entryAPI.create({
        ranking_id: id,
        name: newEntryName.trim(),
        description: '',
        image_url: newEntryImage,
        link_url: '',
      })
      setUnplaced((prev) => [...prev, res.data.data])
      setNewEntryName('')
      setNewEntryImage('')
      toast.success('条目已添加到待放置区')
    } catch (err: any) {
      toast.error(err.response?.data?.message || '添加失败')
    } finally {
      setAddingEntry(false)
    }
  }

  // 编辑条目
  const handleEditSave = async (data: { name: string; description: string; image_url: string; link_url: string }) => {
    if (!editingEntry) return
    try {
      const res = await entryAPI.update(editingEntry.id, data)
      const updateInList = (list: Entry[]) =>
        list.map((e) => (e.id === editingEntry.id ? { ...e, ...res.data.data } : e))

      setEntriesByTier((prev) => {
        const next = { ...prev }
        for (const tier of TIER_ORDER) {
          next[tier] = updateInList(next[tier])
        }
        return next
      })
      setUnplaced((prev) => updateInList(prev))
      setEditingEntry(null)
      toast.success('条目已更新')
    } catch (err: any) {
      toast.error(err.response?.data?.message || '更新失败')
    }
  }

  // 删除条目
  const handleDeleteEntry = async (entry: Entry) => {
    if (!confirm(`确定删除条目「${entry.name}」？`)) return
    try {
      await entryAPI.delete(entry.id)
      if (entry.tier && entry.tier in entriesByTier) {
        setEntriesByTier((prev) => ({
          ...prev,
          [entry.tier as Tier]: prev[entry.tier as Tier].filter((e) => e.id !== entry.id),
        }))
      } else {
        setUnplaced((prev) => prev.filter((e) => e.id !== entry.id))
      }
      toast.success('已删除')
    } catch (err: any) {
      toast.error(err.response?.data?.message || '删除失败')
    }
  }

  // 编辑排行信息
  const handleEditRanking = async (data: { title: string; description: string; category: Category; visibility: Visibility; cover_url: string }) => {
    if (!id || !ranking) return
    try {
      const res = await rankingAPI.update(id, data)
      setRanking(res.data.data)
      setEditingRanking(false)
      toast.success('排行信息已更新')
    } catch (err: any) {
      toast.error(err.response?.data?.message || '更新失败')
    }
  }

  // 删除排行榜
  const handleDeleteRanking = async () => {
    if (!id) return
    try {
      await rankingAPI.delete(id)
      toast.success('排行榜已删除')
      navigate('/my-rankings')
    } catch (err: any) {
      toast.error(err.response?.data?.message || '删除失败')
    } finally {
      setShowDeleteConfirm(false)
      setDeleteInputValue('')
    }
  }

  // 图片条目上传
  const handleEntryImageUpload = async (file: File): Promise<string> => {
    const res = await uploadAPI.uploadImage(file)
    return res.data.data.url
  }

  // 计算总条目数
  const totalEntries = Object.values(entriesByTier).reduce((sum, arr) => sum + arr.length, 0) + unplaced.length

  if (loading) return <LoadingSpinner text="加载管理页..." />
  if (!ranking) return null

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-fade-in relative min-h-[80vh]">
      {/* 顶部信息 */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <button onClick={() => navigate('/my-rankings')} className="text-sm text-gray-400 hover:text-gray-600 mb-1">
            ← 返回我的排行
          </button>
          <h1 className="text-xl font-bold text-gray-900">{ranking.title}</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {ranking.category} · {ranking.visibility} · 分享码: {ranking.share_code} · {totalEntries} 条目
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* 保存状态 */}
          {saveStatus === 'saving' && (
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <span className="w-3 h-3 border-2 border-gray-300 border-t-brand-600 rounded-full animate-spin" />
              保存中...
            </span>
          )}
          {saveStatus === 'saved' && <span className="text-xs text-green-600">✓ 已保存</span>}
          {saveStatus === 'unsaved' && <span className="text-xs text-amber-500">● 未保存</span>}

          {/* 操作按钮 */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowShareModal(true)}
          >
            📤 分享
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditingRanking(true)}
          >
            ⚙ 编辑信息
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowDeleteConfirm(true)}
          >
            删除排行
          </Button>
        </div>
      </div>

      {/* 添加条目 */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-500 mb-1">添加条目</label>
            <div className="flex gap-2">
              <Input
                placeholder="输入条目名称，回车添加"
                value={newEntryName}
                onChange={(e) => setNewEntryName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddEntry()}
                maxLength={200}
              />
              {/* 图片上传 */}
              <ImageUploader
                onUploaded={setNewEntryImage}
                uploadFn={handleEntryImageUpload}
                currentUrl={newEntryImage}
                shape="square"
                placeholder="配图"
                sizeHint=""
                className="!flex-shrink-0"
              />
            </div>
          </div>
          <Button
            onClick={handleAddEntry}
            disabled={addingEntry || !newEntryName.trim()}
          >
            {addingEntry ? '添加中...' : '添加'}
          </Button>
        </div>
      </div>

      {/* 拖拽上下文 */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        {/* 五个等级行 */}
        <div className="space-y-4 mb-6">
          {TIER_ORDER.map((tier) => (
            <TierDropZone
              key={tier}
              tier={tier}
              entries={entriesByTier[tier]}
              isOver={overTier === tier}
              onEdit={setEditingEntry}
              onDelete={handleDeleteEntry}
            />
          ))}
        </div>

        {/* 待放置区 */}
        <div
          ref={unplacedDroppableRef}
          className={`rounded-xl border-2 border-dashed border-gray-300 p-4 transition-all duration-200
            ${overTier === 'unplaced-zone' || isUnplacedOver ? 'ring-2 ring-brand-400 bg-brand-50' : ''}`}
        >
          <h3 className="text-sm font-bold text-gray-500 mb-3 flex items-center gap-2">
            <span>🗂</span> 待放置
            <span className="text-xs text-gray-400 font-normal">({unplaced.length} 个)</span>
          </h3>
          <div className="tier-drop-zone">
            <SortableContext items={unplaced.map((e) => e.id)} strategy={horizontalListSortingStrategy}>
              {unplaced.length > 0 ? (
                unplaced.map((entry) => (
                  <SortableEntryCard key={entry.id} entry={entry} onEdit={setEditingEntry} onDelete={handleDeleteEntry} />
                ))
              ) : (
                <div className="w-full flex flex-col items-center justify-center py-6 text-gray-300">
                  <span className="text-2xl mb-1">📥</span>
                  <p className="text-xs italic">新添加的条目会出现在这里，拖入上方等级行即可入列</p>
                </div>
              )}
            </SortableContext>
          </div>
        </div>

        {/* 删除区 - 页面底部 */}
        <div
          id="delete-zone"
          className={`
            fixed bottom-0 left-0 right-0 z-40 transition-all duration-300
            ${activeEntry
              ? 'translate-y-0 opacity-100'
              : 'translate-y-full opacity-0 pointer-events-none'}
          `}
          onDragOver={(e) => { e.preventDefault(); setIsDragOverDelete(true) }}
          onDragLeave={() => setIsDragOverDelete(false)}
        >
          <div
            className={`
              max-w-2xl mx-auto mb-4 rounded-xl text-center transition-all duration-200 cursor-pointer
              ${isDragOverDelete
                ? 'bg-red-600 text-white py-6 shadow-lg scale-105'
                : 'bg-red-50 text-red-400 py-4 border-2 border-dashed border-red-300'}
            `}
          >
            <span className="text-2xl block mb-1">🗑</span>
            <p className="font-medium text-sm">
              {isDragOverDelete ? '放开以删除此条目' : '拖入此处删除'}
            </p>
          </div>
        </div>

        {/* 拖拽覆盖层 */}
        <DragOverlay dropAnimation={null}>
          {activeEntry ? (
            <div className="entry-card shadow-drag scale-110 rotate-2 !cursor-grabbing">
              {activeEntry.image_url && (
                <img src={activeEntry.image_url} alt={activeEntry.name} className="w-full h-20 object-cover rounded-md mb-2" />
              )}
              <p className="text-sm font-bold text-gray-800 truncate">{activeEntry.name}</p>
              <p className="text-[10px] text-gray-400 mt-1">
                {activeEntry.tier ? `${TIER_INFO[activeEntry.tier].emoji} ${TIER_INFO[activeEntry.tier].name}` : '待放置'}
              </p>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* 编辑条目弹窗 */}
      {editingEntry && (
        <EditEntryModal
          entry={editingEntry}
          onSave={handleEditSave}
          onClose={() => setEditingEntry(null)}
        />
      )}

      {/* 编辑排行信息弹窗 */}
      {editingRanking && (
        <EditRankingModal
          ranking={ranking}
          onSave={handleEditRanking}
          onClose={() => setEditingRanking(false)}
        />
      )}

      {/* 分享弹窗 */}
      {showShareModal && ranking && (
        <SharePosterModal
          ranking={ranking}
          shareUrl={`${window.location.origin}/s/${ranking.share_code}`}
          onClose={() => setShowShareModal(false)}
        />
      )}

      {/* 删除排行榜确认弹窗 */}
      <ConfirmDialog
        open={showDeleteConfirm}
        title="删除排行榜"
        message={`此操作不可恢复。所有条目将被永久删除。请输入「${ranking.title}」以确认删除。`}
        confirmText="确认删除"
        cancelText="取消"
        variant="danger"
        requireInput={ranking.title}
        inputValue={deleteInputValue}
        onInputChange={setDeleteInputValue}
        onConfirm={handleDeleteRanking}
        onCancel={() => {
          setShowDeleteConfirm(false)
          setDeleteInputValue('')
        }}
      />
    </div>
  )
}
