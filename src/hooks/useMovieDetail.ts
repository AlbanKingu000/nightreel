import { useEffect, useState } from 'react'
import { fetchMovieDetail } from '../data/loadCatalog'
import type { MovieDetail } from '../data/schema'

export type DetailState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; detail: MovieDetail }

const LOADING: DetailState = { status: 'loading' }

export function useMovieDetail(id: string | undefined): DetailState {
  const [result, setResult] = useState<{ id: string; state: DetailState } | null>(null)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    fetchMovieDetail(id).then(
      (detail) => {
        if (!cancelled) setResult({ id, state: { status: 'ready', detail } })
      },
      () => {
        if (!cancelled) setResult({ id, state: { status: 'error' } })
      },
    )
    return () => {
      cancelled = true
    }
  }, [id])

  // Results for a previous id are stale; report loading until the new one arrives.
  return id && result?.id === id ? result.state : LOADING
}
