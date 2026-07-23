import { LatLon } from './geo'

export type Place = { name: string; lat: number; lon: number }

export async function searchPlaces(q: string): Promise<Place[]> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(q)}`
  const res = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error('Busca de local falhou')
  const data: { display_name: string; lat: string; lon: string }[] = await res.json()
  return data.map(d => ({ name: d.display_name, lat: Number(d.lat), lon: Number(d.lon) }))
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
