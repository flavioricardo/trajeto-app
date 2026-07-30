import { Trace } from './geo'
import { RouteBox, StatElement, Style } from '../state'
import { Theme, Paint, paintOf, themedTrace } from './themes'

type RenderState = {
  elements: StatElement[]
  route: Trace | null
  routeBox: RouteBox
  style: Style
  theme: Theme
}

/**
 * Desenha o overlay em canvas offscreen e retorna PNG transparente.
 * Todas as medidas derivam de % da largura — mesmo modelo do editor.
 */
export async function renderOverlay(state: RenderState, size: { w: number; h: number }): Promise<Blob> {
  const { elements, route, routeBox, style, theme } = state
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

  /** Medidas do tema são % da largura do quadro. */
  const pct = (v: number) => (v / 100) * size.w
  const ink = (p: Paint) => paintOf(p, style.routeColor, style.textColor)

  if (route?.length) {
    const bx = (routeBox.x / 100) * size.w
    const by = (routeBox.y / 100) * size.h
    const bs = (routeBox.size / 100) * size.w
    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'

    // Mesma função do editor: moldura e encolhimento não têm como divergir.
    const drawn = themedTrace(route, theme)
    const trace = () => {
      ctx.beginPath()
      // moveTo por subcaminho mantém as partes soltas da forma separadas no PNG,
      // do mesmo jeito que no editor.
      for (const sub of drawn) {
        sub.forEach((p, i) => {
          const x = bx + p.x * bs
          const y = by + p.y * bs
          i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
        })
      }
      ctx.stroke()
    }

    // Camadas de baixo pra cima: é o que dá extrusão, contorno e néon.
    for (const layer of theme.route) {
      ctx.save()
      ctx.strokeStyle = ink(layer.paint)
      ctx.lineWidth = pct(style.strokeWidth * layer.width)
      ctx.globalAlpha = layer.opacity ?? 1
      if (layer.glow) {
        ctx.shadowColor = ink(layer.glow.paint)
        ctx.shadowBlur = pct(layer.glow.blur)
      }
      if (layer.dash) {
        ctx.setLineDash(layer.dash.map(pct))
        ctx.lineDashOffset = pct(layer.dashOffset ?? 0)
      }
      // Rotação antes do deslocamento da camada, na mesma ordem do <g> do editor.
      if (theme.rotate) {
        const cx = bx + bs / 2
        const cy = by + bs / 2
        ctx.translate(cx, cy)
        ctx.rotate((theme.rotate * Math.PI) / 180)
        ctx.translate(-cx, -cy)
      }
      ctx.translate(pct(layer.dx ?? 0), pct(layer.dy ?? 0))
      trace()
      ctx.restore()
    }
  }

  ctx.textBaseline = 'top'
  const { outline, shadow } = theme.text
  for (const el of elements) {
    const x = (el.x / 100) * size.w
    const y = (el.y / 100) * size.h
    const applyShadow = () => {
      if (!shadow) return
      ctx.shadowColor = ink(shadow.paint)
      ctx.shadowOffsetX = pct(shadow.dx)
      ctx.shadowOffsetY = pct(shadow.dy)
      ctx.shadowBlur = pct(shadow.blur)
    }
    const clearShadow = () => {
      ctx.shadowColor = 'transparent'
      ctx.shadowOffsetX = ctx.shadowOffsetY = ctx.shadowBlur = 0
    }

    const draw = (text: string, ty: number, alpha: number) => {
      ctx.save()
      ctx.globalAlpha = alpha
      // Contorno primeiro e preenchimento por cima, igual ao paint-order do editor.
      // A largura não dobra: tanto -webkit-text-stroke quanto strokeText centram
      // o traço na letra, então metade fica pra fora nos dois.
      if (outline) {
        // A sombra acompanha só o contorno, que é a forma mais externa. Repetir
        // no preenchimento empilharia o brilho, e o text-shadow do editor
        // envolve o conjunto uma vez só.
        applyShadow()
        ctx.strokeStyle = ink(outline.paint)
        ctx.lineWidth = pct(outline.width)
        ctx.lineJoin = 'round'
        ctx.strokeText(text, x, ty)
        clearShadow()
      } else {
        applyShadow()
      }
      ctx.fillStyle = style.textColor
      ctx.fillText(text, x, ty)
      ctx.restore()
    }
    ctx.font = `${labelPx}px "${style.font}", sans-serif`
    draw(el.label, y, 0.85)
    ctx.font = `bold ${valuePx}px "${style.font}", sans-serif`
    draw(el.value, y + labelPx * 1.35, 1)
  }

  return new Promise((resolve, reject) =>
    canvas.toBlob(b => (b ? resolve(b) : reject(new Error('Falha ao gerar PNG'))), 'image/png'),
  )
}
