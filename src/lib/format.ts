const nf = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export function formatDistance(m: number): string {
  return `${nf.format(m / 1000)} km`
}

export function formatDuration(s: number): string {
  const h = Math.floor(s / 3600)
  const m = Math.round((s % 3600) / 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

export function formatPace(distanceM: number, durationS: number): string {
  const secPerKm = durationS / (distanceM / 1000)
  const min = Math.floor(secPerKm / 60)
  const sec = Math.round(secPerKm % 60)
  return `${min}'${String(sec).padStart(2, '0')}"/km`
}
