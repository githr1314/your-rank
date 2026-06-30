import { useState, useEffect, useRef, useCallback } from 'react'
import {
  useParams,
  useNavigate,
  useBlocker,
} from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  type CollisionDetection,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import * as rankingAPI from '@/services/rankingAPI'
import * as entryAPI from '@/services/entryAPI'
import {
  TopBar,
  RankingInfoBar,
  TierRow,
  PendingZone,
  StatusBar,
  AddEntryModal,
} from '@/components/ranking'
import { DraggableEntryCard } from '@/components/ranking/DraggableEntryCard'
import { ConfirmDialog } from '@/components/shared'
import { DEBOUNCE_MS } from '@/utils/constants'
import type {
  RankingResponse,
  EntryResponse,
  ReorderUpdate,
  TierEnum,
  CategoryEnum,
  VisibilityEnum,
} from '@/types'

/** Container key for each tier group */
type ContainerKey = 'S' | 'A' | 'B' | 'C' | 'D' | 'pending'

/** Map from container key to entries */
type ItemsMap = Record<ContainerKey, EntryResponse[]>

const TIER_KEYS: Array<'S' | 'A' | 'B' | 'C' | 'D'> = ['S', 'A', 'B', 'C', 'D']
const ALL_CONTAINER_KEYS: ContainerKey[] = ['S', 'A', 'B', 'C', 'D', 'pending']

const TIER_LABELS: Record<string, string> = {
  S: '神中神',
  A: '杀疯了',
  B: '有点料',
  C: '还行吧',
  D: '凑个数',
}

function buildEmptyItems(): ItemsMap {
  return { S: [], A: [], B: [], C: [], D: [], pending: [] }
}

function groupEntriesByTier(entries: EntryResponse[]): ItemsMap {
  const items = buildEmptyItems()
  for (const entry of entries) {
    const tier = entry.tier
    const key: ContainerKey = tier !== null ? tier as ContainerKey : 'pending'
    items[key].push(entry)
  }
  // Sort each container by sort_order
  for (const key of ALL_CONTAINER_KEYS) {
    items[key].sort((a, b) => a.sort_order - b.sort_order)
  }
  return items
}

function findContainerKey(itemId: string, items: ItemsMap): ContainerKey | null {
  for (const key of ALL_CONTAINER_KEYS) {
    if (items[key].some((e) => e.id === itemId)) {
      return key
    }
  }
  return null
}

export function RankingManagePage() {
  const { id: rankingId } = useParams<{ id: string }>()
  const navigate = useNavigate()

  // ── Ranking data ──
  const [ranking, setRanking] = useState<RankingResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<ItemsMap>(buildEmptyItems())

  // ── UI state ──
  const [activeEntry, setActiveEntry] = useState<EntryResponse | null>(null)
  const [overContainer, setOverContainer] = useState<ContainerKey | null>(null)
  const [isDirty, setIsDirty] = useState(false)
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [addingEntry, setAddingEntry] = useState(false)
  const [deletingRanking, setDeletingRanking] = useState(false)

  // ── Save state ──
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const itemsRef = useRef(items)
  itemsRef.current = items

  // ── Load ranking data ──
  useEffect(() => {
    if (!rankingId) return

    setLoading(true)
    rankingAPI
      .getById(rankingId)
      .then((res) => {
        const rankingData = res.data
        setRanking(rankingData)
        setItems(groupEntriesByTier(rankingData.entries || []))
      })
      .catch(() => {
        toast.error('加载排行失败')
        navigate('/my-rankings')
      })
      .finally(() => setLoading(false))
  }, [rankingId, navigate])

  // ── Debounced save ──
  const triggerSave = useCallback(() => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
    }

    saveTimerRef.current = setTimeout(async () => {
      setSaveStatus('saving')

      const currentItems = itemsRef.current
      const updates: ReorderUpdate[] = []

      for (const key of ALL_CONTAINER_KEYS) {
        currentItems[key].forEach((entry, index) => {
          updates.push({
            id: entry.id,
            tier: key === 'pending' ? null : (key as TierEnum),
            sort_order: index,
          })
        })
      }

      try {
        await entryAPI.reorder({ updates })
        setSaveStatus('saved')
        setIsDirty(false)

        setTimeout(() => {
          setSaveStatus((prev) => (prev === 'saved' ? 'idle' : prev))
        }, 2000)
      } catch {
        setSaveStatus('error')
        toast.error('保存失败，请重试')
      }
    }, DEBOUNCE_MS)
  }, [])

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current)
      }
    }
  }, [])

  // ── Unsaved changes protection ──
  useEffect(() => {
    if (!isDirty) return

    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [isDirty])

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirty && currentLocation.pathname !== nextLocation.pathname,
  )

  // ── DnD handlers ──

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event
    const entryData = active.data.current?.entry as EntryResponse | undefined
    if (entryData) {
      setActiveEntry(entryData)
    }
  }, [])

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event
    if (!over) {
      setOverContainer(null)
      return
    }

    const activeId = active.id as string
    const overId = over.id as string

    const activeKey = findContainerKey(activeId, itemsRef.current)
    let overKey: ContainerKey | null = null

    // Check if over is a container
    if (ALL_CONTAINER_KEYS.includes(overId as ContainerKey)) {
      overKey = overId as ContainerKey
    } else if (overId === 'pending') {
      overKey = 'pending'
    } else {
      overKey = findContainerKey(overId, itemsRef.current)
    }

    setOverContainer(overKey)

    if (!activeKey || !overKey || activeKey === overKey) return

    // Cross-container move
    setItems((prev) => {
      const sourceItems = [...prev[activeKey]]
      const targetItems = [...prev[overKey]]

      const activeIndex = sourceItems.findIndex((e) => e.id === activeId)
      if (activeIndex < 0) return prev

      const [movedItem] = sourceItems.splice(activeIndex, 1)
      if (!movedItem) return prev

      const overIndex = targetItems.findIndex((e) => e.id === overId)
      if (overIndex >= 0) {
        targetItems.splice(overIndex, 0, movedItem)
      } else {
        targetItems.push(movedItem)
      }

      return {
        ...prev,
        [activeKey]: sourceItems,
        [overKey]: targetItems,
      }
    })
  }, [])

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      setActiveEntry(null)
      setOverContainer(null)

      if (!over) return

      const activeId = active.id as string
      const overId = over.id as string

      const activeKey = findContainerKey(activeId, itemsRef.current)
      let overKey: ContainerKey | null = null

      if (ALL_CONTAINER_KEYS.includes(overId as ContainerKey)) {
        overKey = overId as ContainerKey
      } else if (overId === 'pending') {
        overKey = 'pending'
      } else {
        overKey = findContainerKey(overId, itemsRef.current)
      }

      if (!activeKey || !overKey) return

      if (activeKey === overKey) {
        // Within-container reorder
        const containerItems = itemsRef.current[activeKey]
        const oldIndex = containerItems.findIndex((e) => e.id === activeId)
        const newIndex = containerItems.findIndex((e) => e.id === overId)

        if (oldIndex !== newIndex && oldIndex >= 0 && newIndex >= 0) {
          setItems((prev) => ({
            ...prev,
            [activeKey]: arrayMove(prev[activeKey], oldIndex, newIndex),
          }))
        }
      } else {
        // Cross-container move (already handled in dragOver, just mark dirty)
        // The items are already updated from dragOver
      }

      setIsDirty(true)
      triggerSave()
    },
    [triggerSave],
  )

  // ── Entry operations ──

  const handleAddEntry = useCallback(
    async (data: { name: string; description: string; image_url: string; link_url: string }) => {
      if (!rankingId) return
      setAddingEntry(true)
      try {
        const res = await entryAPI.create({
          ranking_id: rankingId,
          name: data.name,
          description: data.description || undefined,
          image_url: data.image_url || undefined,
          link_url: data.link_url || undefined,
        })
        const newEntry = res.data
        setItems((prev) => ({
          ...prev,
          pending: [...prev.pending, newEntry],
        }))
        setAddModalOpen(false)
        setIsDirty(true)
        triggerSave()
        toast.success('条目已添加')
      } catch {
        toast.error('添加条目失败')
      } finally {
        setAddingEntry(false)
      }
    },
    [rankingId, triggerSave],
  )

  const handleDeleteEntry = useCallback(
    async (entry: EntryResponse) => {
      try {
        await entryAPI.remove(entry.id)
        setItems((prev) => {
          const newItems = { ...prev }
          for (const key of ALL_CONTAINER_KEYS) {
            newItems[key] = prev[key].filter((e) => e.id !== entry.id)
          }
          return newItems
        })
        setIsDirty(true)
        triggerSave()
        toast.success('条目已删除')
      } catch {
        toast.error('删除条目失败')
      }
    },
    [triggerSave],
  )

  const handleEditEntry = useCallback((_entry: EntryResponse) => {
    // Placeholder: for now just log; could open a modal in future
    toast.error('编辑功能待实现')
  }, [])

  // ── Ranking operations ──

  const handleDeleteRanking = useCallback(async () => {
    if (!rankingId) return
    setDeletingRanking(true)
    try {
      await rankingAPI.remove(rankingId)
      toast.success('排行已删除')
      navigate('/my-rankings')
    } catch {
      toast.error('删除排行失败')
      setDeletingRanking(false)
      setDeleteConfirmOpen(false)
    }
  }, [rankingId, navigate])

  const handleTitleChange = useCallback(
    (title: string) => {
      setRanking((prev) => (prev ? { ...prev, title } : prev))
      setIsDirty(true)
    },
    [],
  )

  const handleCategoryChange = useCallback(
    (category: CategoryEnum) => {
      setRanking((prev) => (prev ? { ...prev, category } : prev))
      setIsDirty(true)
    },
    [],
  )

  const handleVisibilityChange = useCallback(
    (visibility: VisibilityEnum) => {
      setRanking((prev) => (prev ? { ...prev, visibility } : prev))
      setIsDirty(true)
    },
    [],
  )

  // ── Collision detection ──
  const collisionDetection: CollisionDetection = useCallback(
    (args) => {
      return closestCorners(args)
    },
    [],
  )

  // ── Loading state ──
  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin w-6 h-6 text-primary" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
            <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </svg>
          <span className="text-body-md text-on-surface-variant">加载中...</span>
        </div>
      </div>
    )
  }

  if (!ranking) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <div className="text-body-md text-on-surface-variant">排行不存在</div>
      </div>
    )
  }

  const totalEntryCount = ALL_CONTAINER_KEYS.reduce(
    (sum, key) => sum + items[key].length,
    0,
  )

  return (
    <div className="h-screen w-screen flex flex-col bg-background overflow-hidden select-none">
      {/* Ambient background blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-[20%] -left-[10%] w-[50vw] h-[50vw] rounded-full bg-primary-fixed-dim blur-[100px] ambient-blob mix-blend-multiply" />
        <div
          className="absolute top-[60%] -right-[10%] w-[40vw] h-[40vw] rounded-full bg-error-container blur-[100px] ambient-blob mix-blend-multiply"
          style={{ animationDelay: '-5s' }}
        />
      </div>

      {/* Top bar */}
      <TopBar
        title={ranking.title}
        rankingId={ranking.id}
        shareCode={ranking.share_code}
        onDelete={() => setDeleteConfirmOpen(true)}
      />

      {/* Ranking info bar */}
      <RankingInfoBar
        title={ranking.title}
        category={ranking.category}
        visibility={ranking.visibility}
        onTitleChange={handleTitleChange}
        onCategoryChange={handleCategoryChange}
        onVisibilityChange={handleVisibilityChange}
      />

      {/* Drag-drop workspace */}
      <DndContext
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        collisionDetection={collisionDetection}
      >
        <main className="flex-1 flex flex-col gap-3 p-margin-edge overflow-hidden relative z-30">
          {/* 5 Tier rows */}
          {TIER_KEYS.map((tier) => (
            <div key={tier} className="flex-[1_1_14%] min-h-[100px]">
              <TierRow
                tier={tier}
                label={TIER_LABELS[tier]}
                entries={items[tier]}
                onEdit={handleEditEntry}
                onDelete={handleDeleteEntry}
                isOver={overContainer === tier}
              />
            </div>
          ))}

          {/* Pending zone */}
          <div className="flex-[1.5_1_20%] min-h-[100px] mt-1">
            <PendingZone
              entries={items.pending}
              onEdit={handleEditEntry}
              onDelete={handleDeleteEntry}
              isOver={overContainer === 'pending'}
            />
          </div>

          {/* Add entry FAB */}
          <button
            onClick={() => setAddModalOpen(true)}
            className={[
              'absolute bottom-4 right-4 z-40',
              'w-12 h-12 rounded-full',
              'bg-primary text-on-primary',
              'shadow-lg hover:shadow-xl',
              'flex items-center justify-center',
              'hover:scale-105 active:scale-95',
              'transition-all duration-200',
            ].join(' ')}
            aria-label="添加条目"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        </main>

        {/* Drag overlay */}
        <DragOverlay>
          {activeEntry ? (
            <DraggableEntryCard entry={activeEntry} isDragOverlay />
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Status bar */}
      <StatusBar
        saveStatus={saveStatus}
        isDirty={isDirty}
        entryCount={totalEntryCount}
      />

      {/* Add entry modal */}
      <AddEntryModal
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
        onSubmit={handleAddEntry}
        isLoading={addingEntry}
      />

      {/* Delete ranking confirm */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="删除排行"
        description={
          <>
            确定要删除「{ranking.title}」吗？此操作不可恢复，
            所有条目将被一并删除。
          </>
        }
        confirmText="删除"
        onConfirm={handleDeleteRanking}
        variant="danger"
        requireInput={ranking.title}
        isLoading={deletingRanking}
      />

      {/* Navigation blocker dialog */}
      {blocker.state === 'blocked' && (
        <div className="fixed inset-0 z-[100] bg-black/40 flex items-center justify-center">
          <div className="bg-surface-container-lowest rounded-xl p-6 shadow-lg max-w-sm mx-4 w-full">
            <h3 className="text-headline-sm text-on-surface mb-2">未保存的变更</h3>
            <p className="text-body-md text-on-surface-variant mb-5 leading-relaxed">
              你有未保存的变更，确定要离开吗？
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => blocker.reset?.()}
                className="px-4 py-2 rounded-lg bg-surface-container text-on-surface-variant text-label-sm font-label-sm hover:bg-surface-container-high transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => blocker.proceed?.()}
                className="px-4 py-2 rounded-lg bg-primary text-on-primary text-label-sm font-label-sm hover:bg-primary-container hover:text-on-primary-container transition-colors"
              >
                离开
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
