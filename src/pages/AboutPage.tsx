import { Link } from 'react-router'
import { useCatalog } from '../app/catalog-context'
import { PageHeader } from '../components/PageHeader'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import styles from './AboutPage.module.css'

const SHORTCUTS = [
  ['Ctrl K or /', 'Open search from anywhere'],
  ['↑ ↓ then Enter', 'Pick a search result'],
  ['Esc', 'Close search or a trailer'],
  ['← → on the stars', 'Rate in half-star steps'],
] as const

export default function AboutPage() {
  const { index } = useCatalog()
  useDocumentTitle('About')
  const built = new Date(index.generatedAt).toLocaleDateString(undefined, { dateStyle: 'long' })

  return (
    <div className="page">
      <PageHeader kicker="Behind the projector" title="About Nightreel" />
      <div className={styles.grid}>
        <section className={styles.card}>
          <h2 className="section-title">What this is</h2>
          <p>
            Nightreel helps you find tonight&apos;s movie. It holds <strong>{index.movies.length} films</strong> and{' '}
            <strong>{Object.keys(index.people).length} directors and actors</strong>, with awards, trailers and
            similar-movie picks. It doesn&apos;t stream films: use <em>Where to watch</em> on any movie page to see
            where it&apos;s available.
          </p>
          <p>
            Start on the <Link to="/">home page</Link>, dig through <Link to="/browse">Browse</Link>, or let the
            projector decide with <Link to="/spin">Spin the reel</Link>.
          </p>
        </section>

        <section className={styles.card}>
          <h2 className="section-title">Your data stays here</h2>
          <p>
            Tickets, ratings and reviews are saved only in this browser. There are no accounts and nothing is sent
            anywhere. Use <Link to="/my-list">Export backup</Link> to copy your list to another browser or device.
          </p>
        </section>

        <section className={styles.card}>
          <h2 className="section-title">Keyboard shortcuts</h2>
          <dl className={styles.shortcuts}>
            {SHORTCUTS.map(([keys, action]) => (
              <div key={keys}>
                <dt>
                  <kbd>{keys}</kbd>
                </dt>
                <dd>{action}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className={styles.card}>
          <h2 className="section-title">Credits and licenses</h2>
          <ul className={styles.credits}>
            <li>Film facts (cast, crew, dates, awards): Wikidata, CC0.</li>
            <li>Synopses: Wikipedia, CC BY-SA 4.0. Each movie page links to its article.</li>
            <li>Poster cards: original artwork generated from each title. No studio posters are used.</li>
            <li>Trailers: played from YouTube via its privacy-enhanced player.</li>
            <li>Fonts: Bebas Neue, Fraunces and Inter (SIL Open Font License).</li>
          </ul>
          <p className="muted">Catalog built {built}.</p>
        </section>
      </div>
    </div>
  )
}
