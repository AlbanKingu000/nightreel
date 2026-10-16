import { useEffect, useState, type InputHTMLAttributes } from 'react'

interface DraftInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value: string
  onCommit: (value: string) => void
  /** Commit automatically after typing pauses; otherwise commit on blur or Enter. */
  debounceMs?: number
}

/**
 * Keeps a local draft so partial input (like "19" on the way to "1994") isn't
 * rejected mid-typing by URL parsing. External value changes still win.
 */
export function DraftInput({ value, onCommit, debounceMs, onBlur, onKeyDown, ...rest }: DraftInputProps) {
  const [draft, setDraft] = useState(value)
  const [lastValue, setLastValue] = useState(value)

  if (value !== lastValue) {
    setLastValue(value)
    if (value !== draft.trim()) setDraft(value)
  }

  useEffect(() => {
    if (debounceMs === undefined || draft.trim() === value) return
    const timer = setTimeout(() => onCommit(draft.trim()), debounceMs)
    return () => clearTimeout(timer)
  }, [draft, value, debounceMs, onCommit])

  return (
    <input
      {...rest}
      value={draft}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={(event) => {
        if (draft.trim() !== value) onCommit(draft.trim())
        onBlur?.(event)
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter' && draft.trim() !== value) onCommit(draft.trim())
        onKeyDown?.(event)
      }}
    />
  )
}
