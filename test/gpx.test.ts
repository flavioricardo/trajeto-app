import { parseGpx } from '../src/lib/gpx'

const GPX = `<?xml version="1.0"?>
<gpx><trk><trkseg>
<trkpt lat="-19.0" lon="-44.0"><ele>600</ele><time>2026-07-20T08:00:00Z</time></trkpt>
<trkpt lat="-19.001" lon="-44.0"><ele>650</ele><time>2026-07-20T08:10:00Z</time></trkpt>
<trkpt lat="-19.002" lon="-44.0"><ele>620</ele><time>2026-07-20T08:20:00Z</time></trkpt>
</trkseg></trk></gpx>`

it('parse extrai pontos e stats', () => {
  const { points, stats } = parseGpx(GPX)
  expect(points).toHaveLength(3)
  expect(stats.distanceM).toBeGreaterThan(200)
  expect(stats.durationS).toBe(1200)
  expect(stats.gainM).toBe(50)
})

it('gpx sem trkpt lanca erro', () => {
  expect(() => parseGpx('<gpx></gpx>')).toThrow('GPX sem trackpoints')
})
