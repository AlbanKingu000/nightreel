import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { readyCatalog } from '../test/render'
import { CatalogContext, type CatalogState } from './catalog-context'
import { Layout } from './Layout'

function Boom(): never {
  throw new Error('kaboom')
}

function renderLayout(catalog: CatalogState, route = '/') {
  const router = createMemoryRouter(
    [
      {
        path: '/',
        element: <Layout />,
        children: [
          { index: true, element: <p>Home content</p> },
          { path: 'boom', element: <Boom /> },
        ],
      },
    ],
    { initialEntries: [route] },
  )
  return render(
    <CatalogContext.Provider value={catalog}>
      <RouterProvider router={router} />
    </CatalogContext.Provider>,
  )
}

describe('Layout', () => {
  it('renders the page inside the site chrome', () => {
    renderLayout(readyCatalog())
    expect(screen.getByText('Home content')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Nightreel home' })).toBeInTheDocument()
    expect(screen.getByRole('contentinfo')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Skip to content' })).toHaveAttribute('href', '#main')
  })

  it('shows a skeleton while the catalog loads', () => {
    renderLayout({ status: 'loading' })
    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument()
  })

  it('offers a retry when the catalog fails', async () => {
    const retry = vi.fn()
    renderLayout({ status: 'error', message: 'Offline', retry })
    expect(screen.getByText('Offline')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(retry).toHaveBeenCalled()
  })

  it('opens search with Ctrl+K and closes it with Escape', async () => {
    renderLayout(readyCatalog())
    await userEvent.keyboard('{Control>}k{/Control}')
    expect(await screen.findByRole('dialog', { name: 'Search' })).toBeInTheDocument()
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('opens search from the header button', async () => {
    renderLayout(readyCatalog())
    await userEvent.click(screen.getByRole('button', { name: 'Search movies and people' }))
    expect(screen.getByRole('dialog', { name: 'Search' })).toBeInTheDocument()
  })

  it('contains a crashing page instead of blanking the site', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    renderLayout(readyCatalog(), '/boom')
    expect(screen.getByText('This reel jammed')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Nightreel home' })).toBeInTheDocument()
    spy.mockRestore()
  })
})
