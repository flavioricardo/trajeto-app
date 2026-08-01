import { useEffect, useState } from 'react'
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
import FileField from './FileField'
import { langAtom, useT, useLang, errorText, localizeNumbers, Lang, dict, htmlLang } from '../i18n'

export default function App() {
  useDocumentLang()
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
  const t = useT()
  return (
    <header className="header">
      <Contours />
      {/* O destaque cai em "line", que é o traço que o app desenha. */}
      <h1 className="brand">Story<em>line</em></h1>
      <p className="tagline">{t('tagline')}</p>
      <LangToggle />
    </header>
  )
}

/**
 * Troca de idioma. Os rótulos que vieram do dicionário são reescritos; o que o
 * usuário renomeou perdeu a chave e fica como está. O valor não dá pra
 * reformatar pela origem, então só o separador decimal acompanha.
 */
function LangToggle() {
  const [lang, setLang] = useAtom(langAtom)
  const setElements = useSetAtom(elementsAtom)
  const t = useT()

  const pick = (next: Lang) => {
    if (next === lang) return
    setLang(next)
    const tn = dict(next)
    setElements(els => els.map(e => ({
      ...e,
      label: e.key ? tn(e.key) : e.label,
      value: localizeNumbers(e.value, next),
    })))
  }

  return (
    <div className="lang-toggle" role="group" aria-label={t('lang.aria')}>
      {(['pt', 'en'] as Lang[]).map(l => (
        <button key={l} aria-pressed={l === lang} onClick={() => pick(l)}>{l.toUpperCase()}</button>
      ))}
    </div>
  )
}

/** O documento também é bilíngue: título, descrição e o lang da raiz. */
function useDocumentLang() {
  const lang = useLang()
  useEffect(() => {
    const t = dict(lang)
    document.documentElement.lang = htmlLang(lang)
    document.title = t('doc.title')
    document.querySelector('meta[name=description]')?.setAttribute('content', t('doc.description'))
  }, [lang])
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
  const t = useT()
  return (
    <section className="card">
      <h2>{t('panel.stats')}</h2>
      <p className="hint">{t('stats.hint')}</p>
      <div className="row" style={{ marginTop: 10 }}>
        <button className="btn" onClick={() => setElements(els => [...els, newStat(t('stats.newLabel'), t('stats.newValue'))])}><IconPlus size={14} /> {t('stats.add')}</button>
        {elements.length > 0 && (
          <button className="btn" onClick={() => setElements([])}>{t('stats.clear')}</button>
        )}
      </div>
    </section>
  )
}

function PhotoPanel() {
  const [photo, setPhoto] = useAtom(photoAtom)
  const [incluir, setIncluir] = useAtom(photoInExportAtom)
  const t = useT()

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
      <h2>{t('panel.photo')}</h2>
      {photo ? (
        <>
          <p className="hint" style={{ marginBottom: 10 }}>{photo.name}</p>
          <div className="row">
            <button className="btn" onClick={() => swap(null)}>{t('photo.remove')}</button>
            <label className="check">
              <input type="checkbox" checked={incluir} onChange={e => setIncluir(e.target.checked)} />
              {t('photo.include')}
            </label>
          </div>
          <p className="hint">
            {t(incluir ? 'photo.hintWith' : 'photo.hintWithout')}
          </p>
        </>
      ) : (
        <>
          <FileField id="photo" accept="image/*" label={t('photo.choose')} onFile={onFile} />
          <p className="hint">{t('photo.privacy')}</p>
        </>
      )}
    </section>
  )
}

function ThemePanel() {
  const [theme, setTheme] = useAtom(themeAtom)
  const setStyle = useSetAtom(styleAtom)
  const t = useT()

  // Escolher o tema troca a paleta e a fonte; os controles de Estilo seguem
  // valendo pra ajustar depois, e as camadas do tema acompanham a cor nova.
  const pick = (th: Theme) => {
    setTheme(th.id)
    setStyle(s => ({ ...s, ...th.palette }))
  }

  return (
    <section className="card">
      <h2>{t('panel.theme')}</h2>
      <div className="shape-grid">
        {THEMES.map(th => (
          <button key={th.id} className="btn" aria-pressed={th.id === theme} onClick={() => pick(th)}>
            {t(`theme.${th.id}.label` as const)}
          </button>
        ))}
      </div>
      <p className="hint">{t(`theme.${theme}.hint` as const)}</p>
    </section>
  )
}

function StylePanel() {
  const [style, setStyle] = useAtom(styleAtom)
  const t = useT()
  return (
    <section className="card">
      <h2>{t('panel.style')}</h2>
      <div className="row">
        <div className="field">
          <label htmlFor="route-color">{t('style.routeColor')}</label>
          <input id="route-color" type="color" value={style.routeColor}
            onChange={e => setStyle(s => ({ ...s, routeColor: e.target.value }))} />
        </div>
        <div className="field">
          <label htmlFor="text-color">{t('style.textColor')}</label>
          <input id="text-color" type="color" value={style.textColor}
            onChange={e => setStyle(s => ({ ...s, textColor: e.target.value }))} />
        </div>
        <div className="field">
          <label htmlFor="stroke">{t('style.stroke')}: {style.strokeWidth.toFixed(1)}</label>
          <input id="stroke" type="range" min="0.4" max="3" step="0.2" value={style.strokeWidth}
            onChange={e => setStyle(s => ({ ...s, strokeWidth: Number(e.target.value) }))} />
        </div>
      </div>
      <div className="field">
        <label htmlFor="font">{t('style.font')}</label>
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
  const t = useT()

  const doExport = async () => {
    setBusy(true)
    setErro('')
    try {
      const size = PRESETS[preset]
      const img = photo && comFoto ? await loadImage(photo.url) : null
      const blob = await renderOverlay({ elements, route, routeBox, style, theme, photo: img }, size)
      const nome = `storyline-${preset}.${img ? 'jpg' : 'png'}`
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
      setErro(errorText(e, t, 'err.render'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="export-bar">
      <div className="preset-toggle" role="group" aria-label={t('export.format')}>
        {(Object.keys(PRESETS) as Preset[]).map(p => (
          <button key={p} aria-pressed={preset === p} onClick={() => setPreset(p)}>
            {PRESETS[p].label}
          </button>
        ))}
      </div>
      <button className="btn primary" disabled={busy || (elements.length === 0 && !route)} onClick={doExport}>
        {busy ? t('export.busy') : <><IconDownload size={15} /> {t('export.save')} {photo && comFoto ? 'JPG' : 'PNG'}</>}
      </button>
      {erro && <p className="error export-error" role="alert">{erro}</p>}
    </div>
  )
}
