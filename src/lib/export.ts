import { Trace } from './geo'
import { RouteBox, StatElement, Style } from '../state'

type RenderState = {
  elements: StatElement[]
  route: Trace | null
  routeBox: RouteBox
  style: Style
}

/**
 * Desenha o overlay em canvas offscreen e retorna PNG transparente.
 * Todas as medidas derivam de % da largura — mesmo modelo do editor.
 */
export async function renderOverlay(state: RenderState, size: { w: number; h: number }): Promise<Blob> {
  const { elements, route, routeBox, style } = state
  const canvas = document.createElement('canvas')
  canvas.width = size.w
  canvas.height = size.h
  const ctx = canvas.getContext('2d')!

  const labelPx = size.w * 0.032
  const valuePx = size.w * 0.075
  await Promise.all([
    document.fonts.load(`${labelPx}px "${style.font}"`),
    document.fonts.load(`bold ${valuePx}px "${style.font}"`),
  ]).catch(() => {}) // fonte não carregou: canvas usa fallback

  if (route?.length) {
    const bx = (routeBox.x / 100) * size.w
    const by = (routeBox.y / 100) * size.h
    const bs = (routeBox.size / 100) * size.w
    ctx.strokeStyle = style.routeColor
    ctx.lineWidth = (style.strokeWidth / 100) * size.w
    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'
    ctx.beginPath()
    // moveTo por subcaminho mantém as partes soltas da forma separadas no PNG,
    // do mesmo jeito que no editor.
    for (const sub of route) {
      sub.forEach((p, i) => {
        const x = bx + p.x * bs
        const y = by + p.y * bs
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
      })
    }
    ctx.stroke()
  }

  ctx.fillStyle = style.textColor
  ctx.textBaseline = 'top'
  for (const el of elements) {
    const x = (el.x / 100) * size.w
    const y = (el.y / 100) * size.h
    ctx.font = `${labelPx}px "${style.font}", sans-serif`
    ctx.globalAlpha = 0.85
    ctx.fillText(el.label, x, y)
    ctx.globalAlpha = 1
    ctx.font = `bold ${valuePx}px "${style.font}", sans-serif`
    ctx.fillText(el.value, x, y + labelPx * 1.35)
  }

  return new Promise((resolve, reject) =>
    canvas.toBlob(b => (b ? resolve(b) : reject(new Error('Falha ao gerar PNG'))), 'image/png'),
  )
}
