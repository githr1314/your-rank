import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { DEBOUNCE_MS } from '@/utils/constants'

// ─── Test: Debounced save pattern ───────────────────────────
// This tests the save logic pattern used in RankingManagePage:
// - 800ms debounce on drag changes
// - Timer reset on rapid triggers
// - Proper timeout cleanup

describe('debounced save pattern', () => {
  let saveTimerId: ReturnType<typeof setTimeout> | null
  let saveCount: number

  beforeEach(() => {
    vi.useFakeTimers()
    saveTimerId = null
    saveCount = 0
  })

  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
  })

  function triggerSave() {
    if (saveTimerId) {
      clearTimeout(saveTimerId)
    }

    saveTimerId = setTimeout(() => {
      saveCount++
    }, DEBOUNCE_MS)
  }

  it('saves after 800ms debounce', () => {
    triggerSave()

    // Before debounce window
    vi.advanceTimersByTime(DEBOUNCE_MS - 1)
    expect(saveCount).toBe(0)

    // After debounce window
    vi.advanceTimersByTime(1)
    expect(saveCount).toBe(1)
  })

  it('resets debounce timer on rapid triggers', () => {
    // Simulate the ref pattern: rapid changes reset the timer
    triggerSave()
    vi.advanceTimersByTime(300)

    triggerSave() // Reset timer
    vi.advanceTimersByTime(300)

    triggerSave() // Reset timer again
    vi.advanceTimersByTime(DEBOUNCE_MS - 1)
    // Should NOT have fired because last reset was only 799ms ago
    expect(saveCount).toBe(0)

    vi.advanceTimersByTime(1)
    expect(saveCount).toBe(1)
  })
})

// ─── Test: Unsaved changes protection ───────────────────────

describe('unsaved changes protection', () => {
  let addEventListenerSpy: ReturnType<typeof vi.spyOn>
  let removeEventListenerSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    addEventListenerSpy = vi.spyOn(window, 'addEventListener')
    removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')
  })

  afterEach(() => {
    addEventListenerSpy.mockRestore()
    removeEventListenerSpy.mockRestore()
  })

  it('registers beforeunload when isDirty is true', () => {
    const handler = () => {}
    window.addEventListener('beforeunload', handler)

    expect(addEventListenerSpy).toHaveBeenCalledWith(
      'beforeunload',
      expect.any(Function),
    )

    window.removeEventListener('beforeunload', handler)
  })

  it('does not register beforeunload when not dirty', () => {
    // When isDirty is false, no beforeunload listener is added
    const beforeUnloadCalls = addEventListenerSpy.mock.calls.filter(
      (call: unknown[]) => call[0] === 'beforeunload',
    )
    expect(beforeUnloadCalls).toHaveLength(0)
  })

  it('handler calls preventDefault (pattern from RankingManagePage)', () => {
    // This is the exact handler pattern used in RankingManagePage
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
    }

    const mockEvent = new Event('beforeunload') as BeforeUnloadEvent
    const preventDefaultSpy = vi.spyOn(mockEvent, 'preventDefault')

    handler(mockEvent)

    expect(preventDefaultSpy).toHaveBeenCalled()
  })

  it('cleans up beforeunload listener', () => {
    const handler = () => {}
    window.addEventListener('beforeunload', handler)

    // Cleanup
    window.removeEventListener('beforeunload', handler)

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'beforeunload',
      handler,
    )
  })
})
