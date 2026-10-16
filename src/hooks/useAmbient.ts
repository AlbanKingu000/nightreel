import { useEffect } from 'react'

/** Tints the whole page with a movie's poster color while the component is mounted. */
export function useAmbient(color: string | undefined): void {
  useEffect(() => {
    if (!color) return
    const root = document.documentElement
    root.style.setProperty('--ambient', color)
    return () => {
      root.style.removeProperty('--ambient')
    }
  }, [color])
}
