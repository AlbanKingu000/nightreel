import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderRoute } from '../test/render'
import AboutPage from './AboutPage'
import CollectionPage from './CollectionPage'
import GenrePage from './GenrePage'
import NotFoundPage from './NotFoundPage'

describe('GenrePage', () => {
  it('shows shelves for the genre and a link to filter it', () => {
    renderRoute(<GenrePage />, { path: '/genre/:genreSlug', route: '/genre/drama' })
    expect(screen.getByRole('heading', { level: 1, name: 'Drama' })).toBeInTheDocument()
    expect(screen.getByText('5 films')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Most awarded' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Filter and sort all 5' })).toHaveAttribute('href', '/browse?g=drama')
    expect(screen.getByRole('link', { name: 'Comedy' })).toHaveAttribute('href', '/genre/comedy')
  })

  it('shows the missing-reel page for unknown genres', () => {
    renderRoute(<GenrePage />, { path: '/genre/:genreSlug', route: '/genre/cooking' })
    expect(screen.getByText('This reel is missing')).toBeInTheDocument()
  })
})

describe('CollectionPage', () => {
  it('lists the collection', () => {
    renderRoute(<CollectionPage />, { path: '/collection/:collectionId', route: '/collection/best-picture' })
    expect(screen.getByRole('heading', { level: 1, name: 'Best Picture winners' })).toBeInTheDocument()
    expect(screen.getAllByRole('article')).toHaveLength(2)
    expect(screen.getByRole('link', { name: 'Hidden gems' })).toHaveAttribute('href', '/collection/hidden-gems')
  })

  it('shows the missing-reel page for unknown collections', () => {
    renderRoute(<CollectionPage />, { path: '/collection/:collectionId', route: '/collection/nope' })
    expect(screen.getByText('This reel is missing')).toBeInTheDocument()
  })
})

describe('AboutPage', () => {
  it('describes the catalog, privacy and credits', () => {
    renderRoute(<AboutPage />)
    expect(screen.getByText('10 films')).toBeInTheDocument()
    expect(screen.getByText(/Wikidata, CC0/)).toBeInTheDocument()
    expect(screen.getByText(/saved only in this browser/)).toBeInTheDocument()
  })
})

describe('NotFoundPage', () => {
  it('offers ways back', () => {
    renderRoute(<NotFoundPage />)
    expect(screen.getByRole('link', { name: 'Back to the lobby' })).toHaveAttribute('href', '/')
    expect(document.title).toBe('Reel not found · Nightreel')
  })
})
