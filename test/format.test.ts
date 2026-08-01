import { formatDistance, formatDuration, formatPace, formatSpeed } from '../src/lib/format'

it('distancia pt-BR', () => expect(formatDistance(4850, 'pt')).toBe('4,85 km'))
it('distancia en usa ponto', () => expect(formatDistance(4850, 'en')).toBe('4.85 km'))
it('velocidade segue o idioma', () => {
  expect(formatSpeed(20000, 3600, 'pt')).toBe('20,0 km/h')
  expect(formatSpeed(20000, 3600, 'en')).toBe('20.0 km/h')
})
it('duracao h m', () => expect(formatDuration(4380)).toBe('1h 13m'))
it('duracao so m', () => expect(formatDuration(300)).toBe('5m'))
it('pace min/km', () => expect(formatPace(4850, 4380)).toBe(`15'03"/km`))
