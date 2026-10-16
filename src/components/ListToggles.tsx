import type { Movie } from '../data/schema'
import { useUi } from '../store/uiStore'
import { useUser } from '../store/userStore'
import { cx } from './cx'
import { CheckIcon, EyeIcon, HeartIcon, TicketIcon } from './Icons'
import styles from './ListToggles.module.css'

export function WatchlistButton({ movie, small = false }: { movie: Movie; small?: boolean }) {
  const saved = useUser((state) => state.entries[movie.id]?.watchlistAt !== undefined)
  const toggle = useUser((state) => state.toggleWatchlist)
  const toast = useUi((state) => state.toast)

  const onClick = () => {
    toggle(movie.id)
    toast(
      saved ? `Removed ${movie.title} from your tickets` : `Added ${movie.title} to your tickets`,
      saved ? 'info' : 'success',
    )
  }

  return (
    <button type="button" className={cx('btn', small && 'btn-small')} aria-pressed={saved} onClick={onClick}>
      {saved ? <CheckIcon /> : <TicketIcon />}
      {saved ? 'In your tickets' : 'Get a ticket'}
    </button>
  )
}

/** Watchlist, watched and favorite toggles for one movie. */
export function ListToggles({ movie }: { movie: Movie }) {
  const entry = useUser((state) => state.entries[movie.id])
  const toggleWatched = useUser((state) => state.toggleWatched)
  const toggleFavorite = useUser((state) => state.toggleFavorite)
  const toast = useUi((state) => state.toast)
  const watched = entry?.watchedAt !== undefined
  const favorite = entry?.favoriteAt !== undefined

  const onWatched = () => {
    const hadTicket = entry?.watchlistAt !== undefined
    toggleWatched(movie.id)
    if (watched) toast(`${movie.title} is no longer marked as watched`)
    else toast(hadTicket ? `Ticket punched for ${movie.title}. Enjoyed it?` : `Marked ${movie.title} as watched`, 'success')
  }

  const onFavorite = () => {
    toggleFavorite(movie.id)
    toast(favorite ? `Removed ${movie.title} from favorites` : `${movie.title} is a favorite`, favorite ? 'info' : 'success')
  }

  return (
    <div className={styles.toggles} role="group" aria-label="Your lists">
      <WatchlistButton movie={movie} />
      <button type="button" className="btn" aria-pressed={watched} onClick={onWatched}>
        <EyeIcon />
        {watched ? 'Watched' : 'Mark watched'}
      </button>
      <button type="button" className="btn" aria-pressed={favorite} onClick={onFavorite}>
        <HeartIcon />
        {favorite ? 'Favorite' : 'Add to favorites'}
      </button>
    </div>
  )
}
