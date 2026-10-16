import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { sampleMovies } from '../test/fixtures'
import '../test/render'
import { ShareButton } from './ShareButton'
import { Toasts } from './Toasts'

const inception = sampleMovies()[0]!

function setShare(share: unknown) {
  Object.defineProperty(navigator, 'share', { value: share, configurable: true, writable: true })
}

function renderButton() {
  render(
    <>
      <ShareButton movie={inception} />
      <Toasts />
    </>,
  )
}

afterEach(() => setShare(undefined))

describe('ShareButton', () => {
  it('uses the native share sheet when available', async () => {
    const share = vi.fn().mockResolvedValue(undefined)
    setShare(share)
    renderButton()
    await userEvent.click(screen.getByRole('button', { name: 'Share' }))
    expect(share).toHaveBeenCalledWith(expect.objectContaining({ title: 'Inception (2010)' }))
  })

  it('copies the link otherwise', async () => {
    const user = userEvent.setup()
    setShare(undefined)
    renderButton()
    await user.click(screen.getByRole('button', { name: 'Share' }))
    expect(await navigator.clipboard.readText()).toBe(window.location.href)
    expect(screen.getByText('Link copied to your clipboard')).toBeInTheDocument()
  })

  it('stays quiet when the user cancels, and reports real failures', async () => {
    setShare(vi.fn().mockRejectedValueOnce(new DOMException('cancelled', 'AbortError')).mockRejectedValueOnce(new Error('boom')))
    renderButton()
    await userEvent.click(screen.getByRole('button', { name: 'Share' }))
    expect(screen.queryByText(/Couldn't share/)).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Share' }))
    expect(screen.getByText(/Couldn't share this link/)).toBeInTheDocument()
  })
})
