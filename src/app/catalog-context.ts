import { createContext, useContext } from 'react'
import type { CatalogIndex } from '../domain/catalog-index'
import type { SearchFn } from '../domain/search'

export type ReadyCatalog = { status: 'ready'; index: CatalogIndex; search: SearchFn }

export type CatalogState =
  | { status: 'loading' }
  | { status: 'error'; message: string; retry: () => void }
  | ReadyCatalog

export const CatalogContext = createContext<CatalogState>({ status: 'loading' })

export const useCatalogState = (): CatalogState => useContext(CatalogContext)

/** For pages: the layout only renders routes once the catalog is ready. */
export function useCatalog(): ReadyCatalog {
  const state = useCatalogState()
  if (state.status !== 'ready') throw new Error('The catalog is not loaded yet')
  return state
}
