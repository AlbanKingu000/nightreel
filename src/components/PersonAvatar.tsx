import type { CSSProperties } from 'react'
import { cx } from './cx'
import styles from './PersonAvatar.module.css'

const HUES = [18, 32, 280, 320, 200, 160, 350, 45] as const

function hueFor(name: string): number {
  const sum = [...name].reduce((total, char) => total + char.charCodeAt(0), 0)
  return HUES[sum % HUES.length] ?? HUES[0]
}

function initials(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean)
  const first = parts[0]?.[0] ?? '?'
  const last = parts.length > 1 ? (parts.at(-1)?.[0] ?? '') : ''
  return `${first}${last}`.toUpperCase()
}

/** No headshots are bundled, so people get a warm initials badge instead. */
export function PersonAvatar({ name, size = 'medium' }: { name: string; size?: 'small' | 'medium' | 'large' }) {
  const style = { '--hue': hueFor(name) } as CSSProperties
  return (
    <span className={cx(styles.avatar, styles[size])} style={style} aria-hidden="true">
      {initials(name)}
    </span>
  )
}
