import '@testing-library/jest-dom'
import { vi } from 'vitest'

// ─── localStorage mock ─────────────────────────────────
const store: Record<string, string> = {}

const localStorageMock: Storage = {
  getItem: (key: string) => store[key] ?? null,
  setItem: (key: string, value: string) => {
    store[key] = value
  },
  removeItem: (key: string) => {
    delete store[key]
  },
  clear: () => {
    Object.keys(store).forEach((k) => delete store[k])
  },
  get length() {
    return Object.keys(store).length
  },
  key(index: number) {
    return Object.keys(store)[index] ?? null
  },
}

Object.defineProperty(window, 'localStorage', { value: localStorageMock })

// ─── URL.createObjectURL / revokeObjectURL mock ─────────
window.URL.createObjectURL = vi.fn(() => 'blob:mocked-url')
window.URL.revokeObjectURL = vi.fn()

// ─── HTMLCanvasElement.getContext mock ──────────────────
HTMLCanvasElement.prototype.getContext = vi.fn(() => null) as unknown as typeof HTMLCanvasElement.prototype.getContext

// ─── IntersectionObserver mock ──────────────────────────
class MockIntersectionObserver implements IntersectionObserver {
  readonly root: Element | Document | null = null
  readonly rootMargin: string = ''
  readonly thresholds: ReadonlyArray<number> = [0]
  readonly scrollMargin: string = ''

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(_callback: IntersectionObserverCallback) {
    // No-op: callback not used in mock
  }

  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
  takeRecords = vi.fn(() => [] as IntersectionObserverEntry[])
}

Object.defineProperty(window, 'IntersectionObserver', {
  value: MockIntersectionObserver,
  writable: true,
})

// ─── ResizeObserver mock ────────────────────────────────
class MockResizeObserver {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
}

Object.defineProperty(window, 'ResizeObserver', {
  value: MockResizeObserver,
  writable: true,
})

// ─── Clipboard API mock ─────────────────────────────────
Object.defineProperty(navigator, 'clipboard', {
  value: {
    readText: vi.fn(() => Promise.resolve('')),
    writeText: vi.fn(() => Promise.resolve()),
  },
  writable: true,
})
