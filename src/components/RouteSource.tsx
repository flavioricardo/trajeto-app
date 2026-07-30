import { useEffect, useRef, useState } from 'react'
import { useAtom, useSetAtom } from 'jotai'
import { routeAtom, elementsAtom, newStat } from '../state'
import { parseGpx, GpxStats } from '../lib/gpx'
import { SHAPES } from '../lib/shapes'
import { normalizePoints, totalDistance, LatLon } from '../lib/geo'
import { searchPlaces, fetchRoute, Place } from '../lib/api'
import { formatDistance, formatDuration, formatPace } from '../lib/format'

export default function RouteSource() {
  const [tab, setTab] = useState<'gpx' | 'place' | 'ab' | 'shapes'>('gpx')
  const tabs = [['gpx', 'GPX'], ['place', 'Local'], ['ab', 'A → B'], ['shapes', 'Formas']] as const
  return (
    <section className="card">
      <h2>Rota</h2>
      <div className="tabs" role="tablist">
        {tabs.map(([id, label]) => (
          <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)}>{label}</button>
        ))}
      </div>
      {tab === 'gpx' && <GpxTab />}
      {tab === 'place' && <PlaceTab />}
      {tab === 'ab' && <AbTab />}
      {tab === 'shapes' && <ShapesTab />}
    </section>
  )
}

/** Pré-preenche stats vindos do GPX/OSRM só se o usuário ainda não mexeu. */
function usePrefillStats() {
  const setElements = useSetAtom(elementsAtom)
  return (stats: GpxStats) => {
    const els = []
    els.push(newStat('Distância', formatDistance(stats.distanceM), 8, 56))
    if (stats.durationS) els.push(newStat('Tempo', formatDuration(stats.durationS), 8, 70))
    if (stats.gainM != null) els.push(newStat('Elevação', `${Math.round(stats.gainM)} m`, 55, 56))
    if (stats.durationS) els.push(newStat('Pace', formatPace(stats.distanceM, stats.durationS), 55, 70))
    setElements(els)
  }
}

function GpxTab() {
  const setRoute = useSetAtom(routeAtom)
  const prefill = usePrefillStats()
  const [error, setError] = useState('')

  const onFile = async (file: File | undefined) => {
    if (!file) return
    setError('')
    try {
      const { points, stats } = parseGpx(await file.text())
      setRoute(normalizePoints(points))
      prefill(stats)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Arquivo GPX inválido')
    }
  }

  return (
    <div>
      <div className="field">
        <label htmlFor="gpx">Arquivo GPX da atividade</label>
        <input id="gpx" type="file" accept=".gpx,application/gpx+xml" onChange={e => onFile(e.target.files?.[0])} />
      </div>
      {error && <p className="error" role="alert">{error}. Tente o modo "Início e fim".</p>}
      <p className="hint">No Strava: atividade, menu, Exportar GPX. No Wikiloc: botão Download, Arquivo GPX. Distância, tempo, elevação e pace entram sozinhos.</p>
    </div>
  )
}

function PlaceInput({ label, onPick }: { label: string; onPick: (p: Place) => void }) {
  const [q, setQ] = useState('')
  const [results, setResults] = useState<Place[]>([])
  const [picked, setPicked] = useState<Place | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => () => clearTimeout(timer.current), [])

  const onChange = (v: string) => {
    setQ(v)
    setPicked(null)
    clearTimeout(timer.current)
    if (v.length < 3) return setResults([])
    // ponytail: debounce 800ms cobre rate limit 1 req/s do Nominatim; fila de requisições se precisar de mais
    timer.current = setTimeout(async () => {
      try { setResults(await searchPlaces(v)) } catch { setResults([]) }
    }, 800)
  }

  return (
    <div className="field">
      <label>{label}</label>
      <input
        type="search"
        value={picked ? picked.name : q}
        onChange={e => onChange(e.target.value)}
        placeholder="Ex.: Lapa do Índio, Cordisburgo"
      />
      {!picked && results.length > 0 && (
        <ul className="suggest">
          {results.map(r => (
            <li key={`${r.lat}${r.lon}`}>
              <button onClick={() => { setPicked(r); setResults([]); onPick(r) }}>{r.name}</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function PlaceTab() {
  const setRoute = useSetAtom(routeAtom)
  const prefill = usePrefillStats()
  const [error, setError] = useState('')

  const onPick = (p: Place) => {
    setError('')
    if (!p.shape || p.shape.length < 3) {
      setError('Esse lugar ainda não tem traçado no OpenStreetMap')
      return
    }
    setRoute(normalizePoints(p.shape))
    if (p.linear) prefill({ distanceM: totalDistance(p.shape) })
  }

  return (
    <div>
      <PlaceInput label="Trilha, praça, pista, parque…" onPick={onPick} />
      {error && <p className="error" role="alert">{error}. Baixe o GPX da trilha no Wikiloc ou no Strava e use a aba GPX.</p>}
      <p className="hint">Busca no OpenStreetMap. Trilhas, praças e pistas mapeadas viram traçado na hora.</p>
    </div>
  )
}

function ShapesTab() {
  const [route, setRoute] = useAtom(routeAtom)
  return (
    <div>
      <div className="shape-grid">
        {Object.entries(SHAPES).map(([name, pts]) => (
          // Compara por referência: a forma escolhida é guardada como está, então
          // rota vinda de GPX, Strava ou local não casa com nenhuma e nada fica marcado.
          <button key={name} className="btn" aria-pressed={route === pts} onClick={() => setRoute(pts)}>
            {name}
          </button>
        ))}
      </div>
      <p className="hint">A forma usa a mesma cor e espessura da rota.</p>
    </div>
  )
}

function AbTab() {
  const setRoute = useSetAtom(routeAtom)
  const prefill = usePrefillStats()
  const [a, setA] = useState<Place | null>(null)
  const [b, setB] = useState<Place | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const go = async () => {
    if (!a || !b) return
    setBusy(true)
    setError('')
    try {
      const { points, distanceM, durationS } = await fetchRoute(a, b)
      setRoute(normalizePoints(points as LatLon[]))
      prefill({ distanceM, durationS })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não deu pra traçar a rota')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <PlaceInput label="Início" onPick={setA} />
      <PlaceInput label="Fim" onPick={setB} />
      <button className="btn" disabled={!a || !b || busy} onClick={go}>
        {busy ? 'Traçando…' : 'Traçar rota'}
      </button>
      {error && <p className="error" role="alert">{error}. Se o serviço estiver fora do ar, use um arquivo GPX.</p>}
    </div>
  )
}
