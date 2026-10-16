import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { catalogSchema } from '../data/schema'
import { sampleCatalog } from '../test/fixtures'
import { useCatalogState } from './catalog-context'
import { CatalogProvider } from './CatalogProvider'

function Probe() {
  const state = useCatalogState()
  if (state.status === 'loading') return <p>loading</p>
  if (state.status === 'error') {
    return (
      <button type="button" onClick={state.retry}>
        {state.message}
      </button>
    )
  }
  return <p>{`ready:${state.index.movies.length}:${state.search('incept').movies[0]?.id}`}</p>
}

describe('CatalogProvider', () => {
  it('loads the catalog and exposes the index and search', async () => {
    const load = async () => sampleCatalog()
    render(
      <CatalogProvider load={load}>
        <Probe />
      </CatalogProvider>,
    )
    expect(screen.getByText('loading')).toBeInTheDocument()
    expect(await screen.findByText('ready:10:Q1')).toBeInTheDocument()
  })

  it('shows the error and retries', async () => {
    const load = vi.fn().mockRejectedValueOnce(new Error('Offline')).mockResolvedValueOnce(sampleCatalog())
    render(
      <CatalogProvider load={load}>
        <Probe />
      </CatalogProvider>,
    )
    await userEvent.click(await screen.findByRole('button', { name: 'Offline' }))
    expect(await screen.findByText('ready:10:Q1')).toBeInTheDocument()
    expect(load).toHaveBeenCalledTimes(2)
  })

  it('explains a damaged catalog file', async () => {
    const zodError = catalogSchema.safeParse({}).error
    const load = vi.fn().mockRejectedValue(zodError)
    render(
      <CatalogProvider load={load}>
        <Probe />
      </CatalogProvider>,
    )
    expect(await screen.findByRole('button', { name: /catalog file is damaged/ })).toBeInTheDocument()
  })

  it('handles non-Error failures', async () => {
    const load = vi.fn().mockRejectedValue('nope')
    render(
      <CatalogProvider load={load}>
        <Probe />
      </CatalogProvider>,
    )
    expect(await screen.findByRole('button', { name: /went wrong/ })).toBeInTheDocument()
  })
})
