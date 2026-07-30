/**
 * Guias de alinhamento do editor. Tudo em % do quadro, mesma unidade do estado.
 */

/** Borda inicial e centro do quadro — os alvos que existem mesmo com um elemento só. */
export const CANVAS_TARGETS = [0, 50]

/** Distância máxima, em % do quadro, para o elemento grudar num alvo. */
export const SNAP_THRESHOLD = 1.2

export type Snapped = { value: number; guide: number | null }

/**
 * Gruda `v` no alvo mais próximo dentro do limiar.
 * Devolve o valor ajustado e onde desenhar a guia (null quando não houve encaixe).
 */
export function snapTo(v: number, targets: number[], threshold = SNAP_THRESHOLD): Snapped {
  let best: number | null = null
  let bestDist = Infinity
  for (const t of targets) {
    const d = Math.abs(t - v)
    if (d < bestDist) {
      bestDist = d
      best = t
    }
  }
  if (best == null || bestDist > threshold) return { value: v, guide: null }
  return { value: best, guide: best }
}
