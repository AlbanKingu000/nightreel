import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { sampleMovies } from '../test/fixtures'
import { expectPath, renderRoute } from '../test/render'
import { userStore } from '../store/userStore'
import { TicketCard } from './TicketCard'
import { Toasts } from './Toasts'

const inception = sampleMovies()[0]!

describe('TicketCard', () => {
  it('toggles the ticket with feedback and links to the movie', async () => {
    const user = userEvent.setup()
    const { router } = renderRoute(
      <>
        <TicketCard movie={inception} />
        <Toasts />
      </>,
    )
    const ticket = screen.getByRole('button', { name: 'Ticket for Inception' })
    expect(ticket).toHaveAttribute('aria-pressed', 'false')

    await user.click(ticket)
    expect(ticket).toHaveAttribute('aria-pressed', 'true')
    expect(userStore.getState().entries.Q1?.watchlistAt).toEqual(expect.any(Number))
    expect(screen.getByText('Added Inception to your tickets')).toBeInTheDocument()

    await user.click(ticket)
    expect(ticket).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByText('Removed Inception from your tickets')).toBeInTheDocument()

    await user.click(screen.getByRole('link', { name: /Inception/ }))
    await expectPath(router, '/movie/inception-2010')
  })

  it('shows a generated poster, year, runtime and a "Seen" tag for watched films', () => {
    userStore.getState().toggleWatched('Q1')
    renderRoute(<TicketCard movie={inception} />)
    const link = screen.getByRole('link', { name: /Inception/ })
    expect(link).not.toHaveTextContent(/Rated/)
    expect(screen.getByTestId('poster')).toHaveTextContent('Inception')
    expect(link).toHaveTextContent('2010 · 2h 28m')
    expect(screen.getByText('Seen')).toBeInTheDocument()
  })
})
