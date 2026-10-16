import { describe, expect, it } from 'vitest'
import { decadeLabel, formatRuntime } from './format'

describe('formatRuntime', () => {
  it.each([
    [148, '2h 28m'],
    [120, '2h'],
    [45, '45m'],
  ])('%i minutes -> %s', (minutes, expected) => {
    expect(formatRuntime(minutes)).toBe(expected)
  })
})

describe('decadeLabel', () => {
  it('labels decades', () => {
    expect(decadeLabel(1987)).toBe('1980s')
    expect(decadeLabel(2020)).toBe('2020s')
  })
})
