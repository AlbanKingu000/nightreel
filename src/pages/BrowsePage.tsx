import { useMemo, useState } from 'react'
import { useCatalog } from '../app/catalog-context'
import { cx } from '../components/cx'
import { EmptyState } from '../components/EmptyState'
import { FilterPanel } from '../components/FilterPanel'
import { CloseIcon, FilterIcon } from '../components/Icons'
import { MovieGrid } from '../components/MovieGrid'
import { PageHeader } from '../components/PageHeader'
import { activeFilterCount, applyFilters, EMPTY_FILTERS, type Filters } from '../domain/filters'
import { SORT_KEYS, SORT_LABELS, sortMovies } from '../domain/sort'
import { toBrowseParams, type BrowseState } from '../domain/url-filters'
import { useBrowseState, type SetBrowseState } from '../hooks/useBrowseState'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import styles from './BrowsePage.module.css'

interface ChipSpec {
  key: string
  label: string
  clear: Partial<Filters>
}

function activeChips(filters: Filters): ChipSpec[] {
  const range = (min: number | null, max: number | null, unit = '') =>
    min !== null && max !== null ? `${min}–${max}${unit}` : min !== null ? `${min}${unit}+` : `up to ${max}${unit}`
  return [
    ...filters.genres.map((genre) => ({
      key: `g-${genre}`,
      label: genre,
      clear: { genres: filters.genres.filter((g) => g !== genre) },
    })),
    ...(filters.yearMin !== null || filters.yearMax !== null
      ? [{ key: 'y', label: range(filters.yearMin, filters.yearMax), clear: { yearMin: null, yearMax: null } }]
      : []),
    ...(filters.runtimeMin !== null || filters.runtimeMax !== null
      ? [{ key: 'rt', label: range(filters.runtimeMin, filters.runtimeMax, ' min'), clear: { runtimeMin: null, runtimeMax: null } }]
      : []),
    ...(filters.query.trim() ? [{ key: 'q', label: `“${filters.query.trim()}”`, clear: { query: '' } }] : []),
  ]
}

function ActiveFilters({ state, onChange }: { state: BrowseState; onChange: SetBrowseState }) {
  const chips = activeChips(state.filters)
  if (chips.length === 0) return null
  return (
    <ul className={styles.active} aria-label="Active filters">
      {chips.map((chip) => (
        <li key={chip.key}>
          <button
            type="button"
            className="chip"
            onClick={() => onChange({ ...state, filters: { ...state.filters, ...chip.clear } })}
            aria-label={`Remove filter ${chip.label}`}
          >
            {chip.label} <CloseIcon width={14} height={14} />
          </button>
        </li>
      ))}
    </ul>
  )
}

export default function BrowsePage() {
  const { index } = useCatalog()
  const [state, setState] = useBrowseState()
  const [filtersOpen, setFiltersOpen] = useState(false)
  useDocumentTitle('Browse')

  const results = useMemo(
    () => sortMovies(applyFilters(index.movies, state.filters), state.sort),
    [index, state],
  )
  const activeCount = activeFilterCount(state.filters)
  const clearFilters = () => setState({ ...state, filters: EMPTY_FILTERS })

  return (
    <div className="page">
      <PageHeader kicker="The whole reel" title="Browse" subtitle={`${results.length} of ${index.movies.length} films`}>
        <button
          type="button"
          className={cx('btn', styles.filterToggle)}
          aria-expanded={filtersOpen}
          aria-controls="browse-filters"
          onClick={() => setFiltersOpen((open) => !open)}
        >
          <FilterIcon /> Filters{activeCount > 0 && ` (${activeCount})`}
        </button>
        <label className={styles.sort}>
          <span>Sort by</span>
          <select
            value={state.sort}
            onChange={(event) => setState({ ...state, sort: SORT_KEYS.find((key) => key === event.target.value) ?? 'popular' })}
          >
            {SORT_KEYS.map((key) => (
              <option key={key} value={key}>
                {SORT_LABELS[key]}
              </option>
            ))}
          </select>
        </label>
      </PageHeader>

      <div className={styles.layout}>
        <aside id="browse-filters" className={cx(styles.sidebar, filtersOpen && styles.open)} aria-label="Filters">
          <FilterPanel state={state} onChange={setState} />
        </aside>
        <section className={styles.results} aria-label="Results">
          <ActiveFilters state={state} onChange={setState} />
          <MovieGrid
            key={toBrowseParams(state).toString()}
            movies={results}
            empty={
              <EmptyState
                title="Nothing on this reel"
                body="No films match all of these filters. Try removing one."
                action={
                  <button type="button" className="btn btn-primary" onClick={clearFilters}>
                    Clear filters
                  </button>
                }
              />
            }
          />
        </section>
      </div>
    </div>
  )
}
