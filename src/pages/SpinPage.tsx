import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { Link, useSearchParams } from 'react-router'
import { useCatalog } from '../app/catalog-context'
import { cx } from '../components/cx'
import { ReelIcon } from '../components/Icons'
import { WatchlistButton } from '../components/ListToggles'
import { PageHeader } from '../components/PageHeader'
import { Poster } from '../components/Poster'
import type { Movie } from '../data/schema'
import { formatRuntime } from '../domain/format'
import { findMood, MOODS } from '../domain/mood'
import { moviePath } from '../domain/paths'
import { candidatesFor, pickMovie, type PickOptions } from '../domain/picker'
import { useAmbient } from '../hooks/useAmbient'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useMovieDetail } from '../hooks/useMovieDetail'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'
import { useUser } from '../store/userStore'
import styles from './SpinPage.module.css'

export const SPIN_MS = 1800
const STRIP_LENGTH = 16

const RUNTIME_CHOICES = [
  { label: 'Any length', value: null },
  { label: 'Under 1h 40m', value: 100 },
  { label: 'Under 2 hours', value: 120 },
  { label: 'Under 2½ hours', value: 150 },
] as const

interface SpinState {
  key: number
  strip: Movie[]
  result: Movie
  phase: 'spinning' | 'done'
}

function sample<T>(items: readonly T[], count: number): T[] {
  const pool = [...items]
  const picked: T[] = []
  while (pool.length > 0 && picked.length < count) {
    const [item] = pool.splice(Math.floor(Math.random() * pool.length), 1)
    if (item !== undefined) picked.push(item)
  }
  return picked
}

function SpinResult({ movie }: { movie: Movie }) {
  const detail = useMovieDetail(movie.id)
  return (
    <div className={styles.result}>
      <p className="kicker">Tonight you&apos;re watching</p>
      <h2 className={styles.resultTitle}>{movie.title}</h2>
      <p className={styles.resultMeta}>
        {movie.year} · {formatRuntime(movie.runtime)} · {movie.genres.slice(0, 3).join(', ')}
      </p>
      {detail.status === 'ready' && <p className={styles.resultOverview}>{detail.detail.overview}</p>}
      <div className={styles.resultActions}>
        <WatchlistButton movie={movie} />
        <Link to={moviePath(movie)} className="btn">
          See details
        </Link>
      </div>
    </div>
  )
}

export default function SpinPage() {
  const { index } = useCatalog()
  const [params] = useSearchParams()
  const [moodId, setMoodId] = useState(() => findMood(params.get('mood') ?? 'any').id)
  const [maxRuntime, setMaxRuntime] = useState<number | null>(null)
  const [spin, setSpin] = useState<SpinState | null>(null)
  const spinHistory = useUser((state) => state.spinHistory)
  const recordSpin = useUser((state) => state.recordSpin)
  const reduceMotion = usePrefersReducedMotion()

  const options: PickOptions = useMemo(
    () => ({ moodId, maxRuntime, exclude: spinHistory }),
    [moodId, maxRuntime, spinHistory],
  )
  const candidates = useMemo(() => candidatesFor(index.movies, options), [index, options])
  const done = spin?.phase === 'done' ? spin.result : null

  useDocumentTitle('Spin the reel')
  useAmbient(done?.color)

  useEffect(() => {
    if (spin?.phase !== 'spinning') return
    const timer = setTimeout(() => setSpin((current) => current && { ...current, phase: 'done' }), SPIN_MS)
    return () => clearTimeout(timer)
  }, [spin?.phase, spin?.key])

  const onSpin = () => {
    const result = pickMovie(index.movies, options)
    if (!result) return
    recordSpin(result.id)
    const strip = [...sample(candidates.filter((m) => m.id !== result.id), STRIP_LENGTH - 1), result]
    setSpin({ key: Date.now(), strip, result, phase: reduceMotion ? 'done' : 'spinning' })
  }

  const stripStyle = { '--steps': (spin?.strip.length ?? 1) - 1 } as CSSProperties

  return (
    <div className="page">
      <PageHeader kicker="Can't decide?" title="Spin the reel" subtitle="Set the mood, pull the lever, and let the projector choose." />
      <div className={styles.layout}>
        <div className={styles.controls}>
          <fieldset className={styles.group}>
            <legend className={styles.legend}>Mood</legend>
            <div role="radiogroup" aria-label="Mood" className={styles.moods}>
              {MOODS.map((mood) => (
                <button key={mood.id} type="button" role="radio" aria-checked={mood.id === moodId} className="chip" onClick={() => setMoodId(mood.id)} title={mood.blurb}>
                  {mood.label}
                </button>
              ))}
            </div>
          </fieldset>
          <div className={styles.selects}>
            <label className={styles.field}>
              <span>Length</span>
              <select value={maxRuntime ?? ''} onChange={(event) => setMaxRuntime(event.target.value ? Number(event.target.value) : null)}>
                {RUNTIME_CHOICES.map((choice) => (
                  <option key={choice.label} value={choice.value ?? ''}>
                    {choice.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <p className={styles.count} aria-live="polite">
            {candidates.length === 0
              ? 'No films match. Loosen a filter.'
              : `${candidates.length} ${candidates.length === 1 ? 'film' : 'films'} on this reel`}
          </p>
          <button type="button" className={cx('btn btn-primary', styles.lever)} onClick={onSpin} disabled={candidates.length === 0 || spin?.phase === 'spinning'}>
            <ReelIcon /> {spin ? 'Spin again' : 'Spin the reel'}
          </button>
        </div>

        <div className={styles.stage}>
          <div className={styles.window} aria-hidden="true">
            {spin ? (
              <ul key={spin.key} className={cx(styles.strip, spin.phase === 'spinning' && styles.rolling)} style={stripStyle}>
                {spin.strip.map((movie, i) => (
                  <li key={`${movie.id}-${i}`} className={styles.frame}>
                    <Poster movie={movie} decorative />
                  </li>
                ))}
              </ul>
            ) : (
              <div className={styles.idle}>
                <ReelIcon />
              </div>
            )}
          </div>
          <div aria-live="polite">{done && <SpinResult key={done.id} movie={done} />}</div>
        </div>
      </div>
    </div>
  )
}
