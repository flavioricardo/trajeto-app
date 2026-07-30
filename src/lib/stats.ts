import { ImportResult } from './strava'
import { formatDistance, formatDuration, formatPace, formatSpeed, formatSwimPace, formatDelta } from './format'

export type StatSeed = { label: string; value: string }

/** Modalidades onde o ritmo se lê em km/h, não em minutos por quilômetro. */
const POR_VELOCIDADE = /^(Ride|VirtualRide|MountainBikeRide|GravelRide|EBikeRide|Velomobile|Handcycle|Skateboard|InlineSkate|AlpineSki|Snowboard|Kitesurf|Windsurf|Sail)$/

/** Ritmo no formato que a modalidade usa. */
function ritmo(r: ImportResult, time: number): StatSeed | null {
  if (!r.distanceM) return null
  if (r.sportType === 'Swim') return { label: 'Pace', value: formatSwimPace(r.distanceM, time) }
  if (r.sportType && POR_VELOCIDADE.test(r.sportType)) {
    return { label: 'Velocidade', value: formatSpeed(r.distanceM, time) }
  }
  return { label: 'Pace', value: formatPace(r.distanceM, time) }
}

/**
 * Estatísticas que uma importação rende sozinha, em ordem de destaque.
 *
 * Tudo é condicional porque as modalidades divergem muito: musculação e yoga
 * não têm distância, indoor não tem elevação, e só quem usa cinta tem frequência.
 * Emitir zero seria pior que omitir.
 */
export function statsFor(r: ImportResult): StatSeed[] {
  const time = r.durationS ?? r.estimatedS
  const real = r.durationS != null
  const out: StatSeed[] = []

  if (r.distanceM) out.push({ label: 'Distância', value: formatDistance(r.distanceM) })
  if (time) out.push({ label: real ? 'Tempo' : 'Tempo previsto', value: formatDuration(time) })
  if (time) {
    const ritmoSeed = ritmo(r, time)
    if (ritmoSeed) out.push(real ? ritmoSeed : { ...ritmoSeed, label: `${ritmoSeed.label} previsto` })
  }
  if (r.gainM) out.push({ label: 'Elevação', value: `${Math.round(r.gainM)} m` })
  if (r.hrAvg) out.push({ label: 'FC média', value: `${Math.round(r.hrAvg)} bpm` })
  if (r.calories) out.push({ label: 'Calorias', value: `${Math.round(r.calories)} kcal` })
  if (r.effort) out.push({ label: 'Esforço', value: String(Math.round(r.effort)) })
  if (r.hrMax) out.push({ label: 'FC máxima', value: `${Math.round(r.hrMax)} bpm` })
  if (r.wattsAvg) out.push({ label: 'Potência', value: `${Math.round(r.wattsAvg)} W` })
  if (r.cadenceAvg) out.push({ label: 'Cadência', value: `${Math.round(r.cadenceAvg)} rpm` })

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
