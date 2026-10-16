import { useCallback } from 'react'
import { GENRES, type Genre } from '../data/schema'
import { EMPTY_FILTERS, type Filters } from '../domain/filters'
import type { BrowseState } from '../domain/url-filters'
import type { SetBrowseState } from '../hooks/useBrowseState'
import { DraftInput } from './DraftInput'
import styles from './FilterPanel.module.css'

const DECADES = [1920, 1930, 1940, 1950, 1960, 1970, 1980, 1990, 2000, 2010, 2020] as const
const RUNTIMES = [
  { label: 'Any length', min: null, max: null },
  { label: 'Under 90 min', min: null, max: 89 },
  { label: '90–120 min', min: 90, max: 120 },
  { label: '2–2½ hours', min: 121, max: 150 },
  { label: 'Over 2½ hours', min: 151, max: null },
] as const

const toYear = (text: string): number | null => {
  const year = Number(text)
  return text !== '' && Number.isInteger(year) && year >= 1880 && year <= 2100 ? year : null
}

interface FilterPanelProps {
  state: BrowseState
  onChange: SetBrowseState
}

export function FilterPanel({ state, onChange }: FilterPanelProps) {
  const { filters } = state
  const set = useCallback(
    (patch: Partial<Filters>, replace = false) =>
      onChange({ ...state, filters: { ...state.filters, ...patch } }, { replace }),
    [onChange, state],
  )
  const commitQuery = useCallback((query: string) => set({ query }, true), [set])

  const toggleGenre = (genre: Genre) =>
    set({
      genres: filters.genres.includes(genre)
        ? filters.genres.filter((g) => g !== genre)
        : [...filters.genres, genre],
    })
  const isDecade = (start: number) => filters.yearMin === start && filters.yearMax === start + 9
  const runtimeIndex = Math.max(
    0,
    RUNTIMES.findIndex((r) => r.min === filters.runtimeMin && r.max === filters.runtimeMax),
  )

  return (
    <div className={styles.panel}>
      <fieldset className={styles.group}>
        <legend className={styles.legend}>Genres</legend>
        <div className={styles.chips}>
          {GENRES.map((genre) => (
            <button key={genre} type="button" className="chip" aria-pressed={filters.genres.includes(genre)} onClick={() => toggleGenre(genre)}>
              {genre}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className={styles.group}>
        <legend className={styles.legend}>Decade</legend>
        <div className={styles.chips}>
          {DECADES.map((start) => (
            <button
              key={start}
              type="button"
              className="chip"
              aria-pressed={isDecade(start)}
              onClick={() => set(isDecade(start) ? { yearMin: null, yearMax: null } : { yearMin: start, yearMax: start + 9 })}
            >
              {start}s
            </button>
          ))}
        </div>
        <div className={styles.range}>
          <label className={styles.field}>
            <span>From year</span>
            <DraftInput type="text" inputMode="numeric" placeholder="1900" value={filters.yearMin?.toString() ?? ''} onCommit={(text) => set({ yearMin: toYear(text) })} />
          </label>
          <label className={styles.field}>
            <span>To year</span>
            <DraftInput type="text" inputMode="numeric" placeholder="2025" value={filters.yearMax?.toString() ?? ''} onCommit={(text) => set({ yearMax: toYear(text) })} />
          </label>
        </div>
      </fieldset>

      <div className={styles.selects}>
        <label className={styles.field}>
          <span>Length</span>
          <select
            value={runtimeIndex}
            onChange={(event) => {
              const option = RUNTIMES[Number(event.target.value)]
              if (option) set({ runtimeMin: option.min, runtimeMax: option.max })
            }}
          >
            {RUNTIMES.map((option, i) => (
              <option key={option.label} value={i}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.field}>
          <span>Title contains</span>
          <DraftInput type="search" placeholder="night" value={filters.query} debounceMs={300} onCommit={commitQuery} />
        </label>
      </div>

      <button type="button" className="btn btn-small" onClick={() => onChange({ ...state, filters: EMPTY_FILTERS })}>
        Clear all filters
      </button>
    </div>
  )
}
