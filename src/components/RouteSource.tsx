import { useEffect, useRef, useState } from 'react'
import { useAtom, useSetAtom } from 'jotai'
import { routeAtom, elementsAtom, newStat } from '../state'
import { parseGpx, GpxStats } from '../lib/gpx'
import { normalizePoints, LatLon } from '../lib/geo'
import { searchPlaces, fetchRoute, Place } from '../lib/api'
import { formatDistance, formatDuration, formatPace } from '../lib/format'

export default function RouteSource() {
  const [tab, setTab] = useState<'gpx' | 'ab'>('gpx')
  return (
    <section className="card">
      <h2>Rota</h2>
      <div className="tabs" role="tablist">
        <button role="tab" aria-selected={tab === 'gpx'} onClick={() => setTab('gpx')}>Arquivo GPX</button>
        <button role="tab" aria-selected={tab === 'ab'} onClick={() => setTab('ab')}>Início e fim</button>
      </div>
      {tab === 'gpx' ? <GpxTab /> : <AbTab />}
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
        <label htmlFor="gpx">No Strava: atividade → ⋯ → Exportar GPX</label>
        <input id="gpx" type="file" accept=".gpx,application/gpx+xml" onChange={e => onFile(e.target.files?.[0])} />
      </div>
      {error && <p className="error" role="alert">{error}. Tente o modo "Início e fim".</p>}
      <p className="hint">Distância, tempo, elevação e pace entram sozinhos — edite à vontade.</p>
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
      {error && <p className="error" role="alert">{error}. Sem sinal do serviço de rotas? Use um arquivo GPX.</p>}
    </div>
  )
}
