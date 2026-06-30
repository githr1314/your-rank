import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DndContext } from '@dnd-kit/core'
import { DraggableEntryCard } from '../DraggableEntryCard'
import type { EntryResponse } from '@/types'

function renderInDndContext(ui: React.ReactElement) {
  return render(<DndContext>{ui}</DndContext>)
}

function makeEntry(overrides: Partial<EntryResponse> = {}): EntryResponse {
  return {
    id: 'entry-test-123',
    ranking_id: 'ranking-1',
    name: 'Test Entry Card',
    description: 'A test entry',
    image_url: '',
    link_url: '',
    tier: null,
    sort_order: 0,
    created_at: '2026-06-30T08:00:00Z',
    updated_at: '2026-06-30T08:30:00Z',
    ...overrides,
  }
}

describe('DraggableEntryCard', () => {
  it('renders entry name (may appear in multiple locations)', () => {
    const entry = makeEntry()
    renderInDndContext(
      <DraggableEntryCard entry={entry} />,
    )
    // Name appears at least once (in the fallback text and/or overlay)
    const nameElements = screen.getAllByText('Test Entry Card')
    expect(nameElements.length).toBeGreaterThanOrEqual(1)
  })

  it('shows tier badge when tier is set', () => {
    const entry = makeEntry({ tier: 'S' })
    renderInDndContext(
      <DraggableEntryCard entry={entry} />,
    )
    // Tier badge "S" appears at least once
    const tierBadges = screen.getAllByText('S')
    expect(tierBadges.length).toBeGreaterThanOrEqual(1)
    // All tier badges should have the tier-s styling class
    tierBadges.forEach((badge) => {
      expect(badge.className).toContain('bg-tier-s')
    })
  })

  it('shows image when image_url is provided', () => {
    const entry = makeEntry({
      image_url: 'https://example.com/test.jpg',
      tier: 'S',
    })
    renderInDndContext(
      <DraggableEntryCard entry={entry} />,
    )
    // Should find at least one img element with the correct src
    const images = screen.getAllByRole('img')
    const entryImage = images.find((img) => img.getAttribute('src') === 'https://example.com/test.jpg')
    expect(entryImage).toBeTruthy()
    expect(entryImage).toHaveAttribute('alt', 'Test Entry Card')
  })

  it('renders drag overlay variant without sortable context', () => {
    const entry = makeEntry({ tier: 'S' })
    // DragOverlay variant doesn't use useSortable
    const { container } = renderInDndContext(
      <DraggableEntryCard entry={entry} isDragOverlay />,
    )
    // Drag overlay card should have scale-105 class for visual feedback
    const overlayCards = container.querySelectorAll('.scale-105')
    expect(overlayCards.length).toBeGreaterThanOrEqual(1)
  })

  it('does not show action buttons when no callbacks provided', () => {
    const entry = makeEntry()
    const { container } = renderInDndContext(
      <DraggableEntryCard entry={entry} />,
    )
    const editButtons = container.querySelectorAll('button[aria-label="编辑"]')
    const deleteButtons = container.querySelectorAll('button[aria-label="删除"]')
    expect(editButtons).toHaveLength(0)
    expect(deleteButtons).toHaveLength(0)
  })
})
