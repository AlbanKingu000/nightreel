import type { Movie } from '../data/schema'
import { useUi } from '../store/uiStore'
import { ShareIcon } from './Icons'

/** Uses the native share sheet when available, otherwise copies the link. */
export function ShareButton({ movie }: { movie: Movie }) {
  const toast = useUi((state) => state.toast)

  const share = async () => {
    const url = window.location.href
    try {
      if (typeof navigator.share === 'function') {
        await navigator.share({ title: `${movie.title} (${movie.year})`, text: `Tonight's pick: ${movie.title}`, url })
        return
      }
      await navigator.clipboard.writeText(url)
      toast('Link copied to your clipboard', 'success')
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return
      toast("Couldn't share this link. Copy it from the address bar instead.", 'error')
    }
  }

  return (
    <button type="button" className="btn" onClick={() => void share()}>
      <ShareIcon /> Share
    </button>
  )
}
