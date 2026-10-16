import { useMemo } from 'react'
import { Link, useParams } from 'react-router'
import { useCatalog } from '../app/catalog-context'
import { PageHeader } from '../components/PageHeader'
import { Shelf } from '../components/Shelf'
import { GENRES, type Genre, type Movie } from '../data/schema'
import { decadeLabel } from '../domain/format'
import { genreFromSlug, genrePath, genreSlug } from '../domain/paths'
import { hiddenGems, MIN_SHELF_SIZE } from '../domain/shelves'
import { sortMovies } from '../domain/sort'
import { useAmbient } from '../hooks/useAmbient'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import NotFoundPage from './NotFoundPage'

interface GenreShelf {
  id: string
  title: string
  movies: Movie[]
}

function GenreView({ genre }: { genre: Genre }) {
  const { index } = useCatalog()
  const shelves = useMemo<GenreShelf[]>(() => {
    const movies = index.movies.filter((movie) => movie.genres.includes(genre))
    const decades = [...new Set(movies.map((movie) => decadeLabel(movie.year)))].sort().reverse()
    return [
      { id: 'top', title: 'Most awarded', movies: sortMovies(movies, 'acclaimed') },
      { id: 'popular', title: 'Most popular', movies: sortMovies(movies, 'popular') },
      { id: 'gems', title: 'Hidden gems', movies: hiddenGems(movies, index.stats) },
      ...decades.map((decade) => ({
        id: `decade-${decade}`,
        title: `The ${decade}`,
        movies: sortMovies(movies.filter((movie) => decadeLabel(movie.year) === decade), 'acclaimed'),
      })),
    ]
  }, [index, genre])
  const total = shelves[0]?.movies.length ?? 0

  useDocumentTitle(genre)
  useAmbient(shelves[0]?.movies[0]?.color)

  return (
    <div className="page">
      <PageHeader kicker="Genre" title={genre} subtitle={`${total} films`}>
        <Link className="btn" to={`/browse?g=${genreSlug(genre)}`}>
          Filter and sort all {total}
        </Link>
      </PageHeader>
      {shelves
        .filter((shelf) => shelf.movies.length >= MIN_SHELF_SIZE)
        .map((shelf, i) => (
          <Shelf key={shelf.id} id={shelf.id} title={shelf.title} movies={shelf.movies} priority={i === 0} />
        ))}
      <nav aria-label="Other genres">
        <h2 className="section-title">Other genres</h2>
        <p style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
          {GENRES.filter((other) => other !== genre).map((other) => (
            <Link key={other} className="chip" to={genrePath(other)}>
              {other}
            </Link>
          ))}
        </p>
      </nav>
    </div>
  )
}

export default function GenrePage() {
  const { genreSlug: slug = '' } = useParams()
  const genre = genreFromSlug(slug)
  if (!genre) return <NotFoundPage />
  return <GenreView key={genre} genre={genre} />
}
