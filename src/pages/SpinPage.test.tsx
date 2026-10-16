import { act, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { userStore } from '../store/userStore'
import { stubDetailFetch } from '../test/details'
import { renderRoute } from '../test/render'
import SpinPage, { SPIN_MS } from './SpinPage'

const originalMatchMedia = window.matchMedia

function setReducedMotion(reduce: boolean) {
  window.matchMedia = ((query: string) => ({
    matches: reduce && query.includes('reduce'),
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia
}

const renderSpin = (route = '/spin') => renderRoute(<SpinPage />, { path: '/spin', route })
const spinButton = () => screen.getByRole('button', { name: /Spin the reel|Spin again/ })

beforeEach(() => {
  stubDetailFetch()
})

afterEach(() => {
  window.matchMedia = originalMatchMedia
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('SpinPage', () => {
  it('reads the mood from the URL and reveals the pick instantly with reduced motion', async () => {
    setReducedMotion(true)
    vi.spyOn(Math, 'random').mockReturnValue(0)
    renderSpin('/spin?mood=spooky')
    expect(screen.getByRole('radio', { name: 'Spooky' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByText('2 films on this reel')).toBeInTheDocument()
    await userEvent.click(spinButton())
    expect(await screen.findByRole('heading', { name: 'The Shining' })).toBeInTheDocument()
    expect(userStore.getState().spinHistory).toEqual(['Q5'])
    expect(screen.getByRole('button', { name: /Spin again/ })).toBeInTheDocument()
  })

  it('rolls the reel before revealing the pick', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    vi.spyOn(Math, 'random').mockReturnValue(0)
    renderSpin('/spin?mood=spooky')
    await user.click(spinButton())
    expect(screen.queryByRole('heading', { name: 'The Shining' })).not.toBeInTheDocument()
    expect(spinButton()).toBeDisabled()
    act(() => vi.advanceTimersByTime(SPIN_MS))
    expect(screen.getByRole('heading', { name: 'The Shining' })).toBeInTheDocument()
  })

  it('updates the pool as filters change and blocks impossible spins', async () => {
    const user = userEvent.setup()
    renderSpin()
    expect(screen.getByRole('radio', { name: 'Surprise me' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByText('10 films on this reel')).toBeInTheDocument()
    await user.click(screen.getByRole('radio', { name: 'Laugh out loud' }))
    expect(screen.getByText('3 films on this reel')).toBeInTheDocument()
    await user.selectOptions(screen.getByLabelText('Length'), 'Under 1h 40m')
    expect(screen.getByText('1 film on this reel')).toBeInTheDocument()
    await user.click(screen.getByRole('radio', { name: 'Old Hollywood' }))
    expect(screen.getByText('No films match. Loosen a filter.')).toBeInTheDocument()
    expect(spinButton()).toBeDisabled()
  })
})
