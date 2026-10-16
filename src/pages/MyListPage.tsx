import { useMemo, type KeyboardEvent } from 'react'
import { Link, useSearchParams } from 'react-router'
import { useCatalog } from '../app/catalog-context'
import { BackupControls } from '../components/BackupControls'
import { cx } from '../components/cx'
import { EmptyState } from '../components/EmptyState'
import { StarIcon } from '../components/Icons'
import { MovieGrid } from '../components/MovieGrid'
import { PageHeader } from '../components/PageHeader'
import { Poster } from '../components/Poster'
import { StatsPanel } from '../components/StatsPanel'
import type { Movie } from '../data/schema'
import { moviePath } from '../domain/paths'
import { userStats } from '../domain/stats'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import type { FlagKey, UserEntry } from '../store/userSchema'
import { useUser } from '../store/userStore'
import styles from './MyListPage.module.css'

type TabId = 'tickets' | 'watched' | 'favorites' | 'rated'

const TABS: ReadonlyArray<{ id: TabId; label: string; flag?: FlagKey; empty: string }> = [
  { id: 'tickets', label: 'Tickets', flag: 'watchlistAt', empty: 'Tap + on any poster to save a ticket for later.' },
  { id: 'watched', label: 'Watched', flag: 'watchedAt', empty: 'Mark films as watched from their page to punch your tickets.' },
  { id: 'favorites', label: 'Favorites', flag: 'favoriteAt', empty: 'Heart the films you love and they will live here.' },
  { id: 'rated', label: 'Rated and reviewed', empty: 'Rate or review a film and it will show up here.' },
]

interface Row {
  movie: Movie
  entry: UserEntry
}

const touchedAt = (entry: UserEntry) => Math.max(entry.ratedAt ?? 0, entry.review?.updatedAt ?? 0)

function RatedList({ rows }: { rows: Row[] }) {
  return (
    <ul className={styles.rated}>
      {rows.map(({ movie, entry }) => (
        <li key={movie.id} className={styles.ratedRow}>
          <Link to={moviePath(movie)} className={styles.ratedPoster} tabIndex={-1} aria-hidden="true">
            <Poster movie={movie} decorative />
          </Link>
          <div className={styles.ratedText}>
            <Link to={moviePath(movie)} className={styles.ratedTitle}>
              {movie.title} <span className="muted">({movie.year})</span>
            </Link>
            {entry.rating !== undefined && (
              <p className={styles.stars}>
                <StarIcon /> {entry.rating} / 5
              </p>
            )}
            {entry.review && <blockquote className={styles.review}>{entry.review.text}</blockquote>}
          </div>
        </li>
      ))}
    </ul>
  )
}

export default function MyListPage() {
  const { index } = useCatalog()
  const entries = useUser((state) => state.entries)
  const [params, setParams] = useSearchParams()
  const tab = TABS.find((t) => t.id === params.get('tab')) ?? TABS[0]!
  const stats = useMemo(() => userStats(entries, index.byId), [entries, index])
  useDocumentTitle('My tickets')

  const rows = useMemo<Row[]>(
    () =>
      Object.entries(entries).flatMap(([id, entry]) => {
        const movie = index.byId.get(id)
        return movie ? [{ movie, entry }] : []
      }),
    [entries, index],
  )
  const listFor = (flag: FlagKey) =>
    rows
      .filter(({ entry }) => entry[flag] !== undefined)
      .sort((a, b) => (b.entry[flag] ?? 0) - (a.entry[flag] ?? 0))
  const rated = rows
    .filter(({ entry }) => entry.rating !== undefined || entry.review !== undefined)
    .sort((a, b) => touchedAt(b.entry) - touchedAt(a.entry))
  const countFor = (t: (typeof TABS)[number]) => (t.flag ? listFor(t.flag).length : rated.length)

  const select = (id: TabId) => setParams({ tab: id }, { replace: true })
  const onTabKey = (event: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0
    if (step === 0) return
    event.preventDefault()
    const next = TABS[(i + step + TABS.length) % TABS.length]
    if (next) {
      select(next.id)
      document.getElementById(`tab-${next.id}`)?.focus()
    }
  }

  const empty = (
    <EmptyState
      title="Nothing here yet"
      body={tab.empty}
      action={
        <Link to="/browse" className="btn btn-primary">
          Find something to watch
        </Link>
      }
    />
  )

  return (
    <div className="page">
      <PageHeader kicker="Your stub collection" title="My tickets" subtitle="Saved in this browser only. Export a backup to keep it safe or move it.">
        <BackupControls />
      </PageHeader>
      <StatsPanel stats={stats} />
      <div role="tablist" aria-label="Your lists" className={styles.tabs}>
        {TABS.map((t, i) => (
          <button
            key={t.id}
            id={`tab-${t.id}`}
            type="button"
            role="tab"
            aria-selected={t.id === tab.id}
            aria-controls={`panel-${t.id}`}
            tabIndex={t.id === tab.id ? 0 : -1}
            className={cx(styles.tab, t.id === tab.id && styles.current)}
            onClick={() => select(t.id)}
            onKeyDown={(event) => onTabKey(event, i)}
          >
            {t.label} <span className={styles.count}>{countFor(t)}</span>
          </button>
        ))}
      </div>
      <div role="tabpanel" id={`panel-${tab.id}`} aria-labelledby={`tab-${tab.id}`} className={styles.panel}>
        {tab.flag ? (
          <MovieGrid key={tab.id} movies={listFor(tab.flag).map(({ movie }) => movie)} empty={empty} />
        ) : rated.length > 0 ? (
          <RatedList rows={rated} />
        ) : (
          empty
        )}
      </div>
    </div>
  )
}
