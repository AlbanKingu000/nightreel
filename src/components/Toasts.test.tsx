import { act, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useUi } from '../store/uiStore'
import { TOAST_MS, Toasts } from './Toasts'

beforeEach(() => useUi.setState({ toasts: [] }))
afterEach(() => vi.useRealTimers())

describe('Toasts', () => {
  it('announces a toast and dismisses it after a while', () => {
    vi.useFakeTimers()
    render(<Toasts />)
    act(() => useUi.getState().toast('Saved!', 'success'))
    expect(screen.getByRole('status')).toHaveTextContent('Saved!')
    act(() => vi.advanceTimersByTime(TOAST_MS))
    expect(screen.queryByText('Saved!')).not.toBeInTheDocument()
  })

  it('keeps only the three most recent toasts', () => {
    act(() => {
      for (let i = 1; i <= 5; i += 1) useUi.getState().toast(`T${i}`)
    })
    expect(useUi.getState().toasts.map((toast) => toast.message)).toEqual(['T3', 'T4', 'T5'])
  })
})
