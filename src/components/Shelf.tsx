import { useEffect, useRef, useState, type ReactNode, type RefObject } from 'react'
import { Link } from 'react-router'
import type { Movie } from '../data/schema'
import { ChevronLeftIcon, ChevronRightIcon } from './Icons'
import styles from './Shelf.module.css'
import { TicketCard } from './TicketCard'

interface ShelfProps {
  id: string
  title: ReactNode
  subtitle?: ReactNode
  link?: string
  movies: readonly Movie[]
  limit?: number
  priority?: boolean
}

const SCROLL_FRACTION = 0.85
const PLACEHOLDER_COUNT = 7

/** Renders the cards only once the shelf is near the viewport, so long pages stay fast. */
function useNearViewport(ref: RefObject<HTMLElement | null>, eager: boolean): boolean {
  const [near, setNear] = useState(eager)
  useEffect(() => {
    const element = ref.current
    if (near || !element) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) setNear(true)
      },
      { rootMargin: '800px 0px' },
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [near, ref])
  return near
}

/** A horizontal row ("shelf") of ticket cards with scroll buttons and a "See all" link. */
export function Shelf({ id, title, subtitle, link, movies, limit = 20, priority = false }: ShelfProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const trackRef = useRef<HTMLUListElement>(null)
  const near = useNearViewport(sectionRef, priority)
  const headingId = `shelf-${id}`

  const scroll = (direction: 1 | -1) => {
    const track = trackRef.current
    track?.scrollBy({ left: direction * track.clientWidth * SCROLL_FRACTION, behavior: 'smooth' })
  }

  return (
    <section ref={sectionRef} className={styles.shelf} aria-labelledby={headingId}>
      <header className={styles.header}>
        <div>
          <h2 id={headingId} className="section-title">
            {title}
          </h2>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>
        <div className={styles.controls}>
          {link && (
            <Link to={link} className={styles.seeAll}>
              See all <ChevronRightIcon />
              <span className="visually-hidden"> in {typeof title === 'string' ? title : 'this row'}</span>
            </Link>
          )}
          <button type="button" className="btn btn-icon btn-small" onClick={() => scroll(-1)} aria-label="Scroll left">
            <ChevronLeftIcon />
          </button>
          <button type="button" className="btn btn-icon btn-small" onClick={() => scroll(1)} aria-label="Scroll right">
            <ChevronRightIcon />
          </button>
        </div>
      </header>
      <ul ref={trackRef} className={styles.track}>
        {near
          ? movies.slice(0, limit).map((movie) => (
              <li key={movie.id} className={styles.item}>
                <TicketCard movie={movie} />
              </li>
            ))
          : Array.from({ length: Math.min(PLACEHOLDER_COUNT, movies.length) }, (_, i) => (
              <li key={i} className={styles.item} aria-hidden="true">
                <div className={styles.placeholder} />
              </li>
            ))}
      </ul>
    </section>
  )
}
