import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { useCatalog } from '../app/catalog-context'
import { MarqueeHero } from '../components/MarqueeHero'
import { Shelf } from '../components/Shelf'
import { GENRES } from '../data/schema'
import { COLLECTIONS } from '../domain/collections'
import { MOODS } from '../domain/mood'
import { collectionPath, genrePath } from '../domain/paths'
import { becauseYouSaved, forYou } from '../domain/recommend'
import { buildShelves, MIN_SHELF_SIZE, pickFeatured } from '../domain/shelves'
import { useAmbient } from '../hooks/useAmbient'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useUser } from '../store/userStore'
import styles from './HomePage.module.css'

const PERSONAL_LIMIT = 20
const LEADING_SHELVES = 2

function MoodBoard() {
  return (
    <section className={styles.moods} aria-labelledby="moods-title">
      <h2 id="moods-title" className="section-title">
        What are you in the mood for?
      </h2>
      <ul className={styles.moodGrid}>
        {MOODS.filter((mood) => mood.id !== 'any').map((mood) => (
          <li key={mood.id}>
            <Link to={`/spin?mood=${mood.id}`} className={styles.mood}>
              <span className={styles.moodLabel}>{mood.label}</span>
              <span className={styles.moodBlurb}>{mood.blurb}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

function Discover() {
  return (
    <section className={styles.discover} aria-labelledby="discover-title">
      <h2 id="discover-title" className="section-title">
        Collections and genres
      </h2>
      <ul className={styles.collections}>
        {COLLECTIONS.map((collection) => (
          <li key={collection.id}>
            <Link to={collectionPath(collection.id)} className={styles.collection}>
              <span className={styles.collectionTitle}>{collection.title}</span>
              <span className={styles.moodBlurb}>{collection.subtitle}</span>
            </Link>
          </li>
        ))}
      </ul>
      <ul className={styles.genres}>
        {GENRES.map((genre) => (
          <li key={genre}>
            <Link to={genrePath(genre)} className="chip">
              {genre}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default function HomePage() {
  const { index } = useCatalog()
  const entries = useUser((state) => state.entries)
  const [today] = useState(() => new Date())
  const featured = useMemo(() => pickFeatured(index.movies, today), [index, today])
  const shelves = useMemo(() => buildShelves(index), [index])
  const because = useMemo(() => becauseYouSaved(entries, index, PERSONAL_LIMIT), [entries, index])
  const picks = useMemo(() => forYou(entries, index, PERSONAL_LIMIT), [entries, index])

  useDocumentTitle(null)
  useAmbient(featured?.color)

  const renderShelf = (shelf: (typeof shelves)[number], priority = false) => (
    <Shelf key={shelf.id} id={shelf.id} title={shelf.title} subtitle={shelf.subtitle} link={shelf.link} movies={shelf.movies} priority={priority} />
  )

  return (
    <div className="page">
      {featured && <MarqueeHero movie={featured} />}
      {shelves.slice(0, LEADING_SHELVES).map((shelf, i) => renderShelf(shelf, i === 0))}
      {because && because.movies.length >= MIN_SHELF_SIZE && (
        <Shelf
          id="because"
          title={
            <>
              Because you saved <em className={styles.seed}>{because.seed.title}</em>
            </>
          }
          subtitle="Similar films waiting for a ticket"
          movies={because.movies}
        />
      )}
      {picks.length >= MIN_SHELF_SIZE && (
        <Shelf id="for-you" title="Picked for you" subtitle="Based on your tickets, favorites and ratings" movies={picks} />
      )}
      <MoodBoard />
      {shelves.slice(LEADING_SHELVES).map((shelf) => renderShelf(shelf))}
      <Discover />
    </div>
  )
}
