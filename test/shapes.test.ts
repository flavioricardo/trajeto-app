import { extractShape } from '../src/lib/api'
import { SHAPES } from '../src/lib/shapes'

it('extractShape: LineString vira LatLon[]', () => {
  const s = extractShape({ type: 'LineString', coordinates: [[-44, -19], [-44.1, -19.1]] })
  expect(s).toEqual([{ lat: -19, lon: -44 }, { lat: -19.1, lon: -44.1 }])
})

it('extractShape: MultiLineString pega o maior segmento', () => {
  const s = extractShape({ type: 'MultiLineString', coordinates: [[[0, 0], [1, 1]], [[0, 0], [1, 1], [2, 2], [3, 3]]] })
  expect(s).toHaveLength(4)
})

it('extractShape: Polygon usa anel externo', () => {
  const s = extractShape({ type: 'Polygon', coordinates: [[[0, 0], [1, 0], [1, 1], [0, 0]]] })
  expect(s).toHaveLength(4)
})

it('extractShape: Point retorna null', () => {
  expect(extractShape({ type: 'Point', coordinates: [0, 0] })).toBeNull()
})

it('as silhuetas desenhadas à mão têm densidade pra sair lisas', () => {
  // o traçado é polilinha: poucos vértices viram facetas visíveis
  for (const name of ['Tênis', 'Joinha', 'Não curti']) {
    expect(SHAPES[name].length, name).toBeGreaterThan(80)
  }
})

it('Não curti é a joinha girada 180°, não espelhada', () => {
  // espelhar só em Y inverteria a mão, trocando direita por esquerda
  const up = SHAPES['Joinha']
  const down = SHAPES['Não curti']
  expect(down).toHaveLength(up.length)
  for (let i = 0; i < up.length; i++) {
    expect(down[i].x).toBeCloseTo(1 - up[i].x, 10)
    expect(down[i].y).toBeCloseTo(1 - up[i].y, 10)
  }
})

it('todas as formas: 0-1, fechadas, >=8 pontos', () => {
  for (const [name, pts] of Object.entries(SHAPES)) {
    expect(pts.length, name).toBeGreaterThanOrEqual(8)
    for (const p of pts) {
      expect(p.x, name).toBeGreaterThanOrEqual(0); expect(p.x, name).toBeLessThanOrEqual(1)
      expect(p.y, name).toBeGreaterThanOrEqual(0); expect(p.y, name).toBeLessThanOrEqual(1)
    }
    expect(pts[0], name).toEqual(pts[pts.length - 1])
  }
})
