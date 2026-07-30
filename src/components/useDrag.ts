import { useRef } from 'react'

/**
 * Drag por pointer events. Converte deltas de pixel em % do container
 * (mesma unidade do estado) e entrega ao chamador a cada movimento.
 */
export function useDrag(
  containerRef: React.RefObject<HTMLElement | null>,
  onMove: (dxPct: number, dyPct: number) => void,
  onEnd?: () => void,
) {
  const last = useRef<{ x: number; y: number } | null>(null)

  return {
    onPointerDown(e: React.PointerEvent) {
      ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
      last.current = { x: e.clientX, y: e.clientY }
    },
    onPointerMove(e: React.PointerEvent) {
      if (!last.current || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const dx = ((e.clientX - last.current.x) / rect.width) * 100
      const dy = ((e.clientY - last.current.y) / rect.height) * 100
      last.current = { x: e.clientX, y: e.clientY }
      onMove(dx, dy)
    },
    onPointerUp() {
      last.current = null
      onEnd?.()
    },
  }
}

export const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))
