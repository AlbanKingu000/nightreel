import { renderHook, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { clearDetailCache } from '../data/loadCatalog'
import { stubDetailFetch } from '../test/details'
import { useAmbient } from './useAmbient'
import { useDocumentTitle } from './useDocumentTitle'
import { useMovieDetail } from './useMovieDetail'
import { usePrefersReducedMotion } from './usePrefersReducedMotion'
import { useSearchHotkey } from './useSearchHotkey'

describe('useAmbient', () => {
  it('tints the page while mounted', () => {
    const { unmount } = renderHook(() => useAmbient('#123456'))
    expect(document.documentElement.style.getPropertyValue('--ambient')).toBe('#123456')
    unmount()
    expect(document.documentElement.style.getPropertyValue('--ambient')).toBe('')
  })

  it('does nothing without a color', () => {
    renderHook(() => useAmbient(undefined))
    expect(document.documentElement.style.getPropertyValue('--ambient')).toBe('')
  })
})

describe('useDocumentTitle', () => {
  it('sets page titles', () => {
    renderHook(() => useDocumentTitle('Browse'))
    expect(document.title).toBe('Browse · Nightreel')
    renderHook(() => useDocumentTitle(null))
    expect(document.title).toBe("Nightreel · find tonight's movie")
  })
})

describe('useMovieDetail', () => {
  it('loads details for the current id', async () => {
    stubDetailFetch()
    const { result, rerender } = renderHook(({ id }: { id: string | undefined }) => useMovieDetail(id), {
      initialProps: { id: 'Q1' as string | undefined },
    })
    expect(result.current.status).toBe('loading')
    await waitFor(() => expect(result.current).toMatchObject({ status: 'ready', detail: { id: 'Q1' } }))
    rerender({ id: undefined })
    expect(result.current.status).toBe('loading')
  })

  it('reports failures', async () => {
    clearDetailCache()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 500 })))
    const { result } = renderHook(() => useMovieDetail('Q9'))
    await waitFor(() => expect(result.current.status).toBe('error'))
  })
})

describe('usePrefersReducedMotion', () => {
  it('reads the media query', () => {
    expect(renderHook(() => usePrefersReducedMotion()).result.current).toBe(false)
  })
})

describe('useSearchHotkey', () => {
  it('opens on "/" unless the user is typing', async () => {
    const onOpen = vi.fn()
    renderHook(() => useSearchHotkey(onOpen))
    await userEvent.keyboard('/')
    expect(onOpen).toHaveBeenCalledTimes(1)
    const input = document.createElement('input')
    document.body.append(input)
    input.focus()
    await userEvent.keyboard('/')
    expect(onOpen).toHaveBeenCalledTimes(1)
    await userEvent.keyboard('{Control>}k{/Control}')
    expect(onOpen).toHaveBeenCalledTimes(2)
    input.remove()
  })
})
