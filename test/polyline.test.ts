import { decodePolyline } from '../src/lib/polyline'
import { parseActivityUrl } from '../src/lib/strava'

it('decodePolyline vetor oficial google', () => {
  const pts = decodePolyline('_p~iF~ps|U_ulLnnqC_mqNvxq`@')
  expect(pts).toHaveLength(3)
  expect(pts[0].lat).toBeCloseTo(38.5, 4)
  expect(pts[0].lon).toBeCloseTo(-120.2, 4)
  expect(pts[2].lat).toBeCloseTo(43.252, 3)
  expect(pts[2].lon).toBeCloseTo(-126.453, 3)
})

it('parseActivityUrl extrai id', () => {
  expect(parseActivityUrl('https://www.strava.com/activities/12345678901')).toBe('12345678901')
  expect(parseActivityUrl('strava.com/activities/999?share=abc')).toBe('999')
  expect(parseActivityUrl('https://example.com/foo')).toBeNull()
  expect(parseActivityUrl('texto qualquer')).toBeNull()
})
