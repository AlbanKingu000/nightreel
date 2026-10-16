import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { StarRating } from './StarRating'

function Harness({ initial = null }: { initial?: number | null }) {
  const [value, setValue] = useState<number | null>(initial)
  return <StarRating label="Your rating" value={value} onChange={setValue} />
}

const slider = () => screen.getByRole('slider', { name: 'Your rating' })
const fillOf = (star: number) =>
  screen.getByTestId(`star-${star}`).querySelector<HTMLElement>('span')?.style.width

describe('StarRating', () => {
  it('sets a rating by clicking a star', async () => {
    render(<Harness />)
    expect(slider()).toHaveAttribute('aria-valuetext', 'Not rated')
    await userEvent.click(screen.getByTestId('star-4'))
    expect(slider()).toHaveAttribute('aria-valuenow', '4')
    expect(slider()).toHaveAttribute('aria-valuetext', '4 out of 5 stars')
  })

  it('supports half-star keyboard steps, Home, End and clearing', async () => {
    const user = userEvent.setup()
    render(<Harness initial={3} />)
    slider().focus()
    await user.keyboard('{ArrowRight}')
    expect(slider()).toHaveAttribute('aria-valuenow', '3.5')
    await user.keyboard('{ArrowLeft}{ArrowDown}')
    expect(slider()).toHaveAttribute('aria-valuenow', '2.5')
    await user.keyboard('{End}{ArrowUp}')
    expect(slider()).toHaveAttribute('aria-valuenow', '5')
    await user.keyboard('{Home}')
    expect(slider()).toHaveAttribute('aria-valuenow', '0.5')
    await user.keyboard('{ArrowLeft}')
    expect(slider()).toHaveAttribute('aria-valuetext', 'Not rated')
    await user.keyboard('{ArrowUp}{Delete}')
    expect(slider()).toHaveAttribute('aria-valuetext', 'Not rated')
    await user.keyboard('a')
    expect(slider()).toHaveAttribute('aria-valuetext', 'Not rated')
  })

  it('clears with the button', async () => {
    render(<Harness initial={2} />)
    await userEvent.click(screen.getByRole('button', { name: 'Clear rating' }))
    expect(slider()).toHaveAttribute('aria-valuetext', 'Not rated')
  })

  it('previews on hover without committing', () => {
    render(<Harness />)
    fireEvent.mouseMove(screen.getByTestId('star-3'))
    expect(fillOf(3)).toBe('100%')
    expect(fillOf(4)).toBe('0%')
    fireEvent.mouseLeave(slider())
    expect(fillOf(1)).toBe('0%')
  })
})
