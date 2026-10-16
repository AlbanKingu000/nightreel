import '@testing-library/jest-dom/vitest'
import { afterEach, vi } from 'vitest'
import { cleanup, configure } from '@testing-library/react'

// Coverage instrumentation slows rendering; give findBy/waitFor more headroom than the 1s default.
configure({ asyncUtilTimeout: 5000 })

const isBrowserLike = typeof window !== 'undefined'

class MockIntersectionObserver {
  readonly root = null
  readonly rootMargin = ''
  readonly thresholds = []
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
  takeRecords = () => []
}

if (isBrowserLike) {
  Object.defineProperty(window, 'IntersectionObserver', {
    writable: true,
    configurable: true,
    value: MockIntersectionObserver,
  })

  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }),
  })

  // React Router builds `new Request(url, { signal })` with jsdom's AbortSignal, which Node's
  // Request rejects. Dropping the signal keeps navigations working in tests.
  const NodeRequest = globalThis.Request
  class JsdomSafeRequest extends NodeRequest {
    constructor(input: RequestInfo | URL, init?: RequestInit) {
      super(input, { ...init, signal: undefined })
    }
  }
  globalThis.Request = JsdomSafeRequest

  window.scrollTo = vi.fn() as unknown as typeof window.scrollTo
  Element.prototype.scrollIntoView = vi.fn()
  Element.prototype.scrollBy = vi.fn() as unknown as typeof Element.prototype.scrollBy
}

afterEach(() => {
  if (!isBrowserLike) return
  cleanup()
  localStorage.clear()
})
