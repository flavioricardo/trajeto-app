import { LatLon } from './geo'

/** Decodifica polyline codificada (formato Google, usado pelo Strava). */
export function decodePolyline(encoded: string): LatLon[] {
  const pts: LatLon[] = []
  let index = 0, lat = 0, lon = 0
  while (index < encoded.length) {
    for (const which of [0, 1] as const) {
      let result = 0, shift = 0, b: number
      do {
        b = encoded.charCodeAt(index++) - 63
        result |= (b & 0x1f) << shift
        shift += 5
      } while (b >= 0x20)
      const delta = result & 1 ? ~(result >> 1) : result >> 1
      if (which === 0) lat += delta
      else lon += delta
    }
    pts.push({ lat: lat / 1e5, lon: lon / 1e5 })
  }
  return pts
}
