import { formatDistance, formatDuration, formatPace } from '../src/lib/format'

it('distancia pt-BR', () => expect(formatDistance(4850)).toBe('4,85 km'))
it('duracao h m', () => expect(formatDuration(4380)).toBe('1h 13m'))
it('duracao so m', () => expect(formatDuration(300)).toBe('5m'))
it('pace min/km', () => expect(formatPace(4850, 4380)).toBe(`15'03"/km`))
