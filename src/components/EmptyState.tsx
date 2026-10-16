import type { ReactNode } from 'react'
import { ReelIcon } from './Icons'
import styles from './EmptyState.module.css'

interface EmptyStateProps {
  title: string
  body?: ReactNode
  action?: ReactNode
}

export function EmptyState({ title, body, action }: EmptyStateProps) {
  return (
    <div className={styles.empty}>
      <ReelIcon className={styles.reel} />
      <h2 className="section-title">{title}</h2>
      {body && <p className={styles.body}>{body}</p>}
      {action && <div className={styles.actions}>{action}</div>}
    </div>
  )
}
