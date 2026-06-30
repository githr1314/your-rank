import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDebounce } from '@/hooks/useDebounce'

// ─── Test utility functions extracted from RankingManagePage ───

type TierEnum = 'S' | 'A' | 'B' | 'C' | 'D' | null
type ContainerKey = 'S' | 'A' | 'B' | 'C' | 'D' | 'pending'

interface EntryResponse {
  id: string
  ranking_id: string
  name: string
  description: string
  image_url: string
  link_url: string
  tier: TierEnum
  sort_order: number
  created_at: string
  updated_at: string
}

type ItemsMap = Record<ContainerKey, EntryResponse[]>

const ALL_CONTAINER_KEYS: ContainerKey[] = ['S', 'A', 'B', 'C', 'D', 'pending']

function buildEmptyItems(): ItemsMap {
  return { S: [], A: [], B: [], C: [], D: [], pending: [] }
}

function groupEntriesByTier(entries: EntryResponse[]): ItemsMap {
  const items = buildEmptyItems()
  for (const entry of entries) {
    const key: ContainerKey = entry.tier !== null ? entry.tier as ContainerKey : 'pending'
    items[key].push(entry)
  }
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

function buildReorderUpdates(items: ItemsMap) {
  const updates: Array<{ id: string; tier: TierEnum; sort_order: number }> = []
  for (const key of ALL_CONTAINER_KEYS) {
    items[key].forEach((entry, index) => {
      updates.push({
        id: entry.id,
        tier: key === 'pending' ? null : (key as TierEnum),
        sort_order: index,
      })
    })
  }
  return updates
}

// ─── Helper to create mock entries ────────────────────────────

function makeEntry(overrides: Partial<EntryResponse> = {}): EntryResponse {
  return {
    id: `entry-${Math.random().toString(36).slice(2, 8)}`,
    ranking_id: 'ranking-1',
    name: 'Test Entry',
    description: '',
    image_url: '',
    link_url: '',
    tier: null,
    sort_order: 0,
    created_at: '2026-06-30T08:00:00Z',
    updated_at: '2026-06-30T08:30:00Z',
    ...overrides,
  }
}

// ─── Tests ───────────────────────────────────────────────────

describe('buildEmptyItems', () => {
  it('returns empty arrays for all 6 containers', () => {
    const items = buildEmptyItems()
    expect(Object.keys(items)).toHaveLength(6)
    for (const key of ALL_CONTAINER_KEYS) {
      expect(items[key]).toEqual([])
    }
  })
})

describe('groupEntriesByTier', () => {
  it('groups S tier entries correctly', () => {
    const entries = [
      makeEntry({ id: 'e1', tier: 'S', sort_order: 0 }),
      makeEntry({ id: 'e2', tier: 'S', sort_order: 1 }),
    ]
    const items = groupEntriesByTier(entries)
    expect(items.S).toHaveLength(2)
    expect(items.A).toHaveLength(0)
    expect(items.pending).toHaveLength(0)
  })

  it('groups entries across multiple tiers', () => {
    const entries = [
      makeEntry({ id: 'e1', tier: 'S', sort_order: 0 }),
      makeEntry({ id: 'e2', tier: 'A', sort_order: 1 }),
      makeEntry({ id: 'e3', tier: null, sort_order: 2 }),
      makeEntry({ id: 'e4', tier: 'C', sort_order: 3 }),
    ]
    const items = groupEntriesByTier(entries)
    expect(items.S).toHaveLength(1)
    expect(items.A).toHaveLength(1)
    expect(items.C).toHaveLength(1)
    expect(items.pending).toHaveLength(1)
    expect(items.B).toHaveLength(0)
    expect(items.D).toHaveLength(0)
  })

  it('sorts entries by sort_order within each tier', () => {
    const entries = [
      makeEntry({ id: 'e1', tier: 'S', sort_order: 2 }),
      makeEntry({ id: 'e2', tier: 'S', sort_order: 0 }),
      makeEntry({ id: 'e3', tier: 'S', sort_order: 1 }),
    ]
    const items = groupEntriesByTier(entries)
    expect(items.S.map((e) => e.sort_order)).toEqual([0, 1, 2])
    expect(items.S.map((e) => e.id)).toEqual(['e2', 'e3', 'e1'])
  })

  it('puts null-tier entries into pending zone', () => {
    const entries = [
      makeEntry({ id: 'e1', tier: null, sort_order: 0 }),
      makeEntry({ id: 'e2', tier: null, sort_order: 1 }),
    ]
    const items = groupEntriesByTier(entries)
    expect(items.pending).toHaveLength(2)
    expect(items.pending.map((e) => e.id)).toEqual(['e1', 'e2'])
  })

  it('handles empty input', () => {
    const items = groupEntriesByTier([])
    for (const key of ALL_CONTAINER_KEYS) {
      expect(items[key]).toEqual([])
    }
  })
})

describe('findContainerKey', () => {
  const items: ItemsMap = {
    S: [makeEntry({ id: 's1', tier: 'S' })],
    A: [makeEntry({ id: 'a1', tier: 'A' })],
    B: [],
    C: [],
    D: [],
    pending: [makeEntry({ id: 'p1', tier: null })],
  }

  it('finds entry in S tier', () => {
    expect(findContainerKey('s1', items)).toBe('S')
  })

  it('finds entry in A tier', () => {
    expect(findContainerKey('a1', items)).toBe('A')
  })

  it('finds entry in pending zone', () => {
    expect(findContainerKey('p1', items)).toBe('pending')
  })

  it('returns null for unknown entry', () => {
    expect(findContainerKey('nonexistent', items)).toBeNull()
  })
})

describe('buildReorderUpdates', () => {
  it('generates correct updates for all containers', () => {
    const items: ItemsMap = {
      S: [makeEntry({ id: 's1', tier: 'S', sort_order: 0 })],
      A: [
        makeEntry({ id: 'a1', tier: 'A', sort_order: 0 }),
        makeEntry({ id: 'a2', tier: 'A', sort_order: 1 }),
      ],
      B: [],
      C: [],
      D: [],
      pending: [makeEntry({ id: 'p1', tier: null, sort_order: 0 })],
    }

    const updates = buildReorderUpdates(items)

    expect(updates).toHaveLength(4)

    // S tier
    const sUpdate = updates.find((u) => u.id === 's1')
    expect(sUpdate).toBeDefined()
    expect(sUpdate!.tier).toBe('S')
    expect(sUpdate!.sort_order).toBe(0)

    // A tier
    const a1Update = updates.find((u) => u.id === 'a1')
    expect(a1Update).toBeDefined()
    expect(a1Update!.tier).toBe('A')
    expect(a1Update!.sort_order).toBe(0)

    const a2Update = updates.find((u) => u.id === 'a2')
    expect(a2Update).toBeDefined()
    expect(a2Update!.tier).toBe('A')
    expect(a2Update!.sort_order).toBe(1)

    // Pending
    const pUpdate = updates.find((u) => u.id === 'p1')
    expect(pUpdate).toBeDefined()
    expect(pUpdate!.tier).toBeNull()
    expect(pUpdate!.sort_order).toBe(0)
  })

  it('assigns index-based sort_order within each container', () => {
    const items: ItemsMap = {
      S: [makeEntry({ id: 's2', tier: 'S', sort_order: 5 }), makeEntry({ id: 's1', tier: 'S', sort_order: 10 })],
      A: [],
      B: [],
      C: [],
      D: [],
      pending: [],
    }

    const updates = buildReorderUpdates(items)

    const s2 = updates.find((u) => u.id === 's2')
    const s1 = updates.find((u) => u.id === 's1')
    expect(s2!.sort_order).toBe(0)
    expect(s1!.sort_order).toBe(1)
  })
})

// ─── useDebounce hook test ───────────────────────────────────

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  it('returns initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('hello', 800))
    expect(result.current).toBe('hello')
  })

  it('updates value after delay', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 800),
      { initialProps: { value: 'hello' } },
    )

    expect(result.current).toBe('hello')

    rerender({ value: 'world' })
    // Should still be old value before timeout
    expect(result.current).toBe('hello')

    act(() => {
      vi.advanceTimersByTime(800)
    })

    expect(result.current).toBe('world')
  })

  it('resets timer on rapid changes', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 800),
      { initialProps: { value: 'a' } },
    )

    rerender({ value: 'b' })
    act(() => { vi.advanceTimersByTime(400) })

    rerender({ value: 'c' })
    // Advance to just before the second change's deadline
    act(() => { vi.advanceTimersByTime(790) })
    // Not yet 800ms from the second change
    expect(result.current).toBe('a')

    act(() => { vi.advanceTimersByTime(20) })
    // Now 810ms from the second change
    expect(result.current).toBe('c')
  })
})
