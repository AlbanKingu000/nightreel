import { Link } from 'react-router'
import { EmptyState } from '../components/EmptyState'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

export default function NotFoundPage() {
  useDocumentTitle('Reel not found')
  return (
    <div className="page">
      <EmptyState
        title="This reel is missing"
        body="The page you're looking for isn't in the projection booth."
        action={
          <>
            <Link className="btn btn-primary" to="/">
              Back to the lobby
            </Link>
            <Link className="btn" to="/browse">
              Browse films
            </Link>
            <Link className="btn" to="/spin">
              Spin the reel
            </Link>
          </>
        }
      />
    </div>
  )
}
