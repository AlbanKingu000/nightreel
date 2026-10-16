import { useCallback, useState } from 'react'
import type { Movie, Trailer } from '../data/schema'
import { youtubeEmbedUrl, youtubeSearchUrl, youtubeWatchUrl } from '../domain/links'
import { CloseIcon, ExternalIcon, PlayIcon } from './Icons'
import { Modal } from './Modal'
import styles from './TrailerModal.module.css'

interface TrailerModalProps {
  open: boolean
  onClose: () => void
  movie: Movie
  trailer: Trailer
}

/** The YouTube player is only created when the dialog opens (no third-party load before a click). */
export function TrailerModal({ open, onClose, movie, trailer }: TrailerModalProps) {
  const label = `${movie.title} ${trailer.kind === 'trailer' ? 'trailer' : 'video'}`
  return (
    <Modal open={open} onClose={onClose} label={label} className={styles.panel}>
      <div className={styles.head}>
        <h2 className={styles.title}>
          {movie.title} <span>({movie.year})</span>
        </h2>
        <button type="button" className="btn btn-icon btn-small" onClick={onClose} aria-label="Close trailer">
          <CloseIcon />
        </button>
      </div>
      <div className={styles.frame}>
        <iframe
          src={youtubeEmbedUrl(trailer.youtubeId)}
          title={label}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
      <a className={styles.external} href={youtubeWatchUrl(trailer.youtubeId)} target="_blank" rel="noreferrer noopener">
        Open on YouTube <ExternalIcon />
      </a>
    </Modal>
  )
}

/** Opens the trailer dialog, or falls back to a YouTube search when no trailer is known. */
export function TrailerButton({ movie, trailer }: { movie: Movie; trailer: Trailer | null }) {
  const [open, setOpen] = useState(false)
  const close = useCallback(() => setOpen(false), [])

  if (!trailer) {
    return (
      <a className="btn" href={youtubeSearchUrl(movie.title, movie.year)} target="_blank" rel="noreferrer noopener">
        <PlayIcon /> Find the trailer
        <span className="visually-hidden"> (opens YouTube in a new tab)</span>
      </a>
    )
  }

  return (
    <>
      <button type="button" className="btn" onClick={() => setOpen(true)}>
        <PlayIcon /> {trailer.kind === 'trailer' ? 'Watch trailer' : 'Watch clip'}
      </button>
      <TrailerModal open={open} onClose={close} movie={movie} trailer={trailer} />
    </>
  )
}
