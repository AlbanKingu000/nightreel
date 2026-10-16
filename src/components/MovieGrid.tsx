import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { Movie } from '../data/schema'
import styles from './MovieGrid.module.css'
import { TicketCard } from './TicketCard'

export const PAGE_SIZE = 24

interface MovieGridProps {
  movies: readonly Movie[]
  empty?: ReactNode
}

/** Grid of tickets that loads more as you scroll (with a button fallback). Remount via `key` to reset. */
export function MovieGrid({ movies, empty = null }: MovieGridProps) {
  const [visible, setVisible] = useState(PAGE_SIZE)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const hasMore = visible < movies.length

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel || !hasMore) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) setVisible((n) => n + PAGE_SIZE)
      },
      { rootMargin: '600px 0px' },
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasMore])

  if (movies.length === 0) return <>{empty}</>

  return (
    <>
      <ul className={styles.grid}>
        {movies.slice(0, visible).map((movie) => (
          <li key={movie.id}>
            <TicketCard movie={movie} />
          </li>
        ))}
      </ul>
      {hasMore && (
        <div ref={sentinelRef} className={styles.more}>
          <button type="button" className="btn" onClick={() => setVisible((n) => n + PAGE_SIZE)}>
            Show more ({movies.length - visible} left)
          </button>
        </div>
      )}
    </>
  )
}
