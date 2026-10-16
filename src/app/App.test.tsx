import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { clearDetailCache } from '../data/loadCatalog'
import { makeDetail } from '../test/details'
import { sampleCatalog } from '../test/fixtures'
import '../test/render'
import { App } from './App'
import { routes } from './router'

describe('App', () => {
  it('declares a route for every page', () => {
    const paths = routes[0]?.children?.map((route) => route.path ?? 'index')
    expect(paths).toEqual([
      'index',
      'browse',
      'movie/:slug',
      'person/:personKey',
      'genre/:genreSlug',
      'collection/:collectionId',
      'my-list',
      'spin',
      'about',
      '*',
    ])
  })

  it('loads the catalog, renders home and lazily loads other pages', async () => {
    clearDetailCache()
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input)
        if (url.endsWith('catalog.json')) return new Response(JSON.stringify(sampleCatalog()))
        const id = /(Q\d+)\.json$/.exec(url)?.[1] ?? 'Q1'
        return new Response(JSON.stringify(makeDetail(id)))
      }),
    )
    render(<App />)
    expect(await screen.findByText("Tonight's feature")).toBeInTheDocument()
    const nav = screen.getByRole('navigation', { name: 'Main' })
    await userEvent.click(within(nav).getByRole('link', { name: 'Browse' }))
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Browse' }, { timeout: 15_000 }),
    ).toBeInTheDocument()
  }, 20_000)
})
