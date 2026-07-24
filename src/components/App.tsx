import { useState } from 'react'
import { useAtom, useAtomValue } from 'jotai'
import EditorCanvas from './EditorCanvas'
import RouteSource from './RouteSource'
import {
  presetAtom, PRESETS, Preset, styleAtom, elementsAtom, newStat,
  routeAtom, routeBoxAtom,
} from '../state'
import { OVERLAY_FONTS, OverlayFont } from '../fonts'
import { renderOverlay } from '../lib/export'
import { IconPlus, IconDownload } from './icons'

export default function App() {
  return (
    <>
      <Header />
      <main className="app">
        <EditorCanvas />
        <RouteSource />
        <StatsPanel />
        <StylePanel />
      </main>
      <ExportBar />
    </>
  )
}

function Header() {
  return (
    <header className="header">
      <Contours />
      <h1 className="brand">Traje<em>t</em>o</h1>
      <p className="tagline">Sua rota vira overlay transparente pro story. Grátis e sem cadastro.</p>
    </header>
  )
}

/** Assinatura visual: curvas de nível geradas uma vez. */
function Contours() {
  const rings = [0, 10, 22, 36, 52]
  return (
    <svg className="contours" viewBox="0 0 400 90" preserveAspectRatio="xMaxYMid slice" aria-hidden="true">
      {rings.map(r => (
        <path
          key={r}
          d={`M ${300 - r} ${45} q ${8 + r} ${-30 - r} ${60 + r * 2} ${-8 - r} q ${40} ${18} ${30} ${40 + r}`}
          fill="none"
          stroke="var(--contour)"
          strokeWidth="1"
        />
      ))}
    </svg>
  )
}

function StatsPanel() {
  const [elements, setElements] = useAtom(elementsAtom)
  return (
    <section className="card">
      <h2>Estatísticas</h2>
      <p className="hint">Toque no texto pra editar. Arraste no quadro pra posicionar.</p>
      <div className="row" style={{ marginTop: 10 }}>
        <button className="btn" onClick={() => setElements(els => [...els, newStat('Título', 'valor')])}><IconPlus size={14} /> Adicionar stat</button>
        {elements.length > 0 && (
          <button className="btn" onClick={() => setElements([])}>Limpar tudo</button>
        )}
      </div>
    </section>
  )
}

function StylePanel() {
  const [style, setStyle] = useAtom(styleAtom)
  return (
    <section className="card">
      <h2>Estilo</h2>
      <div className="row">
        <div className="field">
          <label htmlFor="route-color">Cor da rota</label>
          <input id="route-color" type="color" value={style.routeColor}
            onChange={e => setStyle(s => ({ ...s, routeColor: e.target.value }))} />
        </div>
        <div className="field">
          <label htmlFor="text-color">Cor do texto</label>
          <input id="text-color" type="color" value={style.textColor}
            onChange={e => setStyle(s => ({ ...s, textColor: e.target.value }))} />
        </div>
        <div className="field">
          <label htmlFor="stroke">Traço: {style.strokeWidth.toFixed(1)}</label>
          <input id="stroke" type="range" min="0.4" max="3" step="0.2" value={style.strokeWidth}
            onChange={e => setStyle(s => ({ ...s, strokeWidth: Number(e.target.value) }))} />
        </div>
      </div>
      <div className="field">
        <label htmlFor="font">Fonte</label>
        <select id="font" value={style.font}
          onChange={e => setStyle(s => ({ ...s, font: e.target.value as OverlayFont }))}>
          {OVERLAY_FONTS.map(f => <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>)}
        </select>
      </div>
    </section>
  )
}

function ExportBar() {
  const [preset, setPreset] = useAtom(presetAtom)
  const elements = useAtomValue(elementsAtom)
  const route = useAtomValue(routeAtom)
  const routeBox = useAtomValue(routeBoxAtom)
  const style = useAtomValue(styleAtom)
  const [busy, setBusy] = useState(false)

  const doExport = async () => {
    setBusy(true)
    try {
      const size = PRESETS[preset]
      const blob = await renderOverlay({ elements, route, routeBox, style }, size)
      const file = new File([blob], `trajeto-${preset}.png`, { type: 'image/png' })
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file] }).catch(() => {})
      } else {
        const url = URL.createObjectURL(blob)
        const link = Object.assign(document.createElement('a'), { href: url, download: file.name })
        link.click()
        URL.revokeObjectURL(url)
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="export-bar">
      <div className="preset-toggle" role="group" aria-label="Formato">
        {(Object.keys(PRESETS) as Preset[]).map(p => (
          <button key={p} aria-pressed={preset === p} onClick={() => setPreset(p)}>
            {PRESETS[p].label}
          </button>
        ))}
      </div>
      <button className="btn primary" disabled={busy || (elements.length === 0 && !route)} onClick={doExport}>
        {busy ? 'Gerando…' : <><IconDownload size={15} /> Salvar PNG</>}
      </button>
    </div>
  )
}
