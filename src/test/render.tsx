import { render, waitFor } from '@testing-library/react'
import type { ReactElement } from 'react'
import { createMemoryRouter, RouterProvider, type RouteObject } from 'react-router'
import { afterEach, expect } from 'vitest'
import { CatalogContext, type CatalogState, type ReadyCatalog } from '../app/catalog-context'
import type { Catalog } from '../data/schema'
import { buildCatalogIndex } from '../domain/catalog-index'
import { createSearch } from '../domain/search'
import { useUi } from '../store/uiStore'
import { userStore } from '../store/userStore'
import { sampleCatalog } from './fixtures'

afterEach(() => {
  userStore.getState().reset()
  useUi.setState({ searchOpen: false, toasts: [] })
})

export function readyCatalog(catalog: Catalog = sampleCatalog()): ReadyCatalog {
  const index = buildCatalogIndex(catalog)
  return { status: 'ready', index, search: createSearch(index) }
}

interface RenderRouteOptions {
  path?: string
  route?: string
  catalog?: CatalogState
  extraRoutes?: RouteObject[]
}

/** Renders a page inside a memory router and a ready catalog built from the test fixture. */
export function renderRoute(element: ReactElement, options: RenderRouteOptions = {}) {
  const { path = '/', route = '/', catalog = readyCatalog(), extraRoutes = [] } = options
  const routes: RouteObject[] = [
    { path, element },
    ...extraRoutes,
    { path: '*', element: <p>Other page</p> },
  ]
  const router = createMemoryRouter(routes, { initialEntries: [route] })
  const utils = render(
    <CatalogContext.Provider value={catalog}>
      <RouterProvider router={router} />
    </CatalogContext.Provider>,
  )
  return { ...utils, router }
}

type Router = ReturnType<typeof createMemoryRouter>

export const currentPath = (router: Router) =>
  `${router.state.location.pathname}${router.state.location.search}`

/** Router navigations settle asynchronously, so wait for the URL instead of reading it at once. */
export async function expectPath(router: Router, path: string | RegExp): Promise<void> {
  await waitFor(() => {
    if (typeof path === 'string') expect(currentPath(router)).toBe(path)
    else expect(currentPath(router)).toMatch(path)
  })
}
