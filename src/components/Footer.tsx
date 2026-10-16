import { Link } from 'react-router'
import styles from './Footer.module.css'
import { ReelIcon } from './Icons'

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <ReelIcon />
          <span>Nightreel</span>
        </div>
        <nav aria-label="Footer" className={styles.links}>
          <Link to="/browse">Browse</Link>
          <Link to="/spin">Spin the reel</Link>
          <Link to="/my-list">My tickets</Link>
          <Link to="/about">About and credits</Link>
        </nav>
        <p className={styles.credit}>
          Text from Wikipedia,{' '}
          <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noreferrer noopener">
            CC BY-SA 4.0
          </a>
          ; data from Wikidata, CC0. Poster cards are generated artwork. Nightreel is a fictional portfolio
          project.
        </p>
      </div>
    </footer>
  )
}
