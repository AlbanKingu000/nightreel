import { isRouteErrorResponse, Link, useRouteError } from 'react-router'
import { EmptyState } from '../components/EmptyState'

export function RouteError() {
  const error = useRouteError()
  const message = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : 'Something went wrong while loading this page.'
  return (
    <div className="page">
      <EmptyState
        title="This reel jammed"
        body={message}
        action={
          <Link className="btn btn-primary" to="/">
            Back to the lobby
          </Link>
        }
      />
    </div>
  )
}
