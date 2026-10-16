import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { sampleMovies } from '../test/fixtures'
import '../test/render'
import { userStore } from '../store/userStore'
import { ReviewForm } from './ReviewForm'
import { Toasts } from './Toasts'

const inception = sampleMovies()[0]!
const review = () => userStore.getState().entries.Q1?.review?.text

describe('ReviewForm', () => {
  it('saves, shows, edits and deletes a private review', async () => {
    const user = userEvent.setup()
    render(
      <>
        <ReviewForm movie={inception} />
        <Toasts />
      </>,
    )
    const save = screen.getByRole('button', { name: 'Save review' })
    expect(save).toBeDisabled()

    await user.type(screen.getByLabelText('Your review of Inception'), 'Dreams within dreams')
    expect(screen.getByText('20/1000')).toBeInTheDocument()
    await user.click(save)
    expect(review()).toBe('Dreams within dreams')
    expect(screen.getByText('Dreams within dreams')).toBeInTheDocument()
    expect(screen.getByText('Review saved')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Edit review' }))
    const box = screen.getByLabelText('Your review of Inception')
    expect(box).toHaveValue('Dreams within dreams')
    await user.clear(box)
    await user.type(box, 'Even better twice')
    await user.click(screen.getByRole('button', { name: 'Save review' }))
    expect(review()).toBe('Even better twice')

    await user.click(screen.getByRole('button', { name: 'Delete review' }))
    expect(review()).toBeUndefined()
    expect(screen.getByLabelText('Your review of Inception')).toHaveValue('')
  })

  it('removes the review when saved empty', async () => {
    const user = userEvent.setup()
    userStore.getState().setReview('Q1', 'Old thoughts')
    render(<ReviewForm movie={inception} />)
    await user.click(screen.getByRole('button', { name: 'Edit review' }))
    await user.clear(screen.getByLabelText('Your review of Inception'))
    await user.click(screen.getByRole('button', { name: 'Save review' }))
    expect(review()).toBeUndefined()
  })
})
