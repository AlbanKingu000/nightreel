import { useState, type CSSProperties } from 'react'
import { Link } from 'react-router'
import { useCatalog } from '../app/catalog-context'
import type { Movie } from '../data/schema'
import { personName } from '../domain/catalog-index'
import { formatRuntime } from '../domain/format'
import { moviePath } from '../domain/paths'
import { useUi } from '../store/uiStore'
import { useUser } from '../store/userStore'
import { cx } from './cx'
import { CheckIcon, PlusIcon } from './Icons'
import { Poster } from './Poster'
import styles from './TicketCard.module.css'

interface TicketCardProps {
  movie: Movie
}

/** A movie as a cinema ticket: poster up top, tear-off stub below, "+" to save it. */
export function TicketCard({ movie }: TicketCardProps) {
  const { index } = useCatalog()
  const saved = useUser((state) => state.entries[movie.id]?.watchlistAt !== undefined)
  const watched = useUser((state) => state.entries[movie.id]?.watchedAt !== undefined)
  const toggleWatchlist = useUser((state) => state.toggleWatchlist)
  const toast = useUi((state) => state.toast)
  const [punched, setPunched] = useState(false)

  const directorId = movie.directors[0]
  const director = directorId ? personName(index, directorId) : null
  const style = { '--tint': movie.color } as CSSProperties

  const onTicket = () => {
    toggleWatchlist(movie.id)
    setPunched(!saved)
    toast(
      saved ? `Removed ${movie.title} from your tickets` : `Added ${movie.title} to your tickets`,
      saved ? 'info' : 'success',
    )
  }

  return (
    <article className={cx(styles.ticket, saved && styles.saved, punched && styles.punched)} style={style}>
      <Link to={moviePath(movie)} className={styles.face}>
        <div className={styles.posterWrap}>
          <Poster movie={movie} decorative />
          {watched && <span className={styles.seen}>Seen</span>}
          <div className={styles.peek} aria-hidden="true">
            <span>{movie.genres.slice(0, 3).join(' · ')}</span>
            {director && <span>Dir. {director}</span>}
          </div>
        </div>
        <div className={styles.stub}>
          <h3 className={styles.title}>{movie.title}</h3>
          <p className={styles.meta}>
            {movie.year} · {formatRuntime(movie.runtime)}
          </p>
          <span className={styles.stamp} aria-hidden="true">
            Admit one
          </span>
        </div>
      </Link>
      <button
        type="button"
        className={styles.punch}
        aria-pressed={saved}
        aria-label={`Ticket for ${movie.title}`}
        title={saved ? 'Remove from your tickets' : 'Add to your tickets'}
        onClick={onTicket}
      >
        {saved ? <CheckIcon /> : <PlusIcon />}
      </button>
    </article>
  )
}
