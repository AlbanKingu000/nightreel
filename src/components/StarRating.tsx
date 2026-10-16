import { useState, type KeyboardEvent, type MouseEvent } from 'react'
import { StarIcon } from './Icons'
import styles from './StarRating.module.css'

interface StarRatingProps {
  value: number | null
  onChange: (value: number | null) => void
  label: string
}

const STARS = [1, 2, 3, 4, 5] as const
const MAX = 5
const STEP = 0.5

const KEY_STEPS: Record<string, (current: number) => number> = {
  ArrowRight: (v) => v + STEP,
  ArrowUp: (v) => v + STEP,
  ArrowLeft: (v) => v - STEP,
  ArrowDown: (v) => v - STEP,
  Home: () => STEP,
  End: () => MAX,
}

/** Half-star rating. Works as a slider for keyboards; hover previews, click sets. */
export function StarRating({ value, onChange, label }: StarRatingProps) {
  const [hover, setHover] = useState<number | null>(null)
  const shown = hover ?? value ?? 0

  const valueAt = (event: MouseEvent<HTMLSpanElement>, star: number) => {
    const rect = event.currentTarget.getBoundingClientRect()
    return event.clientX - rect.left < rect.width / 2 ? star - STEP : star
  }

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault()
      onChange(null)
      return
    }
    const step = KEY_STEPS[event.key]
    if (!step) return
    event.preventDefault()
    const next = step(value ?? 0)
    onChange(next <= 0 ? null : Math.min(MAX, next))
  }

  return (
    <div className={styles.rating}>
      <div
        role="slider"
        tabIndex={0}
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={MAX}
        aria-valuenow={value ?? 0}
        aria-valuetext={value ? `${value} out of 5 stars` : 'Not rated'}
        className={styles.stars}
        onKeyDown={onKeyDown}
        onMouseLeave={() => setHover(null)}
      >
        {STARS.map((star) => {
          const fill = Math.max(0, Math.min(1, shown - (star - 1)))
          return (
            <span
              key={star}
              className={styles.star}
              data-testid={`star-${star}`}
              onMouseMove={(event) => setHover(valueAt(event, star))}
              onClick={(event) => onChange(valueAt(event, star))}
            >
              <StarIcon className={styles.empty} />
              <span className={styles.fill} style={{ width: `${fill * 100}%` }}>
                <StarIcon />
              </span>
            </span>
          )
        })}
      </div>
      <span className={styles.value} aria-hidden="true">
        {value ? `${value} / 5` : 'Tap a star'}
      </span>
      {value !== null && (
        <button type="button" className={styles.clear} onClick={() => onChange(null)}>
          Clear rating
        </button>
      )}
    </div>
  )
}
