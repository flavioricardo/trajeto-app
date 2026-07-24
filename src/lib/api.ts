import { LatLon } from './geo'

export type Place = { name: string; lat: number; lon: number; shape?: LatLon[] | null; linear?: boolean }

type GeoJson = { type: string; coordinates: unknown }

const toLatLon = (c: [number, number][]): LatLon[] => c.map(([lon, lat]) => ({ lat, lon }))

/** Extrai um traçado utilizável da geometria OSM do lugar (trilha, praça, pista). */
export function extractShape(g: GeoJson | undefined): LatLon[] | null {
  if (!g) return null
  const c = g.coordinates as never
  switch (g.type) {
    case 'LineString':
      return toLatLon(c)
    case 'MultiLineString': {
      const segs = c as [number, number][][]
      return toLatLon(segs.reduce((a, b) => (b.length > a.length ? b : a)))
    }
    case 'Polygon':
      return toLatLon((c as [number, number][][])[0])
    case 'MultiPolygon': {
      const rings = (c as [number, number][][][]).map(p => p[0])
      return toLatLon(rings.reduce((a, b) => (b.length > a.length ? b : a)))
    }
    default:
      return null
  }
}

export async function searchPlaces(q: string): Promise<Place[]> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=8&polygon_geojson=1&accept-language=pt-BR&q=${encodeURIComponent(q)}`
  const res = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error('Busca de local falhou')
  const data: { display_name: string; lat: string; lon: string; geojson?: GeoJson }[] = await res.json()
  return data.map(d => ({
    name: d.display_name,
    lat: Number(d.lat),
    lon: Number(d.lon),
    shape: extractShape(d.geojson),
    linear: d.geojson?.type === 'LineString' || d.geojson?.type === 'MultiLineString',
  }))
}

export async function fetchRoute(a: Place, b: Place): Promise<{ points: LatLon[]; distanceM: number; durationS: number }> {
  const url = `https://router.project-osrm.org/route/v1/foot/${a.lon},${a.lat};${b.lon},${b.lat}?overview=full&geometries=geojson`
  const res = await fetch(url)
  if (!res.ok) throw new Error('Cálculo de rota falhou')
  const data = await res.json()
  const route = data.routes?.[0]
  if (!route) throw new Error('Nenhuma rota encontrada entre os pontos')
  const points: LatLon[] = route.geometry.coordinates.map(([lon, lat]: [number, number]) => ({ lat, lon }))
  return { points, distanceM: route.distance, durationS: route.duration }
}
