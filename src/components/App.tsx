import { useState } from 'react'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import EditorCanvas from './EditorCanvas'
import RouteSource from './RouteSource'
import StravaPanel from './StravaPanel'
import {
  presetAtom, PRESETS, Preset, styleAtom, elementsAtom, newStat,
  routeAtom, routeBoxAtom, themeAtom, photoAtom, photoInExportAtom, Photo,
} from '../state'
import { OVERLAY_FONTS, OverlayFont } from '../fonts'
import { renderOverlay } from '../lib/export'
import { THEMES, Theme, themeById } from '../lib/themes'
import { loadImage } from '../lib/photo'
import { IconPlus, IconDownload } from './icons'

export default function App() {
  return (
    <>
      <Header />
      <main className="app">
        <EditorCanvas />
        <StravaPanel />
        <RouteSource />
        <StatsPanel />
        <PhotoPanel />
        <ThemePanel />
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
        <button className="btn" onClick={() => setElements(els => [...els, newStat('Título', 'valor')])}><IconPlus size={14} /> Adicionar dado</button>
        {elements.length > 0 && (
          <button className="btn" onClick={() => setElements([])}>Limpar tudo</button>
        )}
      </div>
    </section>
  )
}

function PhotoPanel() {
  const [photo, setPhoto] = useAtom(photoAtom)
  const [incluir, setIncluir] = useAtom(photoInExportAtom)

  // O object URL anterior precisa ser revogado na mão: sem isso o blob fica
  // preso na memória da aba até fechar.
  const swap = (next: Photo | null) => {
    setPhoto(prev => {
      if (prev) URL.revokeObjectURL(prev.url)
      return next
    })
  }

  const onFile = (file: File | undefined) => {
    if (!file) return
    swap({ url: URL.createObjectURL(file), name: file.name })
  }

  return (
    <section className="card">
      <h2>Foto de fundo</h2>
      {photo ? (
        <>
          <p className="hint" style={{ marginBottom: 10 }}>{photo.name}</p>
          <div className="row">
            <button className="btn" onClick={() => swap(null)}>Remover foto</button>
            <label className="check">
              <input type="checkbox" checked={incluir} onChange={e => setIncluir(e.target.checked)} />
              Salvar a imagem com a foto
            </label>
          </div>
          <p className="hint">
            {incluir
              ? 'Sai um JPEG com a foto e o overlay juntos, pronto pra postar.'
              : 'Sai o PNG transparente de sempre. A foto fica só na prévia, pra você conferir o contraste.'}
          </p>
        </>
      ) : (
        <>
          <div className="field">
            <label htmlFor="photo">Escolha uma foto</label>
            <input id="photo" type="file" accept="image/*" onChange={e => onFile(e.target.files?.[0])} />
          </div>
          <p className="hint">
            A foto entra atrás do overlay pra você ver como fica. Ela não sai do seu aparelho e some quando você
            fecha a aba: nada é enviado nem guardado.
          </p>
        </>
      )}
    </section>
  )
}

function ThemePanel() {
  const [theme, setTheme] = useAtom(themeAtom)
  const setStyle = useSetAtom(styleAtom)
  const current = themeById(theme)

  // Escolher o tema troca a paleta e a fonte; os controles de Estilo seguem
  // valendo pra ajustar depois, e as camadas do tema acompanham a cor nova.
  const pick = (t: Theme) => {
    setTheme(t.id)
    setStyle(s => ({ ...s, ...t.palette }))
  }

  return (
    <section className="card">
      <h2>Tema</h2>
      <div className="shape-grid">
        {THEMES.map(t => (
          <button key={t.id} className="btn" aria-pressed={t.id === theme} onClick={() => pick(t)}>
            {t.label}
          </button>
        ))}
      </div>
      <p className="hint">{current.hint}</p>
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

/** Dispara o download do blob. */
function baixar(blob: Blob, nome: string) {
  const url = URL.createObjectURL(blob)
  const link = Object.assign(document.createElement('a'), { href: url, download: nome })
  // Alguns navegadores só disparam o clique com o elemento no documento.
  document.body.appendChild(link)
  link.click()
  link.remove()
  // Revogar na hora corre com o download; soltar depois evita arquivo truncado.
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

function ExportBar() {
  const [preset, setPreset] = useAtom(presetAtom)
  const elements = useAtomValue(elementsAtom)
  const route = useAtomValue(routeAtom)
  const routeBox = useAtomValue(routeBoxAtom)
  const style = useAtomValue(styleAtom)
  const theme = themeById(useAtomValue(themeAtom))
  const photo = useAtomValue(photoAtom)
  const comFoto = useAtomValue(photoInExportAtom)
  const [busy, setBusy] = useState(false)
  const [erro, setErro] = useState('')

  const doExport = async () => {
    setBusy(true)
    setErro('')
    try {
      const size = PRESETS[preset]
      const img = photo && comFoto ? await loadImage(photo.url) : null
      const blob = await renderOverlay({ elements, route, routeBox, style, theme, photo: img }, size)
      const nome = `trajeto-${preset}.${img ? 'jpg' : 'png'}`
      const file = new File([blob], nome, { type: blob.type })

      if (navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file] })
          return
        } catch (e) {
          // Fechar a folha de compartilhamento é escolha do usuário: respeitar.
          if (e instanceof DOMException && e.name === 'AbortError') return
          // Qualquer outra falha cai pro download. A mais comum é a ativação do
          // clique expirar enquanto o canvas renderiza, e antes disso ela sumia
          // em silêncio: o botão voltava do "Gerando…" sem entregar arquivo.
        }
      }
      baixar(blob, nome)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não deu pra gerar a imagem')
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
        {busy ? 'Gerando…' : <><IconDownload size={15} /> Salvar {photo && comFoto ? 'JPG' : 'PNG'}</>}
      </button>
      {erro && <p className="error export-error" role="alert">{erro}</p>}
    </div>
  )
}
