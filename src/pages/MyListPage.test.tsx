import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { userStore } from '../store/userStore'
import { expectPath, renderRoute } from '../test/render'
import MyListPage from './MyListPage'

const renderList = (route = '/my-list') => renderRoute(<MyListPage />, { path: '/my-list', route })

describe('MyListPage', () => {
  it('shows stats and switches between lists with clicks and arrow keys', async () => {
    const user = userEvent.setup()
    const state = userStore.getState()
    state.toggleWatchlist('Q2')
    state.toggleWatched('Q1')
    state.toggleFavorite('Q3')
    state.setRating('Q5', 4)
    state.setReview('Q5', 'Creepy in the best way')

    const { router } = renderList()
    expect(screen.getByText('Films watched').parentElement).toHaveTextContent('Films watched1')
    expect(screen.getByText('Hours in the dark').parentElement).toHaveTextContent('2.5')
    expect(screen.getByRole('tab', { name: /Tickets/ })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getAllByRole('article')).toHaveLength(1)
    expect(screen.getByRole('article')).toHaveTextContent('Amélie')

    const selected = (name: RegExp) =>
      waitFor(() => expect(screen.getByRole('tab', { name })).toHaveAttribute('aria-selected', 'true'))

    await user.click(screen.getByRole('tab', { name: /Watched/ }))
    await expectPath(router, '/my-list?tab=watched')
    await waitFor(() => expect(screen.getByRole('article')).toHaveTextContent('Inception'))

    await user.keyboard('{ArrowRight}')
    await selected(/Favorites/)
    expect(screen.getByRole('article')).toHaveTextContent('The Godfather')

    await user.keyboard('{ArrowRight}')
    expect(await screen.findByText('Creepy in the best way')).toBeInTheDocument()
    expect(screen.getByText(/4 \/ 5/)).toBeInTheDocument()

    await user.keyboard('{ArrowRight}')
    await selected(/Tickets/)
    await user.keyboard('{ArrowLeft}x')
    await selected(/Rated/)
  })

  it('shows friendly empty states', () => {
    renderList('/my-list?tab=rated')
    expect(screen.getByText('Nothing here yet')).toBeInTheDocument()
    expect(screen.getByText(/Average rating/).parentElement).toHaveTextContent('—')
    expect(screen.getAllByText('Mark films as watched to see this.')).toHaveLength(2)
  })
})
