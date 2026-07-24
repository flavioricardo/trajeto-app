import { Pt } from './geo'

const close = (pts: Pt[]): Pt[] => [...pts, pts[0]]

const param = (n: number, f: (t: number) => Pt): Pt[] => {
  const pts: Pt[] = []
  for (let i = 0; i < n; i++) pts.push(f((i / n) * 2 * Math.PI))
  return close(pts)
}

const heart = param(60, t => ({
  x: (16 * Math.sin(t) ** 3 + 16) / 32,
  y: 1 - (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t) + 17) / 29,
}))

const circle = param(36, t => ({ x: 0.5 + 0.48 * Math.cos(t), y: 0.5 + 0.48 * Math.sin(t) }))

const star = close(
  Array.from({ length: 10 }, (_, i) => {
    const r = i % 2 === 0 ? 0.48 : 0.19
    const a = -Math.PI / 2 + (i * Math.PI) / 5
    return { x: 0.5 + r * Math.cos(a), y: 0.5 + r * Math.sin(a) }
  }),
)

const bolt = close([
  { x: 0.6, y: 0.02 }, { x: 0.25, y: 0.5 }, { x: 0.45, y: 0.5 },
  { x: 0.35, y: 0.98 }, { x: 0.75, y: 0.42 }, { x: 0.55, y: 0.42 }, { x: 0.7, y: 0.02 },
])

const shoe = close([
  { x: 0.05, y: 0.72 }, { x: 0.07, y: 0.5 }, { x: 0.12, y: 0.34 }, { x: 0.22, y: 0.3 },
  { x: 0.3, y: 0.34 }, { x: 0.42, y: 0.44 }, { x: 0.55, y: 0.53 }, { x: 0.68, y: 0.59 },
  { x: 0.82, y: 0.63 }, { x: 0.92, y: 0.68 }, { x: 0.95, y: 0.78 }, { x: 0.93, y: 0.87 },
  { x: 0.5, y: 0.88 }, { x: 0.08, y: 0.87 },
])

const thumbUpPts: Pt[] = [
  { x: 0.2, y: 0.95 }, { x: 0.2, y: 0.5 }, { x: 0.3, y: 0.5 }, { x: 0.3, y: 0.35 },
  { x: 0.35, y: 0.15 }, { x: 0.45, y: 0.1 }, { x: 0.5, y: 0.18 }, { x: 0.48, y: 0.35 },
  { x: 0.45, y: 0.45 }, { x: 0.85, y: 0.45 }, { x: 0.9, y: 0.5 }, { x: 0.88, y: 0.58 },
  { x: 0.82, y: 0.6 }, { x: 0.86, y: 0.65 }, { x: 0.84, y: 0.72 }, { x: 0.78, y: 0.74 },
  { x: 0.82, y: 0.79 }, { x: 0.8, y: 0.86 }, { x: 0.6, y: 0.88 }, { x: 0.55, y: 0.95 },
]
const thumbUp = close(thumbUpPts)
const thumbDown = close(thumbUpPts.map(p => ({ x: p.x, y: 1 - p.y })))

export const SHAPES: Record<string, Pt[]> = {
  'Coração': heart,
  'Estrela': star,
  'Círculo': circle,
  'Raio': bolt,
  'Tênis': shoe,
  'Joinha': thumbUp,
  'Deslike': thumbDown,
}
