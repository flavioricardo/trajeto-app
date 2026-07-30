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
  expect(statsFor(activity).map(s => s.label)).toEqual(['Distância', 'Tempo', 'Pace', 'Elevação'])
  expect(statsFor(route).map(s => s.label)).toEqual([
    'Distância', 'Tempo previsto', 'Pace previsto', 'Elevação',
  ])
})

it('não inventa tempo quando a importação não tem nenhum', () => {
  const segment: ImportResult = { kind: 'segment', name: 'Subida', points: [], distanceM: 800, gainM: 40 }
  expect(statsFor(segment).map(s => s.label)).toEqual(['Distância', 'Elevação'])
})

it('traz as métricas de esforço quando a atividade tem', () => {
  const completa: ImportResult = {
    ...activity, hrAvg: 152.4, hrMax: 178, calories: 640.7, effort: 88.2,
  }
  const labels = statsFor(completa).map(s => s.label)
  expect(labels).toContain('FC média')
  expect(labels).toContain('Calorias')
  expect(labels).toContain('Esforço')
  expect(labels).toContain('FC máxima')

  const porLabel = Object.fromEntries(statsFor(completa).map(s => [s.label, s.value]))
  expect(porLabel['FC média']).toBe('152 bpm')
  expect(porLabel['Calorias']).toBe('641 kcal')
  expect(porLabel['Esforço']).toBe('88')
})

it('modalidade sem distância não emite distância nem ritmo', () => {
  // musculação e yoga vêm com distance 0: "0,00 km" seria ruído
  const musculacao: ImportResult = {
    kind: 'activity', name: 'Treino de força', points: [], distanceM: 0,
    durationS: 3600, sportType: 'WeightTraining', calories: 320,
  }
  const labels = statsFor(musculacao).map(s => s.label)
  expect(labels).toEqual(['Tempo', 'Calorias'])
})

it('o ritmo sai na unidade da modalidade', () => {
  const base = { kind: 'activity' as const, name: 'x', points: [], distanceM: 20000, durationS: 3600 }
  const ritmo = (sportType: string) => statsFor({ ...base, sportType }).find(s => /Pace|Velocidade/.test(s.label))!

  // pedal se lê em km/h
  expect(ritmo('Ride')).toEqual({ label: 'Velocidade', value: '20,0 km/h' })
  // corrida em minutos por quilômetro
  expect(ritmo('Run').label).toBe('Pace')
  expect(ritmo('Run').value).toContain('/km')
  // natação por 100 m, que é como a piscina mede
  expect(ritmo('Swim').value).toContain('/100m')
})

it('elevação zero não vira dado: indoor não tem subida', () => {
  const esteira: ImportResult = {
    kind: 'activity', name: 'Esteira', points: [], distanceM: 5000,
    durationS: 1800, gainM: 0, sportType: 'Run',
  }
  expect(statsFor(esteira).map(s => s.label)).not.toContain('Elevação')
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
