import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { makeMovie } from '../test/factories'
import { Poster } from './Poster'

const movie = makeMovie({ id: 'Q1', title: 'Inception', year: 2010 })

describe('Poster', () => {
  it('renders a generated title card with no external image', () => {
    const { container } = render(<Poster movie={movie} />)
    expect(screen.getByRole('img', { name: 'Inception (2010)' })).toHaveTextContent('2010InceptionNightreel')
    expect(container.querySelector('img')).toBeNull()
  })

  it('hides decorative posters from assistive tech', () => {
    render(<Poster movie={movie} decorative />)
    expect(screen.getByTestId('poster')).toHaveAttribute('aria-hidden', 'true')
    expect(screen.queryByRole('img')).toBeNull()
  })

  it('renders thumbnails without text', () => {
    render(<Poster movie={movie} size="thumb" decorative />)
    expect(screen.getByTestId('poster')).toHaveTextContent('')
  })
})
