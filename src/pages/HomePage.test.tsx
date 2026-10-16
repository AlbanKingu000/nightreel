import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { userStore } from '../store/userStore'
import { stubDetailFetch } from '../test/details'
import { renderRoute } from '../test/render'
import HomePage from './HomePage'

beforeEach(() => {
  stubDetailFetch()
})

describe('HomePage', () => {
  it("shows tonight's feature, shelves, moods and collections", async () => {
    renderRoute(<HomePage />)
    expect(screen.getByText("Tonight's feature")).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Now showing' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: "Critics' row" })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Cozy/ })).toHaveAttribute('href', '/spin?mood=cozy')
    expect(screen.getByRole('link', { name: /Best Picture winners/ })).toHaveAttribute('href', '/collection/best-picture')
    expect(screen.getByRole('link', { name: 'Sci-Fi' })).toHaveAttribute('href', '/genre/sci-fi')
    expect(await screen.findByText(/^Overview of Q\d+\.$/)).toBeInTheDocument()
    expect(document.title).toBe("Nightreel · find tonight's movie")
  })

  it('adds personal shelves once you save films', () => {
    userStore.getState().toggleFavorite('Q1')
    userStore.getState().toggleWatchlist('Q1')
    renderRoute(<HomePage />)
    expect(screen.getByRole('heading', { name: /Because you saved Inception/ })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Picked for you' })).toBeInTheDocument()
  })
})
