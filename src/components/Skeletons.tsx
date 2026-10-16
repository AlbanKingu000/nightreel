import styles from './Skeletons.module.css'

const range = (count: number) => Array.from({ length: count }, (_, i) => i)

export function TicketSkeletons({ count = 8 }: { count?: number }) {
  return (
    <>
      {range(count).map((i) => (
        <div key={i} className={styles.ticket} aria-hidden="true">
          <div className={styles.poster} />
          <div className={styles.line} />
          <div className={styles.lineShort} />
        </div>
      ))}
    </>
  )
}

export function GridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className={styles.grid} role="status" aria-label="Loading movies">
      <TicketSkeletons count={count} />
    </div>
  )
}

export function PageSkeleton() {
  return (
    <div className="page" role="status" aria-label="Loading">
      <div className={styles.hero} aria-hidden="true" />
      {range(2).map((row) => (
        <div key={row} className={styles.row} aria-hidden="true">
          <div className={styles.heading} />
          <div className={styles.track}>
            <TicketSkeletons count={7} />
          </div>
        </div>
      ))}
    </div>
  )
}
