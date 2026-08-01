import { LatLon } from './geo'
import { decodePolyline } from './polyline'

export type StravaToken = {
  access_token: string
  refresh_token: string
  expires_at: number
  athlete: { id: number; firstname?: string }
}

export type ImportKind = 'activity' | 'route' | 'segment'

export type ImportResult = {
  kind: ImportKind
  name: string
  points: LatLon[]
  distanceM: number
  /** Tempo real, só atividade tem. */
  durationS?: number
  /** Tempo estimado pelo Strava, só rota tem. */
  estimatedS?: number
  gainM?: number
  /** Modalidade do Strava (Run, Ride, WeightTraining…), decide pace vs velocidade. */
  sportType?: string
  hrAvg?: number
  hrMax?: number
  calories?: number
  /** Esforço relativo do Strava. */
  effort?: number
  wattsAvg?: number
  cadenceAvg?: number
}

const API = 'https://www.strava.com/api/v3'

/**
 * O que o usuário colou. O link curto não dá pra resolver aqui: `strava.app.link`
 * é deep link do Branch e não manda CORS, então quem segue o redirect é o servidor.
 */
export type ActivityRef = { kind: 'id'; id: string } | { kind: 'short'; url: string }

export function parseActivityUrl(input: string): ActivityRef | null {
  const s = input.trim()
  if (!s) return null
  // id solto, colado direto da URL
  if (/^\d{6,}$/.test(s)) return { kind: 'id', id: s }
  // aceita com ou sem protocolo, com www, com sufixo (/overview) e com query
  const m = s.match(/strava\.com\/activities\/(\d+)/i)
  if (m) return { kind: 'id', id: m[1] }
  const short = s.match(/^(?:https?:\/\/)?(strava\.app\.link\/[\w-]+)/i)
  if (short) return { kind: 'short', url: `https://${short[1]}` }
  return null
}

/**
 * Modalidade do Strava → forma do app. Serve pra atividade sem mapa (musculação,
 * yoga, esteira) ter o que desenhar no lugar do traçado que ela não tem.
 */
export const SPORT_SHAPE: Record<string, string> = {
  Run: 'Corrida', VirtualRun: 'Corrida', TrailRun: 'Trilha',
  Ride: 'Pedal', VirtualRide: 'Pedal', MountainBikeRide: 'Pedal', GravelRide: 'Pedal', EBikeRide: 'Pedal',
  Swim: 'Natação',
  Walk: 'Caminhada', Hike: 'Trilha',
  WeightTraining: 'Musculação', Workout: 'Musculação', Crossfit: 'Musculação', Elliptical: 'Musculação',
  Yoga: 'Yoga', Pilates: 'Yoga',
  Skateboard: 'Skate',
  Kayaking: 'Remo', Rowing: 'Remo', Canoeing: 'Remo', StandUpPaddling: 'Remo',
  AlpineSki: 'Esqui', BackcountrySki: 'Esqui', NordicSki: 'Esqui', Snowboard: 'Esqui',
  Soccer: 'Futebol',
  Sail: 'Vela', Windsurf: 'Vela', Kitesurf: 'Vela',
  Golf: 'Caminhada',
}

async function get<T>(path: string, token: string): Promise<T> {
  const res = await fetch(`${API}${path}`, { headers: { Authorization: `Bearer ${token}` } })
  if (res.status === 401) throw new Error('err.stravaExpired')
  if (res.status === 404) throw new Error('err.stravaNotFound')
  if (!res.ok) throw new Error('err.strava')
  return res.json()
}

export async function getActivity(id: string, token: string): Promise<ImportResult> {
  type A = {
    name: string
    distance: number
    moving_time: number
    total_elevation_gain: number
    sport_type?: string
    type?: string
    average_heartrate?: number
    max_heartrate?: number
    calories?: number
    suffer_score?: number
    average_watts?: number
    average_cadence?: number
    map?: { polyline?: string; summary_polyline?: string }
  }
  const a = await get<A>(`/activities/${id}`, token)
  const encoded = a.map?.polyline ?? a.map?.summary_polyline
  return {
    kind: 'activity',
    name: a.name,
    // Sem mapa não é erro: musculação, yoga e esteira não têm traçado, mas têm
    // dados. Quem chama decide o que desenhar no lugar.
    points: encoded ? decodePolyline(encoded) : [],
    distanceM: a.distance,
    durationS: a.moving_time,
    gainM: a.total_elevation_gain,
    sportType: a.sport_type ?? a.type,
    hrAvg: a.average_heartrate,
    hrMax: a.max_heartrate,
    calories: a.calories,
    effort: a.suffer_score,
    wattsAvg: a.average_watts,
    cadenceAvg: a.average_cadence,
  }
}

/** Resolve link curto pelo serverless: o navegador esbarra em CORS. */
export async function resolveShortLink(url: string): Promise<string> {
  const res = await fetch(`/api/strava-resolve?url=${encodeURIComponent(url)}`)
  const data = await res.json().catch(() => ({}))
  if (!res.ok || !data.id) throw new Error(data.error ?? 'err.stravaShortLink')
  return String(data.id)
}

export async function listRoutes(athleteId: number, token: string): Promise<ImportResult[]> {
  type R = { name: string; distance: number; elevation_gain: number; estimated_moving_time?: number; map: { summary_polyline?: string } }
  const routes = await get<R[]>(`/athletes/${athleteId}/routes?per_page=30`, token)
  return routes
    .filter(r => r.map.summary_polyline)
    .map(r => ({
      kind: 'route' as const,
      name: r.name,
      points: decodePolyline(r.map.summary_polyline!),
      distanceM: r.distance,
      estimatedS: r.estimated_moving_time,
      gainM: r.elevation_gain,
    }))
}

export async function exploreSegments(lat: number, lon: number, token: string): Promise<ImportResult[]> {
  const d = 0.05
  const bounds = `${lat - d},${lon - d},${lat + d},${lon + d}`
  type S = { segments: { name: string; distance: number; elev_difference: number; points: string }[] }
  const data = await get<S>(`/segments/explore?bounds=${bounds}&activity_type=running`, token)
  return data.segments.map(s => ({ kind: 'segment' as const, name: s.name, points: decodePolyline(s.points), distanceM: s.distance, gainM: s.elev_difference }))
}
