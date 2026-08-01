import { Lang, T, htmlLang } from '../i18n'

/** Separador decimal e agrupamento saem do idioma escolhido, não do navegador. */
const nf = (lang: Lang, digits: number) =>
  new Intl.NumberFormat(htmlLang(lang), { minimumFractionDigits: digits, maximumFractionDigits: digits })

export function formatDistance(m: number, lang: Lang): string {
  return `${nf(lang, 2).format(m / 1000)} km`
}

export function formatDuration(s: number): string {
  const h = Math.floor(s / 3600)
  const m = Math.round((s % 3600) / 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

/** Quanto o tempo real ficou abaixo (−) ou acima (+) do previsto pela rota. */
export function formatDelta(estimatedS: number, actualS: number, t: T): string {
  const min = Math.round((actualS - estimatedS) / 60)
  if (min === 0) return t('stat.onTarget')
  return `${min < 0 ? '−' : '+'}${Math.abs(min)} min`
}

/** Velocidade média em km/h — leitura de quem pedala, não pace. */
export function formatSpeed(distanceM: number, durationS: number, lang: Lang): string {
  const kmh = distanceM / 1000 / (durationS / 3600)
  return `${nf(lang, 1).format(kmh)} km/h`
}

/** Pace de natação: por 100 m, que é como a piscina mede. */
export function formatSwimPace(distanceM: number, durationS: number): string {
  const secPer100 = durationS / (distanceM / 100)
  const min = Math.floor(secPer100 / 60)
  const sec = Math.round(secPer100 % 60)
  return `${min}'${String(sec).padStart(2, '0')}"/100m`
}

export function formatPace(distanceM: number, durationS: number): string {
  const secPerKm = durationS / (distanceM / 1000)
  const min = Math.floor(secPerKm / 60)
  const sec = Math.round(secPerKm % 60)
  return `${min}'${String(sec).padStart(2, '0')}"/km`
}
