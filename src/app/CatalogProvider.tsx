import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { ZodError } from 'zod'
import type { Catalog } from '../data/schema'
import { fetchCatalog } from '../data/loadCatalog'
import { buildCatalogIndex, type CatalogIndex } from '../domain/catalog-index'
import { createSearch, type SearchFn } from '../domain/search'
import { CatalogContext, type CatalogState } from './catalog-context'

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; catalog: Catalog }

function describeError(error: unknown): string {
  if (error instanceof ZodError) return 'The movie catalog file is damaged. Try rebuilding the data.'
  if (error instanceof Error) return error.message
  return 'Something went wrong loading the movies.'
}

/** Builds the fuzzy index on first use so the first paint isn't delayed. */
function lazySearch(index: CatalogIndex): SearchFn {
  let search: SearchFn | null = null
  return (query, limit) => {
    search ??= createSearch(index)
    return search(query, limit)
  }
}

interface CatalogProviderProps {
  children: ReactNode
  load?: () => Promise<Catalog>
}

export function CatalogProvider({ children, load = fetchCatalog }: CatalogProviderProps) {
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState<LoadState>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false
    load().then(
      (catalog) => {
        if (!cancelled) setState({ status: 'ready', catalog })
      },
      (error: unknown) => {
        if (!cancelled) setState({ status: 'error', message: describeError(error) })
      },
    )
    return () => {
      cancelled = true
    }
  }, [load, attempt])

  const value = useMemo<CatalogState>(() => {
    if (state.status === 'ready') {
      const index = buildCatalogIndex(state.catalog)
      return { status: 'ready', index, search: lazySearch(index) }
    }
    if (state.status === 'error') {
      const retry = () => {
        setState({ status: 'loading' })
        setAttempt((n) => n + 1)
      }
      return { status: 'error', message: state.message, retry }
    }
    return { status: 'loading' }
  }, [state])

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>
}
