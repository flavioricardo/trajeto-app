import { useRef } from 'react'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import {
  presetAtom, routeAtom, routeBoxAtom, elementsAtom, styleAtom, guidesAtom, themeAtom, photoAtom, StatElement,
} from '../state'
import { useDrag, clamp } from './useDrag'
import { snapTo, CANVAS_TARGETS } from '../lib/guides'
import { Theme, themeById, paintOf, themedTrace } from '../lib/themes'
import { IconResize, IconX, IconMove } from './icons'

/** Controles do canvas: mesmo tamanho nos três, e a espessura padrão do Feather. */
const ICON = 12
const ICON_STROKE = 2

export default function EditorCanvas() {
  const preset = useAtomValue(presetAtom)
  const route = useAtomValue(routeAtom)
  const elements = useAtomValue(elementsAtom)
  const guides = useAtomValue(guidesAtom)
  const photo = useAtomValue(photoAtom)
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
          <p className="editor-empty">Escolha a rota nas abas abaixo. Depois arraste cada item pra posicionar.</p>
        )}
      </div>
    </div>
  )
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

  // As medidas do tema e da espessura são % da largura do quadro; o viewBox aqui
  // são 100 unidades da largura da caixa. Converter mantém editor e PNG iguais —
  // antes havia um fator fixo 1.4, que só batia com a caixa no tamanho padrão.
  const toBox = 100 / box.size

  // Um subcaminho por parte solta da forma: a cabeça do corredor não pode ficar
  // ligada ao tronco por um risco. A moldura do tema entra como subcaminho também.
  const d = themedTrace(route, theme)
    .map(sub => sub.map((p, i) => `${i === 0 ? 'M' : 'L'}${(p.x * 100).toFixed(2)} ${(p.y * 100).toFixed(2)}`).join(' '))
    .join(' ')

  return (
    <div
      className="draggable route-box"
      style={{ left: `${box.x}%`, top: `${box.y}%`, width: `${box.size}%`, aspectRatio: '1' }}
      tabIndex={0}
      aria-label="Rota. Arraste pra mover"
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
        </defs>
        <g transform={theme.rotate ? `rotate(${theme.rotate} 50 50)` : undefined}>
          {theme.route.map((l, i) => (
            <path
              key={i}
              // A animação de desenhar usa o dasharray, então ela sai de cena
              // quando o tema tem tinta corroída — que também é dasharray.
              className={l.dash ? undefined : 'route-path'}
              d={d}
              fill="none"
              stroke={paintOf(l.paint, style.routeColor, style.textColor)}
              strokeWidth={style.strokeWidth * toBox * l.width}
              strokeLinejoin="round"
              // Ponta reta quando há corrosão: a arredondada avança meia espessura
              // além de cada traço e fecharia as lacunas num traço grosso.
              strokeLinecap={l.dash ? 'butt' : 'round'}
              opacity={l.opacity}
              filter={l.glow ? `url(#glow-${i})` : undefined}
              transform={l.dx || l.dy ? `translate(${(l.dx ?? 0) * toBox} ${(l.dy ?? 0) * toBox})` : undefined}
              {...(l.dash
                ? {
                    // dash é múltiplo da espessura da camada, então acompanha o
                    // controle de traço em vez de virar conta de colar.
                    strokeDasharray: l.dash.map(v => v * style.strokeWidth * l.width * toBox).join(' '),
                    strokeDashoffset: (l.dashOffset ?? 0) * style.strokeWidth * l.width * toBox,
                  }
                : { pathLength: 100, strokeDasharray: 100, strokeDashoffset: 100 })}
            />
          ))}
        </g>
      </svg>
      <span className="grab" aria-hidden="true"><IconMove size={ICON} strokeWidth={ICON_STROKE} /></span>
      <span
        className="resize"
        role="slider"
        aria-label="Redimensionar rota"
        aria-valuenow={Math.round(box.size)}
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
      {...drag}
    >
      <span
        className="label"
        style={{ fontSize: 'clamp(10px, 3.2cqw, 16px)' }}
        contentEditable
        suppressContentEditableWarning
        onBlur={e => update({ label: e.currentTarget.textContent ?? '' })}
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
        aria-label={`Remover ${el.label}`}
        onPointerDown={e => e.stopPropagation()}
        onClick={() => setElements(els => els.filter(e => e.id !== el.id))}
      ><IconX size={ICON} strokeWidth={ICON_STROKE} /></button>
    </div>
  )
}
