import { Trace } from './geo'
import { RouteBox, StatElement, Style } from '../state'
import { Theme, Paint, paintOf } from './themes'
import { coverRect } from './photo'

type RenderState = {
  elements: StatElement[]
  route: Trace | null
  routeBox: RouteBox
  style: Style
  theme: Theme
  /** Foto de fundo já decodificada. Sem ela o PNG sai transparente, como sempre. */
  photo?: HTMLImageElement | null
}

/**
 * Desenha o overlay em canvas offscreen e retorna PNG transparente.
 * Todas as medidas derivam de % da largura — mesmo modelo do editor.
 */
export async function renderOverlay(state: RenderState, size: { w: number; h: number }): Promise<Blob> {
  const { elements, route, routeBox, style, theme, photo } = state
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

  // A foto entra primeiro, por baixo de tudo, com o mesmo recorte do editor.
  if (photo) {
    const { sx, sy, sw, sh } = coverRect(photo.naturalWidth, photo.naturalHeight, size.w, size.h)
    ctx.drawImage(photo, sx, sy, sw, sh, 0, 0, size.w, size.h)
  }

  /** Medidas do tema são % da largura do quadro. */
  const pct = (v: number) => (v / 100) * size.w
  const ink = (p: Paint) => paintOf(p, style.routeColor, style.textColor)

  if (route?.length) {
    const bx = (routeBox.x / 100) * size.w
    const by = (routeBox.y / 100) * size.h
    const bs = (routeBox.size / 100) * size.w
    const drawn = route
    const trace = (g: CanvasRenderingContext2D) => {
      g.beginPath()
      // moveTo por subcaminho mantém as partes soltas da forma separadas no PNG,
      // do mesmo jeito que no editor.
      for (const sub of drawn) {
        sub.forEach((p, i) => {
          const x = bx + p.x * bs
          const y = by + p.y * bs
          i === 0 ? g.moveTo(x, y) : g.lineTo(x, y)
        })
      }
      g.stroke()
    }

    // A pilha inteira vai num canvas próprio: o vazado precisa limpar todas as
    // camadas dentro dele (o miolo da letra não mostra a sombra de trás), e
    // fazer isso direto no canvas final furaria a foto.
    const off = document.createElement('canvas')
    off.width = size.w
    off.height = size.h
    const g = off.getContext('2d')!
    g.lineJoin = 'round'
    g.lineCap = 'round'

    for (const layer of theme.route) {
      g.save()
      g.strokeStyle = ink(layer.paint)
      g.lineWidth = pct(style.strokeWidth * layer.width)
      if (layer.ticks) {
        // Ponta reta, senão a redonda estica cada tracinho e fecha os vãos.
        g.lineCap = 'butt'
        g.setLineDash([pct(layer.ticks.length), pct(layer.ticks.gap)])
      }
      g.globalAlpha = layer.opacity ?? 1
      if (layer.glow) {
        g.shadowColor = ink(layer.glow.paint)
        g.shadowBlur = pct(layer.glow.blur)
      }
      // Rotação antes do deslocamento da camada, na mesma ordem do <g> do editor.
      if (theme.rotate) {
        const cx = bx + bs / 2
        const cy = by + bs / 2
        g.translate(cx, cy)
        g.rotate((theme.rotate * Math.PI) / 180)
        g.translate(-cx, -cy)
      }
      g.translate(pct(layer.dx ?? 0), pct(layer.dy ?? 0))
      trace(g)
      g.restore()
    }

    // Abre o miolo depois de tudo desenhado, igual à máscara do grupo no editor.
    if (theme.carve) {
      g.save()
      g.globalCompositeOperation = 'destination-out'
      g.lineWidth = pct(style.strokeWidth * theme.carve)
      if (theme.rotate) {
        const cx = bx + bs / 2
        const cy = by + bs / 2
        g.translate(cx, cy)
        g.rotate((theme.rotate * Math.PI) / 180)
        g.translate(-cx, -cy)
      }
      trace(g)
      g.restore()
    }

    ctx.drawImage(off, 0, 0)
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

  // Com foto não há transparência pra preservar, e JPEG sai muito menor que
  // PNG em imagem fotográfica. Sem foto, o PNG transparente é o produto.
  const [type, quality] = photo ? ['image/jpeg', 0.92] : ['image/png', undefined]
  return new Promise((resolve, reject) =>
    canvas.toBlob(b => (b ? resolve(b) : reject(new Error('Falha ao gerar a imagem'))), type as string, quality),
  )
}
