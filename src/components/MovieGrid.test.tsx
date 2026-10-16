import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { RouteError } from '../app/RouteError'
import { makeMovie } from '../test/factories'
import { renderRoute } from '../test/render'
import { MovieGrid, PAGE_SIZE } from './MovieGrid'

describe('MovieGrid', () => {
  it('shows a page of tickets and loads more on request', async () => {
    const movies = Array.from({ length: PAGE_SIZE + 6 }, () => makeMovie())
    renderRoute(<MovieGrid movies={movies} />)
    expect(screen.getAllByRole('article')).toHaveLength(PAGE_SIZE)
    await userEvent.click(screen.getByRole('button', { name: 'Show more (6 left)' }))
    expect(screen.getAllByRole('article')).toHaveLength(PAGE_SIZE + 6)
    expect(screen.queryByRole('button', { name: /Show more/ })).not.toBeInTheDocument()
  })

  it('loads more when the sentinel scrolls into view', async () => {
    let trigger: IntersectionObserverCallback = () => {}
    const Observer = vi.fn((callback: IntersectionObserverCallback) => {
      trigger = callback
      return { observe: vi.fn(), disconnect: vi.fn(), unobserve: vi.fn(), takeRecords: () => [] }
    })
    vi.stubGlobal('IntersectionObserver', Observer)
    const movies = Array.from({ length: PAGE_SIZE + 2 }, () => makeMovie())
    renderRoute(<MovieGrid movies={movies} />)
    const entry = { isIntersecting: true } as IntersectionObserverEntry
    act(() => trigger([entry], {} as IntersectionObserver))
    await waitFor(() => expect(screen.getAllByRole('article')).toHaveLength(PAGE_SIZE + 2))
  })

  it('renders the empty state when there are no movies', () => {
    renderRoute(<MovieGrid movies={[]} empty={<p>Nothing yet</p>} />)
    expect(screen.getByText('Nothing yet')).toBeInTheDocument()
  })
})

describe('RouteError', () => {
  it('explains route errors and links home', async () => {
    const router = createMemoryRouter([
      {
        path: '/',
        loader: () => {
          throw new Response('Missing', { status: 404, statusText: 'Not Found' })
        },
        element: <p>never</p>,
        errorElement: <RouteError />,
      },
    ])
    render(<RouterProvider router={router} />)
    expect(await screen.findByText('This reel jammed')).toBeInTheDocument()
    expect(screen.getByText('404 Not Found')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Back to the lobby' })).toHaveAttribute('href', '/')
  })

  it('handles unexpected errors', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const router = createMemoryRouter([
      {
        path: '/',
        loader: () => {
          throw new Error('boom')
        },
        element: <p>never</p>,
        errorElement: <RouteError />,
      },
    ])
    render(<RouterProvider router={router} />)
    expect(await screen.findByText('Something went wrong while loading this page.')).toBeInTheDocument()
  })
})
