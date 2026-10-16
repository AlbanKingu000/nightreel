import { Link, NavLink } from 'react-router'
import { useSearchHotkey } from '../hooks/useSearchHotkey'
import { useUi } from '../store/uiStore'
import { useUser } from '../store/userStore'
import { cx } from './cx'
import styles from './Header.module.css'
import { ReelIcon, SearchIcon, TicketIcon } from './Icons'

const navClass = ({ isActive }: { isActive: boolean }) => cx(styles.link, isActive && styles.active)

export function Header() {
  const ticketCount = useUser(
    (state) => Object.values(state.entries).filter((entry) => entry.watchlistAt !== undefined).length,
  )
  const openSearch = useUi((state) => state.openSearch)
  useSearchHotkey(openSearch)

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link to="/" className={styles.logo} aria-label="Nightreel home">
          <ReelIcon className={styles.logoIcon} />
          <span className={styles.logoText} aria-hidden="true">
            Night<span>reel</span>
          </span>
        </Link>
        <nav aria-label="Main" className={styles.nav}>
          <NavLink to="/" end className={navClass}>
            Home
          </NavLink>
          <NavLink to="/browse" className={navClass}>
            Browse
          </NavLink>
          <NavLink to="/spin" className={navClass}>
            Spin
          </NavLink>
          <NavLink to="/my-list" className={navClass}>
            <TicketIcon />
            <span className={styles.label}>My tickets</span>
            {ticketCount > 0 && (
              <>
                <span className={styles.badge} aria-hidden="true">
                  {ticketCount}
                </span>
                <span className="visually-hidden">, {ticketCount} saved</span>
              </>
            )}
          </NavLink>
        </nav>
        <button
          type="button"
          className={styles.search}
          onClick={openSearch}
          aria-label="Search movies and people"
          aria-keyshortcuts="Control+K /"
        >
          <SearchIcon />
          <span className={styles.searchText}>Search</span>
          <kbd className={styles.kbd}>Ctrl K</kbd>
        </button>
      </div>
    </header>
  )
}
