import { useMemo, useState, type KeyboardEvent, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router'
import { useCatalog } from '../app/catalog-context'
import type { Movie } from '../data/schema'
import { personName } from '../domain/catalog-index'
import { moviePath, personPath } from '../domain/paths'
import type { PersonHit } from '../domain/search'
import { useUi } from '../store/uiStore'
import { cx } from './cx'
import { SearchIcon } from './Icons'
import { Modal } from './Modal'
import { Poster } from './Poster'
import { PersonAvatar } from './PersonAvatar'
import styles from './SearchPalette.module.css'

type Option = { kind: 'movie'; movie: Movie } | { kind: 'person'; person: PersonHit }

const SUGGESTIONS = ['inception', 'miyazaki', 'godfather', 'space', 'meryl streep']
const optionId = (i: number) => `search-option-${i}`

interface RowProps {
  index: number
  active: boolean
  onSelect: () => void
  onHover: () => void
  children: ReactNode
}

function Row({ index, active, onSelect, onHover, children }: RowProps) {
  return (
    <div
      id={optionId(index)}
      role="option"
      aria-selected={active}
      className={cx(styles.row, active && styles.active)}
      onMouseDown={(event) => event.preventDefault()}
      onMouseMove={onHover}
      onClick={onSelect}
    >
      {children}
    </div>
  )
}

function SearchBody({ onClose }: { onClose: () => void }) {
  const { search, index } = useCatalog()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const results = useMemo(() => search(query, 8), [search, query])
  const options = useMemo<Option[]>(
    () => [
      ...results.movies.map((movie): Option => ({ kind: 'movie', movie })),
      ...results.people.map((person): Option => ({ kind: 'person', person })),
    ],
    [results],
  )

  const go = (option: Option) => {
    onClose()
    navigate(option.kind === 'movie' ? moviePath(option.movie) : personPath(option.person.id, option.person.name))
  }

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActive((i) => Math.min(options.length - 1, i + 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActive((i) => Math.max(0, i - 1))
    } else if (event.key === 'Enter' && options[active]) {
      event.preventDefault()
      go(options[active])
    }
  }

  const tooShort = query.trim().length < 2
  const moviesOffset = results.movies.length

  return (
    <div className={styles.body}>
      <div className={styles.inputRow}>
        <SearchIcon />
        <input
          className={styles.input}
          role="combobox"
          aria-label="Search movies, directors and actors"
          aria-expanded={options.length > 0}
          aria-controls="search-results"
          aria-autocomplete="list"
          aria-activedescendant={options[active] ? optionId(active) : undefined}
          placeholder="Search movies, directors, actors…"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
            setActive(0)
          }}
          onKeyDown={onKeyDown}
        />
        <button type="button" className={styles.esc} onClick={onClose} aria-label="Close search">
          Esc
        </button>
      </div>

      <div id="search-results" role="listbox" aria-label="Search results" className={styles.results}>
        {results.movies.length > 0 && (
          <div role="group" aria-label="Movies">
            <p className={styles.group} aria-hidden="true">
              Movies
            </p>
            {results.movies.map((movie, i) => (
              <Row key={movie.id} index={i} active={active === i} onSelect={() => go({ kind: 'movie', movie })} onHover={() => setActive(i)}>
                <Poster movie={movie} size="thumb" decorative className={styles.thumb} />
                <span className={styles.text}>
                  <span className={styles.name}>{movie.title}</span>
                  <span className={styles.sub}>
                    {movie.year}
                    {movie.directors[0] && ` · ${personName(index, movie.directors[0])}`}
                  </span>
                </span>
              </Row>
            ))}
          </div>
        )}
        {results.people.length > 0 && (
          <div role="group" aria-label="People">
            <p className={styles.group} aria-hidden="true">
              People
            </p>
            {results.people.map((person, j) => {
              const i = moviesOffset + j
              return (
                <Row key={person.id} index={i} active={active === i} onSelect={() => go({ kind: 'person', person })} onHover={() => setActive(i)}>
                  <PersonAvatar name={person.name} size="small" />
                  <span className={styles.text}>
                    <span className={styles.name}>{person.name}</span>
                    <span className={styles.sub}>
                      {person.credits} {person.credits === 1 ? 'film' : 'films'} on Nightreel
                    </span>
                  </span>
                </Row>
              )
            })}
          </div>
        )}
      </div>

      {tooShort && (
        <div className={styles.hints}>
          <p className={styles.group}>Try</p>
          <div className={styles.suggestions}>
            {SUGGESTIONS.map((suggestion) => (
              <button key={suggestion} type="button" className="chip" onClick={() => setQuery(suggestion)}>
                {suggestion}
              </button>
            ))}
          </div>
          <p className={styles.shortcuts}>
            Or <Link to="/browse" onClick={onClose}>browse everything</Link> · <Link to="/spin" onClick={onClose}>spin the reel</Link>
          </p>
        </div>
      )}
      {!tooShort && options.length === 0 && (
        <p className={styles.none}>No matches for “{query.trim()}”. Try another spelling.</p>
      )}

      <div className={styles.footer} aria-hidden="true">
        <span>
          <kbd>↑</kbd>
          <kbd>↓</kbd> move
        </span>
        <span>
          <kbd>Enter</kbd> open
        </span>
        <span>
          <kbd>Esc</kbd> close
        </span>
      </div>
    </div>
  )
}

export function SearchPalette() {
  const open = useUi((state) => state.searchOpen)
  const close = useUi((state) => state.closeSearch)
  return (
    <Modal open={open} onClose={close} label="Search" className={styles.panel}>
      {open && <SearchBody onClose={close} />}
    </Modal>
  )
}
