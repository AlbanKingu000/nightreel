import type { ReactNode } from 'react'
import styles from './PageHeader.module.css'

interface PageHeaderProps {
  kicker?: string
  title: ReactNode
  subtitle?: ReactNode
  children?: ReactNode
}

export function PageHeader({ kicker, title, subtitle, children }: PageHeaderProps) {
  return (
    <header className={styles.header}>
      <div>
        {kicker && <p className="kicker">{kicker}</p>}
        <h1 className={styles.title}>{title}</h1>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </div>
      {children && <div className={styles.actions}>{children}</div>}
    </header>
  )
}
