import { useRef } from 'react'
import { useAtom, useAtomValue } from 'jotai'
import { presetAtom, routeAtom, routeBoxAtom, elementsAtom, styleAtom, StatElement } from '../state'
import { useDrag, clamp } from './useDrag'

export default function EditorCanvas() {
  const preset = useAtomValue(presetAtom)
  const route = useAtomValue(routeAtom)
  const elements = useAtomValue(elementsAtom)
  const ref = useRef<HTMLDivElement>(null)

  return (
    <div className="canvas-wrap">
      <div ref={ref} className={`editor ${preset}`} data-testid="editor">
        {route && <RouteBoxEl containerRef={ref} />}
        {elements.map(el => (
          <StatBlock key={el.id} el={el} containerRef={ref} />
        ))}
        {!route && elements.length === 0 && (
          <p className="editor-empty">Carregue um GPX ou monte a rota abaixo. Arraste tudo pra posicionar.</p>
        )}
      </div>
    </div>
  )
}

function RouteBoxEl({ containerRef }: { containerRef: React.RefObject<HTMLDivElement | null> }) {
  const route = useAtomValue(routeAtom)!
  const [box, setBox] = useAtom(routeBoxAtom)
  const style = useAtomValue(styleAtom)
  const drag = useDrag(containerRef, (dx, dy) =>
    setBox(b => ({ ...b, x: clamp(b.x + dx, -20, 100), y: clamp(b.y + dy, -20, 100) })),
  )
  const resize = useDrag(containerRef, dx => setBox(b => ({ ...b, size: clamp(b.size + dx, 15, 140) })))

  const d = route.map((p, i) => `${i === 0 ? 'M' : 'L'}${(p.x * 100).toFixed(2)} ${(p.y * 100).toFixed(2)}`).join(' ')

  return (
    <div
      className="draggable route-box"
      style={{ left: `${box.x}%`, top: `${box.y}%`, width: `${box.size}%`, aspectRatio: '1' }}
      tabIndex={0}
      aria-label="Rota — arraste pra mover"
      {...drag}
    >
      <svg viewBox="0 0 100 100">
        <path
          className="route-path"
          d={d}
          fill="none"
          stroke={style.routeColor}
          strokeWidth={style.strokeWidth * 1.4}
          strokeLinejoin="round"
          strokeLinecap="round"
          pathLength={100}
          strokeDasharray={100}
          strokeDashoffset={100}
        />
      </svg>
      <span
        className="resize"
        role="slider"
        aria-label="Redimensionar rota"
        aria-valuenow={Math.round(box.size)}
        onPointerDown={e => { e.stopPropagation(); resize.onPointerDown(e) }}
        onPointerMove={resize.onPointerMove}
        onPointerUp={resize.onPointerUp}
      >⤡</span>
    </div>
  )
}

function StatBlock({ el, containerRef }: { el: StatElement; containerRef: React.RefObject<HTMLDivElement | null> }) {
  const [, setElements] = useAtom(elementsAtom)
  const style = useAtomValue(styleAtom)
  const drag = useDrag(containerRef, (dx, dy) =>
    setElements(els => els.map(e => (e.id === el.id ? { ...e, x: clamp(e.x + dx, 0, 95), y: clamp(e.y + dy, 0, 95) } : e))),
  )
  const update = (patch: Partial<StatElement>) =>
    setElements(els => els.map(e => (e.id === el.id ? { ...e, ...patch } : e)))

  return (
    <div
      className="draggable stat"
      style={{ left: `${el.x}%`, top: `${el.y}%`, color: style.textColor, fontFamily: `'${style.font}', sans-serif` }}
      tabIndex={0}
      {...drag}
    >
      <span
        className="label"
        style={{ fontSize: 'clamp(10px, 3.2cqw, 16px)' }}
        contentEditable
        suppressContentEditableWarning
        onBlur={e => update({ label: e.currentTarget.textContent ?? '' })}
        onPointerDown={e => e.stopPropagation()}
      >{el.label}</span>
      <span
        className="value"
        style={{ fontSize: 'clamp(20px, 7.5cqw, 40px)' }}
        contentEditable
        suppressContentEditableWarning
        onBlur={e => update({ value: e.currentTarget.textContent ?? '' })}
        onPointerDown={e => e.stopPropagation()}
      >{el.value}</span>
      <button
        className="remove"
        aria-label={`Remover ${el.label}`}
        onPointerDown={e => e.stopPropagation()}
        onClick={() => setElements(els => els.filter(e => e.id !== el.id))}
      >×</button>
    </div>
  )
}
