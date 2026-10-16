import { useState, type FormEvent } from 'react'
import type { Movie } from '../data/schema'
import { useUi } from '../store/uiStore'
import { MAX_REVIEW_LENGTH } from '../store/userSchema'
import { useUser } from '../store/userStore'
import styles from './ReviewForm.module.css'

/** Your private review. Remount with `key={savedText}` so outside changes show up. */
export function ReviewForm({ movie }: { movie: Movie }) {
  const saved = useUser((state) => state.entries[movie.id]?.review?.text ?? '')
  const setReview = useUser((state) => state.setReview)
  const toast = useUi((state) => state.toast)
  const [draft, setDraft] = useState(saved)
  const [editing, setEditing] = useState(saved === '')
  const fieldId = `review-${movie.id}`

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    setReview(movie.id, draft)
    setEditing(draft.trim() === '')
    toast(draft.trim() ? 'Review saved' : 'Review removed', 'success')
  }

  const onDelete = () => {
    setReview(movie.id, '')
    setDraft('')
    setEditing(true)
    toast('Review removed')
  }

  if (!editing && saved) {
    return (
      <figure className={styles.saved}>
        <blockquote className={styles.quote}>{saved}</blockquote>
        <figcaption className={styles.row}>
          <span className={styles.count}>Only you can see this.</span>
          <span className={styles.buttons}>
            <button type="button" className="btn btn-small" onClick={() => setEditing(true)}>
              Edit review
            </button>
            <button type="button" className="btn btn-small" onClick={onDelete}>
              Delete review
            </button>
          </span>
        </figcaption>
      </figure>
    )
  }

  return (
    <form className={styles.form} onSubmit={onSubmit}>
      <label htmlFor={fieldId} className="visually-hidden">
        Your review of {movie.title}
      </label>
      <textarea
        id={fieldId}
        className={styles.textarea}
        value={draft}
        rows={4}
        maxLength={MAX_REVIEW_LENGTH}
        placeholder="What stayed with you after the credits rolled?"
        onChange={(event) => setDraft(event.target.value)}
      />
      <div className={styles.row}>
        <span className={styles.count}>
          {draft.length}/{MAX_REVIEW_LENGTH}
        </span>
        <button type="submit" className="btn btn-primary btn-small" disabled={draft.trim() === saved}>
          Save review
        </button>
      </div>
    </form>
  )
}
