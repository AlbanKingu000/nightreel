import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { clearDetailCache } from '../data/loadCatalog'
import { justWatchUrl } from '../domain/links'
import { userStore } from '../store/userStore'
import { stubDetailFetch } from '../test/details'
import { renderRoute } from '../test/render'
import MoviePage from './MoviePage'

const renderMovie = (slug = 'inception-2010') =>
  renderRoute(<MoviePage />, { path: '/movie/:slug', route: `/movie/${slug}` })
const entry = () => userStore.getState().entries.Q1

beforeEach(() => {
  stubDetailFetch({
    Q1: {
      overview: 'A thief steals secrets through dreams.',
      trailer: { youtubeId: 'YoHD9XEInc0', kind: 'trailer' },
      countries: ['United States', 'United Kingdom'],
    },
  })
})

describe('MoviePage', () => {
  it('shows the movie with details, crew and similar films', async () => {
    renderMovie()
    expect(screen.getByRole('heading', { level: 1, name: 'Inception' })).toBeInTheDocument()
    expect(await screen.findByText('A thief steals secrets through dreams.')).toBeInTheDocument()
    expect(screen.getByText(/United States, United Kingdom/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Christopher Nolan' })).toHaveAttribute('href', '/person/Q100-christopher-nolan')
    expect(screen.getByRole('link', { name: 'Michael Caine' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'More like this' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Where to watch/ })).toHaveAttribute('href', justWatchUrl('Inception'))
    expect(screen.getByRole('button', { name: /Watch trailer/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Wikipedia article' })).toHaveAttribute('href', 'https://en.wikipedia.org/wiki/Q1')
    expect(screen.queryByRole('link', { name: /IMDb/ })).toBeNull()
    expect(document.title).toBe('Inception (2010) · Nightreel')
  })

  it('lets you save, watch, favorite and rate', async () => {
    const user = userEvent.setup()
    renderMovie()
    await user.click(screen.getByRole('button', { name: 'Get a ticket' }))
    expect(entry()?.watchlistAt).toEqual(expect.any(Number))
    await user.click(screen.getByRole('button', { name: 'Mark watched' }))
    expect(entry()).toEqual({ watchedAt: expect.any(Number) })
    await user.click(screen.getByRole('button', { name: 'Add to favorites' }))
    expect(entry()?.favoriteAt).toEqual(expect.any(Number))
    await user.click(screen.getByTestId('star-5'))
    expect(entry()?.rating).toBe(5)
    await user.click(screen.getByRole('button', { name: 'Watched' }))
    await user.click(screen.getByRole('button', { name: 'Favorite' }))
    await user.click(screen.getByRole('button', { name: 'Clear rating' }))
    expect(entry()).toBeUndefined()
  })

  it('shows awards', () => {
    renderMovie('the-godfather-1972')
    expect(screen.getByText('Best Picture winner')).toBeInTheDocument()
  })

  it('degrades gracefully when details fail to load', async () => {
    clearDetailCache()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 500 })))
    renderMovie()
    expect(await screen.findByText('The synopsis is unavailable right now.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Find the trailer/ })).toBeInTheDocument()
  })

  it('shows the missing-reel page for unknown movies', () => {
    renderMovie('nope-1999')
    expect(screen.getByText('This reel is missing')).toBeInTheDocument()
  })
})
