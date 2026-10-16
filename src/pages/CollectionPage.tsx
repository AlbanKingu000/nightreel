import { useMemo } from 'react'
import { Link, useParams } from 'react-router'
import { useCatalog } from '../app/catalog-context'
import { MovieGrid } from '../components/MovieGrid'
import { PageHeader } from '../components/PageHeader'
import { COLLECTIONS, findCollection, type Collection } from '../domain/collections'
import { collectionPath } from '../domain/paths'
import { useAmbient } from '../hooks/useAmbient'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import NotFoundPage from './NotFoundPage'

function CollectionView({ collection }: { collection: Collection }) {
  const { index } = useCatalog()
  const movies = useMemo(() => collection.select(index), [collection, index])
  useDocumentTitle(collection.title)
  useAmbient(movies[0]?.color)

  return (
    <div className="page">
      <PageHeader kicker="Collection" title={collection.title} subtitle={`${collection.subtitle} · ${movies.length} films`} />
      <MovieGrid movies={movies} />
      <nav aria-label="Other collections" style={{ marginTop: 48 }}>
        <h2 className="section-title">More collections</h2>
        <p style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
          {COLLECTIONS.filter((other) => other.id !== collection.id).map((other) => (
            <Link key={other.id} className="chip" to={collectionPath(other.id)}>
              {other.title}
            </Link>
          ))}
        </p>
      </nav>
    </div>
  )
}

export default function CollectionPage() {
  const { collectionId = '' } = useParams()
  const collection = findCollection(collectionId)
  if (!collection) return <NotFoundPage />
  return <CollectionView key={collection.id} collection={collection} />
}
