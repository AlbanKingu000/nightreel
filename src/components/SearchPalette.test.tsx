import { act, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { useUi } from '../store/uiStore'
import { expectPath, renderRoute } from '../test/render'
import { SearchPalette } from './SearchPalette'

function openPalette() {
  const utils = renderRoute(<SearchPalette />)
  act(() => useUi.getState().openSearch())
  return utils
}

const input = () => screen.getByRole('combobox', { name: /search movies/i })

describe('SearchPalette', () => {
  it('finds movies and people and opens the highlighted result with Enter', async () => {
    const user = userEvent.setup()
    const { router } = openPalette()
    expect(input()).toHaveFocus()
    await user.type(input(), 'nolan')
    expect(within(screen.getByRole('group', { name: 'People' })).getByRole('option')).toHaveTextContent('Christopher Nolan')
    expect(within(screen.getByRole('group', { name: 'Movies' })).getAllByRole('option').length).toBeGreaterThanOrEqual(2)
    await user.keyboard('{ArrowDown}{ArrowDown}{ArrowUp}{ArrowUp}{Enter}')
    await expectPath(router, /^\/movie\//)
    expect(useUi.getState().searchOpen).toBe(false)
  })

  it('opens a person page when a person is clicked', async () => {
    const user = userEvent.setup()
    const { router } = openPalette()
    await user.type(input(), 'kubrick')
    await user.click(within(screen.getByRole('group', { name: 'People' })).getByRole('option'))
    await expectPath(router, '/person/Q104-stanley-kubrick')
  })

  it('suggests queries, and says when nothing matches', async () => {
    const user = userEvent.setup()
    openPalette()
    await user.click(screen.getByRole('button', { name: 'inception' }))
    expect(input()).toHaveValue('inception')
    expect(screen.getByRole('option', { name: /Inception/ })).toBeInTheDocument()
    await user.clear(input())
    await user.type(input(), 'zzzqqq')
    expect(screen.getByText(/No matches for/)).toBeInTheDocument()
  })

  it('closes from the Esc button', async () => {
    openPalette()
    await userEvent.click(screen.getByRole('button', { name: 'Close search' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
