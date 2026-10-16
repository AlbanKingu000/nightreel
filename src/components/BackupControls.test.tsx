import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { serializeUserData } from '../store/io'
import { userStore } from '../store/userStore'
import '../test/render'
import { BackupControls } from './BackupControls'
import { Toasts } from './Toasts'

const backupFile = (text: string) => new File([text], 'backup.json', { type: 'application/json' })
const entryIds = () => Object.keys(userStore.getState().entries).sort()

function renderControls() {
  return render(
    <>
      <BackupControls />
      <Toasts />
    </>,
  )
}

afterEach(() => vi.restoreAllMocks())

describe('BackupControls', () => {
  it('exports a backup file', async () => {
    const downloads: Array<{ href: string; name: string }> = []
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      downloads.push({ href: this.href, name: this.download })
    })
    userStore.getState().toggleFavorite('Q1')
    renderControls()
    await userEvent.click(screen.getByRole('button', { name: /Export backup/ }))
    expect(downloads).toHaveLength(1)
    expect(downloads[0]?.name).toMatch(/^nightreel-backup-\d{4}-\d{2}-\d{2}\.json$/)
    const json = decodeURIComponent(downloads[0]?.href.split(',')[1] ?? '')
    expect(JSON.parse(json)).toMatchObject({ format: 'nightreel-user-data', data: { entries: { Q1: {} } } })
    expect(screen.getByText('Backup downloaded')).toBeInTheDocument()
  })

  it('imports a backup by merging or replacing', async () => {
    const user = userEvent.setup()
    userStore.getState().toggleFavorite('Q1')
    renderControls()
    const data = { version: 1 as const, entries: { Q2: { watchlistAt: 1 } }, spinHistory: [] }
    await user.upload(screen.getByLabelText('Choose a Nightreel backup file'), backupFile(serializeUserData(data)))
    expect(await screen.findByText(/Found 1 film in that backup/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Merge' }))
    expect(entryIds()).toEqual(['Q1', 'Q2'])

    await user.upload(screen.getByLabelText('Choose a Nightreel backup file'), backupFile(serializeUserData(data)))
    await user.click(await screen.findByRole('button', { name: 'Replace' }))
    expect(entryIds()).toEqual(['Q2'])

    await user.upload(screen.getByLabelText('Choose a Nightreel backup file'), backupFile(serializeUserData(data)))
    await user.click(await screen.findByRole('button', { name: 'Cancel' }))
    expect(screen.queryByRole('group', { name: 'Import options' })).not.toBeInTheDocument()
  })

  it('rejects files that are not backups', async () => {
    renderControls()
    await userEvent.upload(screen.getByLabelText('Choose a Nightreel backup file'), backupFile('{oops'))
    expect(await screen.findByText("That file isn't valid JSON.")).toBeInTheDocument()
  })

  it('clears everything only after confirmation', async () => {
    const user = userEvent.setup()
    userStore.getState().toggleFavorite('Q1')
    renderControls()
    const confirm = vi.spyOn(window, 'confirm').mockReturnValueOnce(false).mockReturnValueOnce(true)
    await user.click(screen.getByRole('button', { name: /Clear all/ }))
    expect(entryIds()).toEqual(['Q1'])
    await user.click(screen.getByRole('button', { name: /Clear all/ }))
    expect(entryIds()).toEqual([])
    expect(confirm).toHaveBeenCalledTimes(2)
  })
})
