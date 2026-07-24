import { LatLon } from './geo'
import { decodePolyline } from './polyline'

export type StravaToken = {
  access_token: string
  refresh_token: string
  expires_at: number
  athlete: { id: number; firstname?: string }
}

export type ImportResult = {
  name: string
  points: LatLon[]
  distanceM: number
  durationS?: number
  gainM?: number
}

const API = 'https://www.strava.com/api/v3'

export function parseActivityUrl(input: string): string | null {
  const m = input.match(/strava\.com\/activities\/(\d+)/)
  return m ? m[1] : null
}

async function get<T>(path: string, token: string): Promise<T> {
  const res = await fetch(`${API}${path}`, { headers: { Authorization: `Bearer ${token}` } })
  if (res.status === 401) throw new Error('Sessão do Strava expirou. Conecte de novo')
  if (res.status === 404) throw new Error('Não encontrado. A atividade é sua e está visível?')
  if (!res.ok) throw new Error('O Strava respondeu com erro')
  return res.json()
}

export async function getActivity(id: string, token: string): Promise<ImportResult> {
  type A = { name: string; distance: number; moving_time: number; total_elevation_gain: number; map: { polyline?: string; summary_polyline?: string } }
  const a = await get<A>(`/activities/${id}`, token)
  const encoded = a.map.polyline ?? a.map.summary_polyline
  if (!encoded) throw new Error('Essa atividade não tem mapa')
  return { name: a.name, points: decodePolyline(encoded), distanceM: a.distance, durationS: a.moving_time, gainM: a.total_elevation_gain }
}

export async function listRoutes(athleteId: number, token: string): Promise<ImportResult[]> {
  type R = { name: string; distance: number; elevation_gain: number; map: { summary_polyline?: string } }
  const routes = await get<R[]>(`/athletes/${athleteId}/routes?per_page=30`, token)
  return routes
    .filter(r => r.map.summary_polyline)
    .map(r => ({ name: r.name, points: decodePolyline(r.map.summary_polyline!), distanceM: r.distance, gainM: r.elevation_gain }))
}

export async function exploreSegments(lat: number, lon: number, token: string): Promise<ImportResult[]> {
  const d = 0.05
  const bounds = `${lat - d},${lon - d},${lat + d},${lon + d}`
  type S = { segments: { name: string; distance: number; elev_difference: number; points: string }[] }
  const data = await get<S>(`/segments/explore?bounds=${bounds}&activity_type=running`, token)
  return data.segments.map(s => ({ name: s.name, points: decodePolyline(s.points), distanceM: s.distance, gainM: s.elev_difference }))
}
