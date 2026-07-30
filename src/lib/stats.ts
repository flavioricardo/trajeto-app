import { ImportResult } from './strava'
import { formatDistance, formatDuration, formatPace, formatDelta } from './format'

export type StatSeed = { label: string; value: string }

/**
 * Estatísticas que uma importação rende sozinha. Rota só tem tempo estimado,
 * atividade só tem tempo real — o rótulo diz de qual dos dois veio.
 */
export function statsFor(r: ImportResult): StatSeed[] {
  const time = r.durationS ?? r.estimatedS
  const real = r.durationS != null
  const out: StatSeed[] = [{ label: 'Distância', value: formatDistance(r.distanceM) }]
  if (time) out.push({ label: real ? 'Tempo' : 'Tempo previsto', value: formatDuration(time) })
  if (r.gainM != null) out.push({ label: 'Elevação', value: `${Math.round(r.gainM)} m` })
  if (time) out.push({ label: real ? 'Pace' : 'Pace previsto', value: formatPace(r.distanceM, time) })
  return out
}

/**
 * O cruzamento: previsto pela rota contra feito na atividade.
 * Devolve null quando falta um dos dois lados.
 */
export function plannedVsActual(route?: ImportResult | null, activity?: ImportResult | null): StatSeed | null {
  if (!route?.estimatedS || !activity?.durationS) return null
  return { label: 'vs. previsto', value: formatDelta(route.estimatedS, activity.durationS) }
}
