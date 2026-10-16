import { useEffect } from 'react'
import { useUi, type Toast } from '../store/uiStore'
import { cx } from './cx'
import styles from './Toasts.module.css'

export const TOAST_MS = 3200

function ToastItem({ toast, onDone }: { toast: Toast; onDone: (id: number) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onDone(toast.id), TOAST_MS)
    return () => clearTimeout(timer)
  }, [toast.id, onDone])
  return <div className={cx(styles.toast, styles[toast.tone])}>{toast.message}</div>
}

export function Toasts() {
  const toasts = useUi((state) => state.toasts)
  const dismiss = useUi((state) => state.dismissToast)
  return (
    <div className={styles.region} role="status" aria-live="polite">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDone={dismiss} />
      ))}
    </div>
  )
}
