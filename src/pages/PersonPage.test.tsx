import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderRoute } from '../test/render'
import PersonPage from './PersonPage'

const renderPerson = (key: string) =>
  renderRoute(<PersonPage />, { path: '/person/:personKey', route: `/person/${key}` })

describe('PersonPage', () => {
  it("lists a director's films", () => {
    renderPerson('Q100-christopher-nolan')
    expect(screen.getByRole('heading', { level: 1, name: 'Christopher Nolan' })).toBeInTheDocument()
    expect(screen.getByText('Director')).toBeInTheDocument()
    expect(screen.getByText(/2 films on Nightreel · 2010–2014/)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Directed' })).toBeInTheDocument()
    expect(screen.getAllByRole('article')).toHaveLength(2)
    expect(screen.getByRole('link', { name: 'Inception' })).toHaveAttribute('href', '/movie/inception-2010')
  })

  it("lists an actor's films", () => {
    renderPerson('Q206')
    expect(screen.getByText('Actor')).toBeInTheDocument()
    expect(screen.getByText(/1 film on Nightreel/)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Appears in' })).toBeInTheDocument()
  })

  it('shows the missing-reel page for unknown people', () => {
    renderPerson('nobody')
    expect(screen.getByText('This reel is missing')).toBeInTheDocument()
  })
})
