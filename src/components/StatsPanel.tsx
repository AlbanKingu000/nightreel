import type { UserStats } from '../domain/stats'
import styles from './StatsPanel.module.css'

function Bars({ title, rows }: { title: string; rows: Array<{ label: string; count: number }> }) {
  const max = Math.max(1, ...rows.map((row) => row.count))
  return (
    <div className={styles.bars}>
      <h3 className={styles.barsTitle}>{title}</h3>
      {rows.length === 0 ? (
        <p className={styles.hint}>Mark films as watched to see this.</p>
      ) : (
        <ul>
          {rows.map((row) => (
            <li key={row.label}>
              <span className={styles.barLabel}>{row.label}</span>
              <span className={styles.track}>
                <span className={styles.fill} style={{ width: `${(row.count / max) * 100}%` }} />
              </span>
              <span className={styles.barCount}>{row.count}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function StatsPanel({ stats }: { stats: UserStats }) {
  const cards = [
    { label: 'Films watched', value: String(stats.watchedCount) },
    { label: 'Hours in the dark', value: String(stats.hoursWatched) },
    { label: 'Average rating', value: stats.averageRating === null ? '—' : `${stats.averageRating} ★` },
    { label: 'Favorites', value: String(stats.favoritesCount) },
  ]
  return (
    <section className={styles.panel} aria-label="Your stats">
      <dl className={styles.cards}>
        {cards.map((card) => (
          <div key={card.label} className={styles.card}>
            <dt>{card.label}</dt>
            <dd>{card.value}</dd>
          </div>
        ))}
      </dl>
      <Bars title="Top genres" rows={stats.topGenres.map((g) => ({ label: g.genre, count: g.count }))} />
      <Bars title="Favorite decades" rows={stats.topDecades.map((d) => ({ label: d.decade, count: d.count }))} />
    </section>
  )
}
