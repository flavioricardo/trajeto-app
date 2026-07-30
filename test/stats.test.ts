import { statsFor, plannedVsActual } from '../src/lib/stats'
import { formatDelta } from '../src/lib/format'
import { ImportResult } from '../src/lib/strava'

const activity: ImportResult = {
  kind: 'activity', name: 'Corrida matinal', points: [], distanceM: 10000, durationS: 3480, gainM: 120,
}
const route: ImportResult = {
  kind: 'route', name: 'Volta da lagoa', points: [], distanceM: 10000, estimatedS: 3900, gainM: 118,
}

it('rotula o tempo da atividade como real e o da rota como previsto', () => {
  expect(statsFor(activity).map(s => s.label)).toEqual(['Distância', 'Tempo', 'Elevação', 'Pace'])
  expect(statsFor(route).map(s => s.label)).toEqual(['Distância', 'Tempo previsto', 'Elevação', 'Pace previsto'])
})

it('não inventa tempo quando a importação não tem nenhum', () => {
  const segment: ImportResult = { kind: 'segment', name: 'Subida', points: [], distanceM: 800, gainM: 40 }
  expect(statsFor(segment).map(s => s.label)).toEqual(['Distância', 'Elevação'])
})

it('cruza previsto com feito só quando os dois lados existem', () => {
  expect(plannedVsActual(route, activity)).toEqual({ label: 'vs. previsto', value: '−7 min' })
  expect(plannedVsActual(route, null)).toBeNull()
  expect(plannedVsActual(null, activity)).toBeNull()
  // segmento não tem estimativa, então não há cruzamento
  expect(plannedVsActual({ ...route, estimatedS: undefined }, activity)).toBeNull()
})

it('formata a diferença com sinal e trata o empate', () => {
  expect(formatDelta(3900, 3480)).toBe('−7 min')
  expect(formatDelta(3480, 3900)).toBe('+7 min')
  expect(formatDelta(3600, 3600)).toBe('no previsto')
})
