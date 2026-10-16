import { useEffect } from 'react'
import { Outlet, ScrollRestoration, useLocation, useNavigation } from 'react-router'
import { EmptyState } from '../components/EmptyState'
import { ErrorBoundary } from '../components/ErrorBoundary'
import { Footer } from '../components/Footer'
import { Header } from '../components/Header'
import { SearchPalette } from '../components/SearchPalette'
import { PageSkeleton } from '../components/Skeletons'
import { Toasts } from '../components/Toasts'
import { isStorageAvailable, syncAcrossTabs } from '../store/userStore'
import { useCatalogState } from './catalog-context'
import styles from './Layout.module.css'

function MainContent() {
  const catalog = useCatalogState()
  const location = useLocation()
  if (catalog.status === 'loading') return <PageSkeleton />
  if (catalog.status === 'error') {
    return (
      <EmptyState
        title="The projector won't start"
        body={catalog.message}
        action={
          <button type="button" className="btn btn-primary" onClick={catalog.retry}>
            Try again
          </button>
        }
      />
    )
  }
  return (
    <ErrorBoundary key={location.pathname}>
      <Outlet />
    </ErrorBoundary>
  )
}

export function Layout() {
  const navigation = useNavigation()
  const catalog = useCatalogState()

  useEffect(() => syncAcrossTabs(), [])

  return (
    <>
      <a className={styles.skip} href="#main">
        Skip to content
      </a>
      <Header />
      {navigation.state === 'loading' && (
        <div className={styles.progress} role="progressbar" aria-label="Loading page" />
      )}
      {!isStorageAvailable() && (
        <p className="notice" role="note">
          Your browser is blocking storage, so tickets and ratings will only last until you close
          this tab.
        </p>
      )}
      <main id="main" className={styles.main} tabIndex={-1}>
        <MainContent />
      </main>
      <Footer />
      {catalog.status === 'ready' && <SearchPalette />}
      <Toasts />
      <ScrollRestoration getKey={scrollKey} />
    </>
  )
}

/** Key by URL: fresh page loads all share the "default" history key, which would reuse another page's scroll. */
const scrollKey = (location: { pathname: string; search: string }) => `${location.pathname}${location.search}`
