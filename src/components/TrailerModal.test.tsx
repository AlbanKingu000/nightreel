import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { youtubeSearchUrl } from '../domain/links'
import { sampleMovies } from '../test/fixtures'
import { TrailerButton } from './TrailerModal'

const inception = sampleMovies()[0]!

describe('TrailerButton', () => {
  it('links to a YouTube search when no trailer is known', () => {
    render(<TrailerButton movie={inception} trailer={null} />)
    expect(screen.getByRole('link', { name: /Find the trailer/ })).toHaveAttribute(
      'href',
      youtubeSearchUrl('Inception', 2010),
    )
  })

  it('loads the player only after a click, and closes it', async () => {
    const user = userEvent.setup()
    render(<TrailerButton movie={inception} trailer={{ youtubeId: 'YoHD9XEInc0', kind: 'trailer' }} />)
    expect(document.querySelector('iframe')).toBeNull()
    await user.click(screen.getByRole('button', { name: /Watch trailer/ }))
    expect(screen.getByTitle('Inception trailer')).toHaveAttribute(
      'src',
      expect.stringContaining('youtube-nocookie.com/embed/YoHD9XEInc0'),
    )
    await user.click(screen.getByRole('button', { name: 'Close trailer' }))
    expect(document.querySelector('iframe')).toBeNull()
  })

  it('labels non-trailer videos as clips', () => {
    render(<TrailerButton movie={inception} trailer={{ youtubeId: 'YoHD9XEInc0', kind: 'video' }} />)
    expect(screen.getByRole('button', { name: /Watch clip/ })).toBeInTheDocument()
  })
})
