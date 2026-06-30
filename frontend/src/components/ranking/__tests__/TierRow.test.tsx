import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DndContext } from '@dnd-kit/core'
import { TierRow } from '../TierRow'
import type { EntryResponse } from '@/types'

function makeEntry(overrides: Partial<EntryResponse> = {}): EntryResponse {
  return {
    id: `entry-${Math.random().toString(36).slice(2, 8)}`,
    ranking_id: 'ranking-1',
    name: 'Test',
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

function renderInDndContext(ui: React.ReactElement) {
  return render(<DndContext>{ui}</DndContext>)
}

describe('TierRow', () => {
  it('renders tier badge with label', () => {
    const entries: EntryResponse[] = []
    renderInDndContext(
      <TierRow
        tier="S"
        label="神中神"
        entries={entries}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    )

    expect(screen.getByText('S')).toBeInTheDocument()
    expect(screen.getByText('神中神')).toBeInTheDocument()
  })

  it('shows empty state when no entries', () => {
    const entries: EntryResponse[] = []
    renderInDndContext(
      <TierRow
        tier="A"
        label="杀疯了"
        entries={entries}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    )

    expect(screen.getByText('拖拽条目到此处')).toBeInTheDocument()
  })

  it('renders entry cards', () => {
    const entries: EntryResponse[] = [
      makeEntry({ id: 'e1', name: 'Entry 1', tier: 'S' }),
      makeEntry({ id: 'e2', name: 'Entry 2', tier: 'S' }),
    ]
    renderInDndContext(
      <TierRow
        tier="S"
        label="神中神"
        entries={entries}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    )

    // Entry names may appear in multiple locations (fallback + overlay)
    const entry1Elements = screen.getAllByText('Entry 1')
    expect(entry1Elements.length).toBeGreaterThanOrEqual(1)

    const entry2Elements = screen.getAllByText('Entry 2')
    expect(entry2Elements.length).toBeGreaterThanOrEqual(1)
  })

  it('applies highlight when isOver is true', () => {
    const entries: EntryResponse[] = []
    const { container } = renderInDndContext(
      <TierRow
        tier="S"
        label="神中神"
        entries={entries}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        isOver={true}
      />,
    )

    const row = container.firstChild as HTMLElement
    // Should have border-primary class when receiving drag
    expect(row.className).toContain('border-primary')
  })

  it('does not apply highlight when isOver is false', () => {
    const entries: EntryResponse[] = []
    const { container } = renderInDndContext(
      <TierRow
        tier="S"
        label="神中神"
        entries={entries}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        isOver={false}
      />,
    )

    const row = container.firstChild as HTMLElement
    // Should have border-border-light when not receiving drag
    expect(row.className).toContain('border-border-light')
  })
})
