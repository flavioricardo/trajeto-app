export type LatLon = { lat: number; lon: number; ele?: number; time?: number }
export type Pt = { x: number; y: number }

const toRad = (d: number) => (d * Math.PI) / 180

export function haversine(a: LatLon, b: LatLon): number {
  const R = 6371000
  const dLat = toRad(b.lat - a.lat)
  const dLon = toRad(b.lon - a.lon)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

/** Normaliza pra caixa 0-1 preservando proporção, norte pra cima, centralizado. */
export function normalizePoints(pts: LatLon[]): Pt[] {
  const lats = pts.map(p => p.lat)
  const lons = pts.map(p => p.lon)
  const minLat = Math.min(...lats), maxLat = Math.max(...lats)
  const minLon = Math.min(...lons), maxLon = Math.max(...lons)
  const cosMid = Math.cos(toRad((minLat + maxLat) / 2))
  const w = (maxLon - minLon) * cosMid
  const h = maxLat - minLat
  const scale = Math.max(w, h) || 1
  const padX = (1 - w / scale) / 2
  const padY = (1 - h / scale) / 2
  return pts.map(p => ({
    x: ((p.lon - minLon) * cosMid) / scale + padX,
    y: (maxLat - p.lat) / scale + padY,
  }))
}

export function elevationGain(eles: number[]): number {
  let g = 0
  for (let i = 1; i < eles.length; i++) if (eles[i] > eles[i - 1]) g += eles[i] - eles[i - 1]
  return g
}

export function totalDistance(pts: LatLon[]): number {
  let d = 0
  for (let i = 1; i < pts.length; i++) d += haversine(pts[i - 1], pts[i])
  return d
}
