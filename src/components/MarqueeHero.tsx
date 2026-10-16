import type { CSSProperties } from 'react'
import { Link } from 'react-router'
import { useCatalog } from '../app/catalog-context'
import type { Movie } from '../data/schema'
import { personName } from '../domain/catalog-index'
import { formatRuntime } from '../domain/format'
import { moviePath, personPath } from '../domain/paths'
import { useMovieDetail } from '../hooks/useMovieDetail'
import { ReelIcon } from './Icons'
import { WatchlistButton } from './ListToggles'
import styles from './MarqueeHero.module.css'
import { Poster } from './Poster'
import { TrailerButton } from './TrailerModal'

/** "Tonight's feature": a lit marquee with the day's pick, its poster and quick actions. */
export function MarqueeHero({ movie }: { movie: Movie }) {
  const { index } = useCatalog()
  const detail = useMovieDetail(movie.id)
  const ready = detail.status === 'ready' ? detail.detail : null
  const directorId = movie.directors[0]
  const style = { '--tint': movie.color } as CSSProperties

  return (
    <section className={styles.hero} style={style} aria-labelledby="hero-title">
      <div className={styles.backdrop} aria-hidden="true" />
      <div className={styles.beam} aria-hidden="true" />
      <div className={styles.content}>
        <div className={styles.marquee}>
          <span className={styles.bulbs} aria-hidden="true" />
          <p className="kicker">Tonight&apos;s feature</p>
          <h1 id="hero-title" className={styles.title}>
            {movie.title}
          </h1>
        </div>
        <p className={styles.meta}>
          <span>{movie.year}</span>
          <span>{formatRuntime(movie.runtime)}</span>
          {movie.oscars > 0 && (
            <span className={styles.score}>
              {movie.oscars} Oscar{movie.oscars === 1 ? '' : 's'}
            </span>
          )}
          {movie.genres.slice(0, 3).map((genre) => (
            <span key={genre}>{genre}</span>
          ))}
        </p>
        {directorId && (
          <p className={styles.director}>
            Directed by{' '}
            <Link to={personPath(directorId, personName(index, directorId))}>
              {personName(index, directorId)}
            </Link>
          </p>
        )}
        <p className={styles.overview}>{ready?.overview ?? ' '}</p>
        <div className={styles.actions}>
          <Link to={moviePath(movie)} className="btn btn-primary">
            See details
          </Link>
          <TrailerButton movie={movie} trailer={ready?.trailer ?? null} />
          <WatchlistButton movie={movie} />
          <Link to="/spin" className="btn">
            <ReelIcon /> Spin the reel
          </Link>
        </div>
      </div>
      <Link to={moviePath(movie)} className={styles.posterLink} tabIndex={-1} aria-hidden="true">
        <Poster movie={movie} size="large" decorative />
      </Link>
    </section>
  )
}
