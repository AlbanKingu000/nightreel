import { useMemo } from 'react'
import { Link, useParams } from 'react-router'
import { useCatalog } from '../app/catalog-context'
import { MovieGrid } from '../components/MovieGrid'
import { PersonAvatar } from '../components/PersonAvatar'
import { moviesByIds, personName, type Credits } from '../domain/catalog-index'
import { wikidataUrl } from '../domain/links'
import { moviePath, parsePersonKey } from '../domain/paths'
import { sortMovies } from '../domain/sort'
import { useAmbient } from '../hooks/useAmbient'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import NotFoundPage from './NotFoundPage'
import styles from './PersonPage.module.css'

function roleLabel(directed: number, acted: number): string {
  if (directed > 0 && acted > 0) return 'Director and actor'
  return directed > 0 ? 'Director' : 'Actor'
}

function PersonView({ id, credits }: { id: string; credits: Credits }) {
  const { index } = useCatalog()
  const name = personName(index, id)
  const directed = useMemo(() => sortMovies(moviesByIds(index, credits.directed), 'newest'), [index, credits])
  const acted = useMemo(() => sortMovies(moviesByIds(index, credits.acted), 'newest'), [index, credits])
  const all = [...directed, ...acted]
  const best = sortMovies(all, 'acclaimed')[0]
  const years = all.map((movie) => movie.year)
  const total = new Set(all.map((movie) => movie.id)).size

  useDocumentTitle(name)
  useAmbient(best?.color)

  return (
    <div className="page">
      <header className={styles.hero}>
        <PersonAvatar name={name} size="large" />
        <div className={styles.text}>
          <p className="kicker">{roleLabel(directed.length, acted.length)}</p>
          <h1 className={styles.name}>{name}</h1>
          <p className="muted">
            {total} {total === 1 ? 'film' : 'films'} on Nightreel
            {years.length > 0 && ` · ${Math.min(...years)}–${Math.max(...years)}`}
          </p>
          {best && (
            <p className="muted">
              Highest rated here: <Link to={moviePath(best)} className={styles.best}>{best.title}</Link>
            </p>
          )}
          <a className={styles.external} href={wikidataUrl(id)} target="_blank" rel="noreferrer noopener">
            More about {name} on Wikidata
          </a>
        </div>
      </header>
      {directed.length > 0 && (
        <section className={styles.section} aria-labelledby="directed-title">
          <h2 id="directed-title" className="section-title">
            Directed
          </h2>
          <MovieGrid movies={directed} />
        </section>
      )}
      {acted.length > 0 && (
        <section className={styles.section} aria-labelledby="acted-title">
          <h2 id="acted-title" className="section-title">
            Appears in
          </h2>
          <MovieGrid movies={acted} />
        </section>
      )}
    </div>
  )
}

export default function PersonPage() {
  const { personKey = '' } = useParams()
  const { index } = useCatalog()
  const id = parsePersonKey(personKey)
  const credits = id ? index.credits.get(id) : undefined
  if (!id || !credits) return <NotFoundPage />
  return <PersonView key={id} id={id} credits={credits} />
}
