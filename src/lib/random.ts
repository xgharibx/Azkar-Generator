import type { StoryDesign } from '../types'

export function clamp(min: number, value: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function randomSeed(): number {
  if (typeof crypto !== 'undefined' && 'getRandomValues' in crypto) {
    const buf = new Uint32Array(1)
    crypto.getRandomValues(buf)
    return buf[0]!
  }
  return Math.floor(Math.random() * 2 ** 32)
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export type Rng = {
  next: () => number
  int: (minInclusive: number, maxInclusive: number) => number
  pick: <T>(items: readonly T[]) => T
}

export function createRng(seed: number): Rng {
  const next = mulberry32(seed)

  return {
    next,
    int(minInclusive, maxInclusive) {
      if (maxInclusive < minInclusive) return minInclusive
      const r = next()
      return minInclusive + Math.floor(r * (maxInclusive - minInclusive + 1))
    },
    pick(items) {
      if (items.length === 0) {
        throw new Error('Cannot pick from empty array')
      }
      return items[Math.floor(next() * items.length)]!
    },
  }
}

const PALETTES = [
  // dark
  { from: '#0b1220', to: '#0e2a3a', accent: '#7aa6ff', mode: 'dark' as const },
  { from: '#0b0f19', to: '#2a174b', accent: '#b892ff', mode: 'dark' as const },
  { from: '#070a12', to: '#1b2a3a', accent: '#80ffd1', mode: 'dark' as const },
  { from: '#071016', to: '#123024', accent: '#a6ff7a', mode: 'dark' as const },
  { from: '#0b0b10', to: '#2a1b12', accent: '#ffcc80', mode: 'dark' as const },

  // light / paper
  {
    from: '#fbf7ef',
    to: '#f2eadb',
    accent: '#b08a2e',
    mode: 'light' as const,
    paper: '#fffdf8',
  },
  {
    from: '#f7fbff',
    to: '#eef4ff',
    accent: '#2f5bd6',
    mode: 'light' as const,
    paper: '#ffffff',
  },
  {
    from: '#f8faf9',
    to: '#eef4f1',
    accent: '#1f7a57',
    mode: 'light' as const,
    paper: '#ffffff',
  },
]

export function createDesign(seed: number): StoryDesign {
  const rng = createRng(seed)

  const templates: StoryDesign['template'][] = [
    'frame',
    'center',
    'split',
    'stack',
    'list',
    'paper',
  ]
  const fonts: StoryDesign['font']['family'][] = ['sans', 'serif']

  const pickedTemplate = rng.pick(templates)
  const pickedBg = rng.pick(PALETTES)
  const background =
    pickedTemplate === 'paper' && pickedBg.mode !== 'light'
      ? (
          {
            from: '#fbf7ef',
            to: '#f2eadb',
            accent: '#b08a2e',
            mode: 'light' as const,
            paper: '#fffdf8',
          } satisfies StoryDesign['background']
        )
      : pickedBg

  return {
    template: pickedTemplate,
    background,
    font: {
      family: rng.pick(fonts),
    },
    decorations: {
      showPattern: rng.next() > 0.35,
      showGlow: rng.next() > 0.4,
    },
  }
}
