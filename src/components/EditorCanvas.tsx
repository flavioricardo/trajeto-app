import { useRef } from 'react'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import {
  presetAtom, routeAtom, routeBoxAtom, elementsAtom, styleAtom, guidesAtom, themeAtom, photoAtom, StatElement,
} from '../state'
import { useDrag, clamp } from './useDrag'
import { snapTo, CANVAS_TARGETS } from '../lib/guides'
import { Theme, themeById, paintOf } from '../lib/themes'
import { IconResize, IconX, IconMove } from './icons'
import { useT } from '../i18n'

/** Controles do canvas: mesmo tamanho nos três, e a espessura padrão do Feather. */
const ICON = 12
const ICON_STROKE = 2

/** Limites do tamanho da rota, em % da largura do quadro. */
const SIZE_MIN = 15
const SIZE_MAX = 140

export default function EditorCanvas() {
  const preset = useAtomValue(presetAtom)
  const route = useAtomValue(routeAtom)
  const elements = useAtomValue(elementsAtom)
  const guides = useAtomValue(guidesAtom)
  const photo = useAtomValue(photoAtom)
  const t = useT()
  const ref = useRef<HTMLDivElement>(null)

  return (
    <div className="canvas-wrap">
      <div ref={ref} className={`editor ${preset} ${photo ? 'has-photo' : ''}`} data-testid="editor">
        {photo && <img className="photo" src={photo.url} alt="" aria-hidden="true" data-testid="photo" />}
        {route && <RouteBoxEl containerRef={ref} />}
        {elements.map(el => (
          <StatBlock key={el.id} el={el} containerRef={ref} />
        ))}
        {guides.x != null && (
          <div className="guide guide-v" style={{ left: `${guides.x}%` }} data-testid="guide-v" />
        )}
        {guides.y != null && (
          <div className="guide guide-h" style={{ top: `${guides.y}%` }} data-testid="guide-h" />
        )}
        {!route && elements.length === 0 && (
          <p className="editor-empty">{t('canvas.empty')}</p>
        )}
      </div>
    </div>
  )
}

/**
 * Setas movem o elemento em foco.
 *
 * Sem isso o quadro é só do mouse: dá pra focar cada item pelo teclado e não
 * dá pra posicionar nenhum, que é a interação central do app.
 *
 * Aqui não tem encaixe. O passo é menor que o limiar das guias, então o ímã
 * puxaria de volta a cada tecla e prenderia o item no alvo — o mesmo problema
 * que o arrasto resolve guardando a posição livre à parte. Seta é ajuste fino;
 * quem quer alinhar usa o arrasto.
 */
function useNudge(commit: (dx: number, dy: number) => void) {
  return (e: React.KeyboardEvent) => {
    // Só quando o foco está no bloco. Dentro dele há texto editável, e lá as
    // setas são do cursor.
    if (e.target !== e.currentTarget) return
    const passo = e.shiftKey ? 5 : 1
    const d: Record<string, [number, number]> = {
      ArrowLeft: [-passo, 0], ArrowRight: [passo, 0], ArrowUp: [0, -passo], ArrowDown: [0, passo],
    }
    const mov = d[e.key]
    if (!mov) return
    e.preventDefault()
    commit(mov[0], mov[1])
  }
}

/**
 * Arrasto que gruda nas guias de alinhamento.
 *
 * A posição livre fica num ref à parte: aplicar o delta em cima do valor já
 * encaixado prenderia o elemento no alvo, porque cada pointermove sozinho
 * costuma andar menos que o limiar de encaixe.
 */
function useSnapDrag(
  containerRef: React.RefObject<HTMLDivElement | null>,
  current: () => { x: number; y: number },
  targets: () => { x: number[]; y: number[] },
  bounds: { min: number; max: number },
  commit: (x: number, y: number) => void,
) {
  const raw = useRef<{ x: number; y: number } | null>(null)
  const setGuides = useSetAtom(guidesAtom)

  return useDrag(
    containerRef,
    (dx, dy) => {
      const base = raw.current ?? current()
      const free = {
        x: clamp(base.x + dx, bounds.min, bounds.max),
        y: clamp(base.y + dy, bounds.min, bounds.max),
      }
      raw.current = free
      const t = targets()
      const x = snapTo(free.x, t.x)
      const y = snapTo(free.y, t.y)
      setGuides({ x: x.guide, y: y.guide })
      commit(x.value, y.value)
    },
    () => {
      raw.current = null
      setGuides({ x: null, y: null })
    },
  )
}

function RouteBoxEl({ containerRef }: { containerRef: React.RefObject<HTMLDivElement | null> }) {
  const route = useAtomValue(routeAtom)!
  const [box, setBox] = useAtom(routeBoxAtom)
  const elements = useAtomValue(elementsAtom)
  const style = useAtomValue(styleAtom)
  const theme = themeById(useAtomValue(themeAtom))
  const t = useT()

  const drag = useSnapDrag(
    containerRef,
    () => box,
    () => ({
      x: [...CANVAS_TARGETS, ...elements.map(e => e.x)],
      y: [...CANVAS_TARGETS, ...elements.map(e => e.y)],
    }),
    { min: -20, max: 100 },
    (x, y) => setBox(b => ({ ...b, x, y })),
  )
  const resize = useDrag(containerRef, dx => setBox(b => ({ ...b, size: clamp(b.size + dx, 15, 140) })))
  const nudge = useNudge((dx, dy) => setBox(b => ({
    ...b,
    x: clamp(b.x + dx, -20, 100),
    y: clamp(b.y + dy, -20, 100),
  })))

  /** O controle de tamanho é um slider: teclado tem que mexer nele igual ao mouse. */
  const resizeKeys = (e: React.KeyboardEvent) => {
    const passo = e.shiftKey ? 10 : 2
    const d: Record<string, number> = {
      ArrowLeft: -passo, ArrowDown: -passo, ArrowRight: passo, ArrowUp: passo,
    }
    const alvo = e.key === 'Home' ? SIZE_MIN : e.key === 'End' ? SIZE_MAX : null
    if (alvo == null && d[e.key] == null) return
    e.preventDefault()
    e.stopPropagation()
    setBox(b => ({ ...b, size: alvo ?? clamp(b.size + d[e.key], SIZE_MIN, SIZE_MAX) }))
  }

  // As medidas do tema e da espessura são % da largura do quadro; o viewBox aqui
  // são 100 unidades da largura da caixa. Converter mantém editor e PNG iguais —
  // antes havia um fator fixo 1.4, que só batia com a caixa no tamanho padrão.
  const toBox = 100 / box.size

  // Um subcaminho por parte solta da forma: a cabeça do corredor não pode ficar
  // ligada ao tronco por um risco.
  const d = route
    .map(sub => sub.map((p, i) => `${i === 0 ? 'M' : 'L'}${(p.x * 100).toFixed(2)} ${(p.y * 100).toFixed(2)}`).join(' '))
    .join(' ')

  return (
    <div
      className="draggable route-box"
      style={{ left: `${box.x}%`, top: `${box.y}%`, width: `${box.size}%`, aspectRatio: '1' }}
      tabIndex={0}
      aria-label={t('canvas.routeAria')}
      onKeyDown={nudge}
      {...drag}
    >
      <svg viewBox="0 0 100 100">
        <defs>
          {theme.route.map((l, i) =>
            l.glow ? (
              <filter key={i} id={`glow-${i}`} x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow
                  dx="0"
                  dy="0"
                  stdDeviation={(l.glow.blur * toBox) / 2}
                  floodColor={paintOf(l.glow.paint, style.routeColor, style.textColor)}
                />
              </filter>
            ) : null,
          )}
          {/* A camada riscada usa o strokeDasharray pros tracinhos, então não sobra
              dasharray pra animação de desenho: ela vem desta máscara, um traço
              largo que se revela ao longo da rota. */}
          {theme.route.some(l => l.ticks) ? (
            <mask id="reveal">
              <path
                className="route-reveal"
                d={d}
                fill="none"
                stroke="#fff"
                strokeWidth={style.strokeWidth * toBox * 3}
                strokeLinejoin="round"
                strokeLinecap="round"
                pathLength={100}
                strokeDasharray={100}
                strokeDashoffset={100}
              />
            </mask>
          ) : null}
          {/* Vazado: branco mostra, preto esconde. Vale pro grupo todo, porque o
              miolo da letra fica limpo também da hachura que está por baixo. */}
          {theme.carve ? (
            <mask id="carve">
              <rect x="-100" y="-100" width="300" height="300" fill="#fff" />
              <path d={d} fill="none" stroke="#000" strokeWidth={style.strokeWidth * toBox * theme.carve} strokeLinejoin="round" strokeLinecap="round" />
            </mask>
          ) : null}
        </defs>
        <g transform={theme.rotate ? `rotate(${theme.rotate} 50 50)` : undefined} mask={theme.carve ? 'url(#carve)' : undefined}>
          {theme.route.map((l, i) => (
            <path
              key={i}
              className="route-path"
              d={d}
              fill="none"
              stroke={paintOf(l.paint, style.routeColor, style.textColor)}
              strokeWidth={style.strokeWidth * toBox * l.width}
              strokeLinejoin="round"
              // Ponta reta no risco: a redonda esticaria cada tracinho até fechar
              // os vãos, num traço grosso desses.
              strokeLinecap={l.ticks ? 'butt' : 'round'}
              opacity={l.opacity}
              filter={l.glow ? `url(#glow-${i})` : undefined}
              mask={l.ticks ? 'url(#reveal)' : undefined}
              transform={l.dx || l.dy ? `translate(${(l.dx ?? 0) * toBox} ${(l.dy ?? 0) * toBox})` : undefined}
              pathLength={l.ticks ? undefined : 100}
              strokeDasharray={l.ticks ? `${l.ticks.length * toBox} ${l.ticks.gap * toBox}` : 100}
              strokeDashoffset={l.ticks ? undefined : 100}
            />
          ))}
        </g>
      </svg>
      <span className="grab" aria-hidden="true"><IconMove size={ICON} strokeWidth={ICON_STROKE} /></span>
      <span
        className="resize"
        role="slider"
        tabIndex={0}
        aria-label={t('canvas.resizeAria')}
        aria-valuemin={SIZE_MIN}
        aria-valuemax={SIZE_MAX}
        aria-valuenow={Math.round(box.size)}
        onKeyDown={resizeKeys}
        onPointerDown={e => { e.stopPropagation(); resize.onPointerDown(e) }}
        onPointerMove={resize.onPointerMove}
        onPointerUp={resize.onPointerUp}
      ><IconResize size={ICON} strokeWidth={ICON_STROKE} /></span>
    </div>
  )
}

/**
 * O tema mede em % da largura do quadro, e `cqw` é exatamente isso: o editor
 * declara `container-type: inline-size`. Por isso o texto sai igual no PNG.
 */
function textCss(theme: Theme, routeColor: string, textColor: string): React.CSSProperties {
  const css: React.CSSProperties = {}
  const { outline, shadow } = theme.text
  if (outline) {
    css.WebkitTextStrokeWidth = `${outline.width}cqw`
    css.WebkitTextStrokeColor = paintOf(outline.paint, routeColor, textColor)
    css.paintOrder = 'stroke fill'
  }
  if (shadow) {
    const c = paintOf(shadow.paint, routeColor, textColor)
    css.textShadow = `${shadow.dx}cqw ${shadow.dy}cqw ${shadow.blur}cqw ${c}`
  }
  return css
}

function StatBlock({ el, containerRef }: { el: StatElement; containerRef: React.RefObject<HTMLDivElement | null> }) {
  const [elements, setElements] = useAtom(elementsAtom)
  const route = useAtomValue(routeAtom)
  const box = useAtomValue(routeBoxAtom)
  const style = useAtomValue(styleAtom)
  const theme = themeById(useAtomValue(themeAtom))
  const t = useT()

  const drag = useSnapDrag(
    containerRef,
    () => el,
    () => {
      const others = elements.filter(e => e.id !== el.id)
      return {
        x: [...CANVAS_TARGETS, ...others.map(e => e.x), ...(route ? [box.x] : [])],
        y: [...CANVAS_TARGETS, ...others.map(e => e.y), ...(route ? [box.y] : [])],
      }
    },
    { min: 0, max: 95 },
    (x, y) => setElements(els => els.map(e => (e.id === el.id ? { ...e, x, y } : e))),
  )
  const nudge = useNudge((dx, dy) =>
    setElements(els => els.map(e =>
      e.id === el.id ? { ...e, x: clamp(e.x + dx, 0, 95), y: clamp(e.y + dy, 0, 95) } : e)))
  const update = (patch: Partial<StatElement>) =>
    setElements(els => els.map(e => (e.id === el.id ? { ...e, ...patch } : e)))

  return (
    <div
      className="draggable stat"
      style={{
        left: `${el.x}%`,
        top: `${el.y}%`,
        color: style.textColor,
        fontFamily: `'${style.font}', sans-serif`,
        ...textCss(theme, style.routeColor, style.textColor),
      }}
      tabIndex={0}
      aria-label={`${el.label}. ${t('canvas.moveAria')}`}
      onKeyDown={nudge}
      {...drag}
    >
      <span
        className="label"
        style={{ fontSize: 'clamp(10px, 3.2cqw, 16px)' }}
        contentEditable
        suppressContentEditableWarning
        // Renomear na mão solta o rótulo do dicionário: dali em diante o texto
        // é do usuário, e trocar de idioma não mexe mais nele.
        onBlur={e => update({ label: e.currentTarget.textContent ?? '', key: undefined })}
      >{el.label}</span>
      <span
        className="value"
        style={{ fontSize: 'clamp(20px, 7.5cqw, 40px)' }}
        contentEditable
        suppressContentEditableWarning
        onBlur={e => update({ value: e.currentTarget.textContent ?? '' })}
      >{el.value}</span>
      <span className="grab" aria-hidden="true"><IconMove size={ICON} strokeWidth={ICON_STROKE} /></span>
      <button
        className="remove"
        aria-label={`${t('canvas.remove')} ${el.label}`}
        onPointerDown={e => e.stopPropagation()}
        onClick={() => setElements(els => els.filter(e => e.id !== el.id))}
      ><IconX size={ICON} strokeWidth={ICON_STROKE} /></button>
    </div>
  )
}
