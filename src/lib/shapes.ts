import { Pt } from './geo'

const close = (pts: Pt[]): Pt[] => [...pts, pts[0]]

const param = (n: number, f: (t: number) => Pt): Pt[] => {
  const pts: Pt[] = []
  for (let i = 0; i < n; i++) pts.push(f((i / n) * 2 * Math.PI))
  return close(pts)
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))

/**
 * Curva fechada e suave passando pelos âncoras (Catmull-Rom).
 *
 * O traçado é desenhado como polilinha, então a suavidade tem que vir da
 * densidade de pontos: silhueta desenhada à mão com poucos vértices sai
 * facetada. A curva pode passar um pouco fora do casco dos âncoras, daí o
 * clamp — as formas precisam viver em 0-1.
 */
const smooth = (anchors: Pt[], per = 10): Pt[] => {
  const out: Pt[] = []
  const n = anchors.length
  for (let i = 0; i < n; i++) {
    const p0 = anchors[(i - 1 + n) % n]
    const p1 = anchors[i]
    const p2 = anchors[(i + 1) % n]
    const p3 = anchors[(i + 2) % n]
    for (let j = 0; j < per; j++) {
      const t = j / per
      const t2 = t * t
      const t3 = t2 * t
      const at = (a: number, b: number, c: number, d: number) =>
        0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3)
      out.push({
        x: clamp01(at(p0.x, p1.x, p2.x, p3.x)),
        y: clamp01(at(p0.y, p1.y, p2.y, p3.y)),
      })
    }
  }
  return close(out)
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

// Tênis de perfil, bico à esquerda. O recorte do cano (âncora 7) é o que faz
// a silhueta ler como calçado e não como cunha.
const shoe = smooth([
  { x: 0.06, y: 0.62 }, { x: 0.14, y: 0.55 }, { x: 0.30, y: 0.52 }, { x: 0.46, y: 0.49 },
  { x: 0.58, y: 0.46 }, { x: 0.66, y: 0.41 }, { x: 0.71, y: 0.37 }, { x: 0.75, y: 0.38 },
  { x: 0.79, y: 0.43 }, { x: 0.84, y: 0.36 }, { x: 0.89, y: 0.33 }, { x: 0.94, y: 0.43 },
  { x: 0.96, y: 0.56 }, { x: 0.93, y: 0.70 }, { x: 0.78, y: 0.74 },
  { x: 0.55, y: 0.75 }, { x: 0.32, y: 0.75 }, { x: 0.16, y: 0.72 },
])

// Mão fechada com polegar pra cima. As âncoras 13-18 alternam em x pra virar
// as três dobras dos dedos depois de suavizadas.
const thumbUp = smooth([
  { x: 0.12, y: 0.93 }, { x: 0.10, y: 0.62 }, { x: 0.13, y: 0.50 }, { x: 0.19, y: 0.36 },
  { x: 0.25, y: 0.18 }, { x: 0.34, y: 0.08 }, { x: 0.44, y: 0.14 }, { x: 0.43, y: 0.28 },
  { x: 0.39, y: 0.39 }, { x: 0.58, y: 0.38 }, { x: 0.76, y: 0.39 }, { x: 0.87, y: 0.45 },
  { x: 0.88, y: 0.54 }, { x: 0.82, y: 0.58 }, { x: 0.88, y: 0.64 }, { x: 0.81, y: 0.69 },
  { x: 0.86, y: 0.75 }, { x: 0.78, y: 0.81 }, { x: 0.80, y: 0.88 }, { x: 0.68, y: 0.93 },
  { x: 0.40, y: 0.95 },
])

// Meia volta, não espelho: espelhar só no eixo Y inverteria a mão, trocando a
// direita pela esquerda. Girar 180° mantém a mesma mão, de cabeça pra baixo.
const thumbDown = thumbUp.map(p => ({ x: 1 - p.x, y: 1 - p.y }))

export const SHAPES: Record<string, Pt[]> = {
  'Coração': heart,
  'Estrela': star,
  'Círculo': circle,
  'Raio': bolt,
  'Tênis': shoe,
  'Joinha': thumbUp,
  'Não curti': thumbDown,
}
