import { LatLon, elevationGain, totalDistance } from './geo'

export type GpxStats = { distanceM: number; durationS?: number; gainM?: number }

export function parseGpx(xml: string): { points: LatLon[]; stats: GpxStats } {
  const doc = new DOMParser().parseFromString(xml, 'application/xml')
  const nodes = Array.from(doc.querySelectorAll('trkpt'))
  if (nodes.length === 0) throw new Error('err.gpxNoPoints')

  const points: LatLon[] = nodes.map(n => {
    const ele = n.querySelector('ele')?.textContent
    const time = n.querySelector('time')?.textContent
    return {
      lat: Number(n.getAttribute('lat')),
      lon: Number(n.getAttribute('lon')),
      ele: ele != null ? Number(ele) : undefined,
      time: time ? Date.parse(time) : undefined,
    }
  })

  const stats: GpxStats = { distanceM: totalDistance(points) }
  const times = points.map(p => p.time).filter((t): t is number => t != null)
  if (times.length >= 2) stats.durationS = (times[times.length - 1] - times[0]) / 1000
  const eles = points.map(p => p.ele).filter((e): e is number => e != null)
  if (eles.length >= 2) stats.gainM = elevationGain(eles)
  return { points, stats }
}
