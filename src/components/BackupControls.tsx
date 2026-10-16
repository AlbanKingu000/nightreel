import { useRef, useState, type ChangeEvent } from 'react'
import { parseUserDataFile, serializeUserData } from '../store/io'
import { useUi } from '../store/uiStore'
import type { UserData } from '../store/userSchema'
import { userStore, useUser } from '../store/userStore'
import styles from './BackupControls.module.css'
import { DownloadIcon, TrashIcon, UploadIcon } from './Icons'

const filmCount = (count: number) => `${count} ${count === 1 ? 'film' : 'films'}`

/** FileReader works in every browser (and test DOMs) where Blob.text() may not. */
function readText(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error ?? new Error('Could not read the file'))
    reader.readAsText(file)
  })
}

/** Backups are a few KB, so a data: URL works everywhere and avoids blob-URL revocation races. */
function downloadText(text: string, filename: string): void {
  const link = document.createElement('a')
  link.href = `data:application/json;charset=utf-8,${encodeURIComponent(text)}`
  link.download = filename
  document.body.append(link)
  link.click()
  link.remove()
}

/** Export, import and clear the locally stored lists. */
export function BackupControls() {
  const importData = useUser((state) => state.importData)
  const reset = useUser((state) => state.reset)
  const toast = useUi((state) => state.toast)
  const fileRef = useRef<HTMLInputElement>(null)
  const [pending, setPending] = useState<UserData | null>(null)

  const onExport = () => {
    const { version, entries, spinHistory } = userStore.getState()
    const day = new Date().toISOString().slice(0, 10)
    downloadText(serializeUserData({ version, entries, spinHistory }), `nightreel-backup-${day}.json`)
    toast('Backup downloaded', 'success')
  }

  const onFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    const result = parseUserDataFile(await readText(file))
    if (result.ok) setPending(result.data)
    else toast(result.error, 'error')
  }

  const apply = (mode: 'merge' | 'replace') => {
    if (!pending) return
    importData(pending, mode)
    const count = filmCount(Object.keys(pending.entries).length)
    toast(`Imported ${count} (${mode === 'merge' ? 'merged' : 'replaced'})`, 'success')
    setPending(null)
  }

  const onClear = () => {
    if (!window.confirm('Clear all tickets, ratings and reviews saved in this browser?')) return
    reset()
    toast('Your lists were cleared')
  }

  return (
    <div className={styles.controls}>
      <div className={styles.buttons}>
        <button type="button" className="btn btn-small" onClick={onExport}>
          <DownloadIcon /> Export backup
        </button>
        <button type="button" className="btn btn-small" onClick={() => fileRef.current?.click()}>
          <UploadIcon /> Import backup
        </button>
        <button type="button" className="btn btn-small" onClick={onClear}>
          <TrashIcon /> Clear all
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="visually-hidden"
          tabIndex={-1}
          aria-label="Choose a Nightreel backup file"
          onChange={(event) => void onFile(event)}
        />
      </div>
      {pending && (
        <div className={styles.confirm} role="group" aria-label="Import options">
          <p>
            Found {filmCount(Object.keys(pending.entries).length)} in that backup. Merge them into your
            list, or replace your list?
          </p>
          <div className={styles.buttons}>
            <button type="button" className="btn btn-primary btn-small" onClick={() => apply('merge')}>
              Merge
            </button>
            <button type="button" className="btn btn-small" onClick={() => apply('replace')}>
              Replace
            </button>
            <button type="button" className="btn btn-small" onClick={() => setPending(null)}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
