import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router'
import { parseBrowseParams, toBrowseParams, type BrowseState } from '../domain/url-filters'

export type SetBrowseState = (next: BrowseState, options?: { replace?: boolean }) => void

/** Browse filters live in the URL so results can be shared, bookmarked and navigated back. */
export function useBrowseState(): [BrowseState, SetBrowseState] {
  const [params, setParams] = useSearchParams()
  const state = useMemo(() => parseBrowseParams(params), [params])
  const update = useCallback<SetBrowseState>(
    (next, options) => setParams(toBrowseParams(next), { replace: options?.replace ?? false }),
    [setParams],
  )
  return [state, update]
}
