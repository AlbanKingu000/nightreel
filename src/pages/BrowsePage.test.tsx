import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { expectPath, renderRoute } from '../test/render'
import BrowsePage from './BrowsePage'

const renderBrowse = (route = '/browse') => renderRoute(<BrowsePage />, { path: '/browse', route })
const cards = () => screen.queryAllByRole('article')
const expectCards = (count: number) => waitFor(() => expect(cards()).toHaveLength(count))

describe('BrowsePage', () => {
  it('lists every movie by default', () => {
    renderBrowse()
    expect(screen.getByText('10 of 10 films')).toBeInTheDocument()
    expect(cards()).toHaveLength(10)
  })

  it('applies filters and sort from the URL', () => {
    renderBrowse('/browse?g=comedy&sort=acclaimed')
    expect(screen.getByText('3 of 10 films')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Comedy' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByLabelText('Sort by')).toHaveValue('acclaimed')
    expect(cards()[0]).toHaveTextContent('Amélie')
  })

  it('writes filter changes to the URL and can clear them', async () => {
    const user = userEvent.setup()
    const { router } = renderBrowse()
    await user.click(screen.getByRole('button', { name: 'Horror' }))
    await expectPath(router, '/browse?g=horror')
    expect(await screen.findByText('2 of 10 films')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '1980s' }))
    await expectPath(router, '/browse?g=horror&y=1980-1989')
    await expectCards(1)

    await user.selectOptions(screen.getByLabelText('Length'), 'Under 90 min')
    expect(await screen.findByText('Nothing on this reel')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Remove filter up to 89 min' }))
    await expectCards(1)
    await user.click(screen.getByRole('button', { name: 'Remove filter 1980–1989' }))
    await expectPath(router, '/browse?g=horror')
    await user.click(screen.getByRole('button', { name: 'Clear all filters' }))
    await expectPath(router, '/browse')
    await expectCards(10)
  })

  it('toggles a decade off again', async () => {
    const user = userEvent.setup()
    const { router } = renderBrowse('/browse?y=1980-1989')
    await user.click(screen.getByRole('button', { name: '1980s' }))
    await expectPath(router, '/browse')
  })

  it('clears impossible filters from the empty state', async () => {
    const { router } = renderBrowse('/browse?g=western')
    await userEvent.click(screen.getByRole('button', { name: 'Clear filters' }))
    await expectPath(router, '/browse')
  })

  it('filters by title after typing pauses, and by year range on blur or Enter', async () => {
    const user = userEvent.setup()
    const { router } = renderBrowse()
    await user.type(screen.getByLabelText('Title contains'), 'the')
    await expectPath(router, '/browse?q=the')
    expect(await screen.findByText('3 of 10 films')).toBeInTheDocument()

    await user.type(screen.getByLabelText('From year'), '1975')
    await user.tab()
    await expectPath(router, '/browse?y=1975-&q=the')
    await expectCards(2)

    await user.type(screen.getByLabelText('To year'), '1990{Enter}')
    await expectPath(router, '/browse?y=1975-1990&q=the')
    await user.click(screen.getByRole('button', { name: 'Remove filter “the”' }))
    await waitFor(() => expect(screen.getByLabelText('Title contains')).toHaveValue(''))
  })

  it('sorts and toggles the filter drawer', async () => {
    const user = userEvent.setup()
    renderBrowse()
    await user.selectOptions(screen.getByLabelText('Sort by'), 'Title A–Z')
    await waitFor(() => expect(cards()[0]).toHaveTextContent('Airplane!'))
    const toggle = screen.getByRole('button', { name: /^Filters/ })
    await user.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
  })
})
