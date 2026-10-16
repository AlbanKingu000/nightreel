import type { CSSProperties } from 'react'
import type { Movie } from '../data/schema'
import { posterArt } from '../domain/poster-art'
import { cx } from './cx'
import styles from './Poster.module.css'

interface PosterProps {
  movie: Pick<Movie, 'title' | 'year' | 'color'>
  size?: 'card' | 'large' | 'thumb'
  /** Set when a nearby element already names the movie, so screen readers don't hear it twice. */
  decorative?: boolean
  className?: string
}

const LONG_TITLE = 22

/** An original, generated poster card: title, year and a pattern derived from the title. */
export function Poster({ movie, size = 'card', decorative = false, className }: PosterProps) {
  const { variant, angle } = posterArt(movie.title)
  const style = { '--tint': movie.color, '--angle': `${angle}deg` } as CSSProperties

  return (
    <div
      className={cx(styles.frame, styles[size], styles[`v${variant}`], className)}
      style={style}
      role={decorative ? undefined : 'img'}
      aria-label={decorative ? undefined : `${movie.title} (${movie.year})`}
      aria-hidden={decorative || undefined}
      data-testid="poster"
    >
      <span className={styles.pattern} />
      {size !== 'thumb' && (
        <>
          <span className={styles.year}>{movie.year}</span>
          <span className={cx(styles.title, movie.title.length > LONG_TITLE && styles.long)}>{movie.title}</span>
          <span className={styles.mark}>Nightreel</span>
        </>
      )}
    </div>
  )
}
