import { haversine, normalizePoints, elevationGain, totalDistance } from '../src/lib/geo'

it('haversine BH->SP ~490km', () => {
  const d = haversine({ lat: -19.9167, lon: -43.9345 }, { lat: -23.5505, lon: -46.6333 })
  expect(d).toBeGreaterThan(480_000)
  expect(d).toBeLessThan(510_000)
})

it('normalize fits 0-1, norte pra cima', () => {
  const pts = normalizePoints([{ lat: 0, lon: 0 }, { lat: 1, lon: 1 }, { lat: 0, lon: 1 }])
  for (const p of pts) {
    expect(p.x).toBeGreaterThanOrEqual(0); expect(p.x).toBeLessThanOrEqual(1)
    expect(p.y).toBeGreaterThanOrEqual(0); expect(p.y).toBeLessThanOrEqual(1)
  }
  expect(pts[0].y).toBeGreaterThan(pts[1].y)
})

it('elevationGain soma so deltas positivos', () => {
  expect(elevationGain([600, 650, 620, 700])).toBe(130)
})

it('totalDistance acumula', () => {
  const d = totalDistance([{ lat: 0, lon: 0 }, { lat: 0, lon: 0.01 }, { lat: 0, lon: 0.02 }])
  expect(d).toBeGreaterThan(2000); expect(d).toBeLessThan(2400)
})
