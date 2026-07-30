import { extractShape } from '../src/lib/api'
import { SHAPES, ACTIVITY_SHAPES, FUN_SHAPES } from '../src/lib/shapes'

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

it('toda forma tem subcaminhos usáveis, dentro de 0-1', () => {
  for (const [name, trace] of Object.entries(SHAPES)) {
    expect(trace.length, name).toBeGreaterThan(0)
    for (const sub of trace) {
      expect(sub.length, name).toBeGreaterThanOrEqual(2)
      for (const p of sub) {
        expect(p.x, name).toBeGreaterThanOrEqual(0); expect(p.x, name).toBeLessThanOrEqual(1)
        expect(p.y, name).toBeGreaterThanOrEqual(0); expect(p.y, name).toBeLessThanOrEqual(1)
      }
    }
  }
})

it('toda forma preenche o quadro no eixo maior', () => {
  // o gerador encaixa em 0-1 preservando proporção: um dos eixos tem que ir de ponta a ponta
  for (const [name, trace] of Object.entries(SHAPES)) {
    const pts = trace.flat()
    const spanX = Math.max(...pts.map(p => p.x)) - Math.min(...pts.map(p => p.x))
    const spanY = Math.max(...pts.map(p => p.y)) - Math.min(...pts.map(p => p.y))
    expect(Math.max(spanX, spanY), name).toBeCloseTo(1, 2)
  }
})

it('as partes soltas ficam soltas', () => {
  // cabeça e tronco do corredor, as duas rodas da bicicleta: se virassem um
  // subcaminho só, apareceria um risco ligando as partes
  expect(SHAPES['Corrida'].length).toBeGreaterThan(1)
  expect(SHAPES['Pedal'].length).toBeGreaterThan(1)
  expect(SHAPES['Não curti'].length).toBeGreaterThan(1)
})

it('nenhum subcaminho tem salto: cada um é um traço contínuo', () => {
  for (const [name, trace] of Object.entries(SHAPES)) {
    for (const sub of trace) {
      for (let i = 1; i < sub.length; i++) {
        const d = Math.hypot(sub[i].x - sub[i - 1].x, sub[i].y - sub[i - 1].y)
        expect(d, `${name} tem salto no traço`).toBeLessThan(0.15)
      }
    }
  }
})

it('modalidades e formas decorativas não se misturam', () => {
  const a = Object.keys(ACTIVITY_SHAPES)
  const f = Object.keys(FUN_SHAPES)
  expect(a.some(n => f.includes(n))).toBe(false)
  expect(Object.keys(SHAPES).sort()).toEqual([...a, ...f].sort())
})
