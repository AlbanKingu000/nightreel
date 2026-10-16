import { Fragment, useMemo, type CSSProperties } from 'react'
import { Link, useParams } from 'react-router'
import { useCatalog } from '../app/catalog-context'
import { TvIcon } from '../components/Icons'
import { ListToggles } from '../components/ListToggles'
import { PersonAvatar } from '../components/PersonAvatar'
import { Poster } from '../components/Poster'
import { ReviewForm } from '../components/ReviewForm'
import { ShareButton } from '../components/ShareButton'
import { Shelf } from '../components/Shelf'
import { StarRating } from '../components/StarRating'
import { TrailerButton } from '../components/TrailerModal'
import type { Movie } from '../data/schema'
import { moviesByIds, personName } from '../domain/catalog-index'
import { formatRuntime } from '../domain/format'
import { justWatchUrl, wikidataUrl } from '../domain/links'
import { genrePath, personPath } from '../domain/paths'
import { topSimilar } from '../domain/similarity'
import { useAmbient } from '../hooks/useAmbient'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useMovieDetail } from '../hooks/useMovieDetail'
import { useUi } from '../store/uiStore'
import { useUser } from '../store/userStore'
import styles from './MoviePage.module.css'
import NotFoundPage from './NotFoundPage'

const SIMILAR_LIMIT = 16

function YourTake({ movie }: { movie: Movie }) {
  const entry = useUser((state) => state.entries[movie.id])
  const setRating = useUser((state) => state.setRating)
  const toast = useUi((state) => state.toast)
  return (
    <section className={styles.section} aria-labelledby="your-take">
      <h2 id="your-take" className="section-title">
        Your take
      </h2>
      <div className={styles.take}>
        <StarRating
          label={`Your rating for ${movie.title}`}
          value={entry?.rating ?? null}
          onChange={(value) => {
            setRating(movie.id, value)
            if (value !== null) toast(`Rated ${movie.title} ${value} / 5`, 'success')
          }}
        />
        <ReviewForm key={entry?.review?.text ?? ''} movie={movie} />
      </div>
    </section>
  )
}

function MovieView({ movie }: { movie: Movie }) {
  const { index } = useCatalog()
  const detail = useMovieDetail(movie.id)
  const ready = detail.status === 'ready' ? detail.detail : null
  const similar = useMemo(() => moviesByIds(index, topSimilar(movie, index.movies, SIMILAR_LIMIT)), [index, movie])
  const firstGenre = movie.genres[0]
  const style = { '--tint': movie.color } as CSSProperties

  useAmbient(movie.color)
  useDocumentTitle(`${movie.title} (${movie.year})`)

  return (
    <article className={styles.movie} style={style}>
      <div className={styles.backdrop} aria-hidden="true" />
      <div className="page">
        <nav className={styles.crumbs} aria-label="Breadcrumb">
          <Link to="/browse">Browse</Link>
          {firstGenre && (
            <>
              <span aria-hidden="true">/</span>
              <Link to={genrePath(firstGenre)}>{firstGenre}</Link>
            </>
          )}
          <span aria-hidden="true">/</span>
          <span aria-current="page">{movie.title}</span>
        </nav>

        <div className={styles.top}>
          <div className={styles.posterCol}>
            <Poster movie={movie} size="large" />
          </div>
          <div className={styles.info}>
            <p className="kicker">
              {movie.year} · {formatRuntime(movie.runtime)}
              {ready && ready.countries.length > 0 && ` · ${ready.countries.slice(0, 2).join(', ')}`}
            </p>
            <h1 className={styles.title}>{movie.title}</h1>
            {movie.oscars > 0 && (
              <div className={styles.badges}>
                {movie.bestPicture && <span className={styles.award}>Best Picture winner</span>}
                <span className={styles.award}>
                  {movie.oscars} Academy Award{movie.oscars === 1 ? '' : 's'}
                </span>
              </div>
            )}
            <ul className={styles.genres} aria-label="Genres">
              {movie.genres.map((genre) => (
                <li key={genre}>
                  <Link className="chip" to={genrePath(genre)}>
                    {genre}
                  </Link>
                </li>
              ))}
            </ul>
            <p className={styles.overview}>
              {ready?.overview ?? (detail.status === 'error' ? 'The synopsis is unavailable right now.' : 'Loading the synopsis…')}
            </p>
            {movie.directors.length > 0 && (
              <p className={styles.directors}>
                Directed by{' '}
                {movie.directors.map((id, i) => (
                  <Fragment key={id}>
                    {i > 0 && ', '}
                    <Link to={personPath(id, personName(index, id))}>{personName(index, id)}</Link>
                  </Fragment>
                ))}
              </p>
            )}
            <div className={styles.actions}>
              <TrailerButton movie={movie} trailer={ready?.trailer ?? null} />
              <a className="btn" href={justWatchUrl(movie.title)} target="_blank" rel="noreferrer noopener">
                <TvIcon /> Where to watch
                <span className="visually-hidden"> (opens JustWatch in a new tab)</span>
              </a>
              <ShareButton movie={movie} />
            </div>
            <ListToggles movie={movie} />
          </div>
        </div>

        <YourTake movie={movie} />

        {movie.cast.length > 0 && (
          <section className={styles.section} aria-labelledby="cast-title">
            <h2 id="cast-title" className="section-title">
              Top billed
            </h2>
            <ul className={styles.cast}>
              {movie.cast.map((id) => (
                <li key={id}>
                  <Link to={personPath(id, personName(index, id))} className={styles.person}>
                    <PersonAvatar name={personName(index, id)} />
                    <span>{personName(index, id)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <Shelf id="similar" title="More like this" subtitle="Similar genres, crew and era" movies={similar} />

        <footer className={styles.sources}>
          {ready && (
            <p className={styles.links}>
              <a href={ready.wikipedia} target="_blank" rel="noreferrer noopener">Wikipedia article</a>
              <a href={wikidataUrl(movie.id)} target="_blank" rel="noreferrer noopener">Wikidata</a>
            </p>
          )}
          <p>
            Synopsis from Wikipedia, licensed{' '}
            <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noreferrer noopener">
              CC BY-SA 4.0
            </a>
            . Film facts from Wikidata (CC0). Poster art is generated.
          </p>
        </footer>
      </div>
    </article>
  )
}

export default function MoviePage() {
  const { slug = '' } = useParams()
  const { index } = useCatalog()
  const movie = index.bySlug.get(slug)
  if (!movie) return <NotFoundPage />
  return <MovieView key={movie.id} movie={movie} />
}
