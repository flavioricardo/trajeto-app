import { ImportResult } from './strava'
import { Key, Lang, T } from '../i18n'
import { formatDistance, formatDuration, formatPace, formatSpeed, formatSwimPace, formatDelta } from './format'

/**
 * O `key` viaja junto com o rótulo: é ele que permite reescrever o texto quando
 * o idioma muda, sem atropelar o que o usuário renomeou na mão.
 */
export type StatSeed = { key: Key; label: string; value: string }

/** Modalidades onde o ritmo se lê em km/h, não em minutos por quilômetro. */
const POR_VELOCIDADE = /^(Ride|VirtualRide|MountainBikeRide|GravelRide|EBikeRide|Velomobile|Handcycle|Skateboard|InlineSkate|AlpineSki|Snowboard|Kitesurf|Windsurf|Sail)$/

const seed = (key: Key, value: string, t: T): StatSeed => ({ key, label: t(key), value })

/** Ritmo no formato que a modalidade usa. */
function ritmo(r: ImportResult, time: number, real: boolean, lang: Lang, t: T): StatSeed | null {
  if (!r.distanceM) return null
  if (r.sportType === 'Swim') {
    return seed(real ? 'stat.pace' : 'stat.paceEstimated', formatSwimPace(r.distanceM, time), t)
  }
  if (r.sportType && POR_VELOCIDADE.test(r.sportType)) {
    return seed(real ? 'stat.speed' : 'stat.speedEstimated', formatSpeed(r.distanceM, time, lang), t)
  }
  return seed(real ? 'stat.pace' : 'stat.paceEstimated', formatPace(r.distanceM, time), t)
}

/**
 * Estatísticas que uma importação rende sozinha, em ordem de destaque.
 *
 * Tudo é condicional porque as modalidades divergem muito: musculação e yoga
 * não têm distância, indoor não tem elevação, e só quem usa cinta tem frequência.
 * Emitir zero seria pior que omitir.
 */
export function statsFor(r: ImportResult, lang: Lang, t: T): StatSeed[] {
  const time = r.durationS ?? r.estimatedS
  const real = r.durationS != null
  const out: StatSeed[] = []

  if (r.distanceM) out.push(seed('stat.distance', formatDistance(r.distanceM, lang), t))
  if (time) out.push(seed(real ? 'stat.time' : 'stat.timeEstimated', formatDuration(time), t))
  if (time) {
    const ritmoSeed = ritmo(r, time, real, lang, t)
    if (ritmoSeed) out.push(ritmoSeed)
  }
  if (r.gainM) out.push(seed('stat.elevation', `${Math.round(r.gainM)} m`, t))
  if (r.hrAvg) out.push(seed('stat.hrAvg', `${Math.round(r.hrAvg)} bpm`, t))
  if (r.calories) out.push(seed('stat.calories', `${Math.round(r.calories)} kcal`, t))
  if (r.effort) out.push(seed('stat.effort', String(Math.round(r.effort)), t))
  if (r.hrMax) out.push(seed('stat.hrMax', `${Math.round(r.hrMax)} bpm`, t))
  if (r.wattsAvg) out.push(seed('stat.power', `${Math.round(r.wattsAvg)} W`, t))
  if (r.cadenceAvg) out.push(seed('stat.cadence', `${Math.round(r.cadenceAvg)} rpm`, t))

  return out
}

/**
 * O cruzamento: previsto pela rota contra feito na atividade.
 * Devolve null quando falta um dos dois lados.
 */
export function plannedVsActual(route: ImportResult | null | undefined, activity: ImportResult | null | undefined, t: T): StatSeed | null {
  if (!route?.estimatedS || !activity?.durationS) return null
  return seed('stat.vsPlanned', formatDelta(route.estimatedS, activity.durationS, t), t)
}
