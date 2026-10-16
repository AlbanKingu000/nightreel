/** Deterministic artwork for the generated poster cards: same title, same card. */

export const POSTER_VARIANTS = 4

/** FNV-1a 32-bit hash. */
export function titleHash(title: string): number {
  let hash = 2166136261
  for (const char of title) {
    hash ^= char.codePointAt(0) ?? 0
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function hslToHex(h: number, s: number, l: number): string {
  const a = s * Math.min(l, 1 - l)
  const channel = (n: number) => {
    const k = (n + h / 30) % 12
    const value = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))
    return Math.round(value * 255)
      .toString(16)
      .padStart(2, '0')
  }
  return `#${channel(0)}${channel(8)}${channel(4)}`
}

/** A deep, saturated tint that suits the late-night palette (used for the card and page ambience). */
export const titleColor = (title: string): string =>
  hslToHex(titleHash(title) % 360, 0.55, 0.34)

export function posterArt(title: string): { variant: number; angle: number } {
  const hash = titleHash(title)
  return { variant: (hash >>> 9) % POSTER_VARIANTS, angle: (hash >>> 3) % 360 }
}
