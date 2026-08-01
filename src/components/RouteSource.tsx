import { useEffect, useRef, useState } from 'react'
import { useAtom, useSetAtom } from 'jotai'
import { routeAtom, elementsAtom, newStat } from '../state'
import { parseGpx, GpxStats } from '../lib/gpx'
import { ACTIVITY_SHAPES, FUN_SHAPES } from '../lib/shapes'
import { normalizePoints, totalDistance, LatLon } from '../lib/geo'
import { searchPlaces, fetchRoute, Place } from '../lib/api'
import { formatDistance, formatDuration, formatPace } from '../lib/format'
import { useT, useLang, errorText, Key } from '../i18n'

export default function RouteSource() {
  const [tab, setTab] = useState<'gpx' | 'place' | 'ab' | 'shapes'>('gpx')
  const t = useT()
  const tabs = ['gpx', 'place', 'ab', 'shapes'] as const
  return (
    <section className="card">
      <h2>{t('panel.route')}</h2>
      <div className="tabs" role="tablist">
        {tabs.map(id => (
          <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)}>{t(`tab.${id}`)}</button>
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
  const lang = useLang()
  const t = useT()
  return (stats: GpxStats) => {
    const els = []
    els.push(newStat(t('stat.distance'), formatDistance(stats.distanceM, lang), 8, 56, 'stat.distance'))
    if (stats.durationS) els.push(newStat(t('stat.time'), formatDuration(stats.durationS), 8, 70, 'stat.time'))
    if (stats.gainM != null) els.push(newStat(t('stat.elevation'), `${Math.round(stats.gainM)} m`, 55, 56, 'stat.elevation'))
    if (stats.durationS) els.push(newStat(t('stat.pace'), formatPace(stats.distanceM, stats.durationS), 55, 70, 'stat.pace'))
    setElements(els)
  }
}

function GpxTab() {
  const setRoute = useSetAtom(routeAtom)
  const prefill = usePrefillStats()
  const [error, setError] = useState('')
  const t = useT()

  const onFile = async (file: File | undefined) => {
    if (!file) return
    setError('')
    try {
      const { points, stats } = parseGpx(await file.text())
      setRoute([normalizePoints(points)])
      prefill(stats)
    } catch (e) {
      setError(errorText(e, t, 'err.gpx'))
    }
  }

  return (
    <div>
      <div className="field">
        <label htmlFor="gpx">{t('gpx.label')}</label>
        <input id="gpx" type="file" accept=".gpx,application/gpx+xml" onChange={e => onFile(e.target.files?.[0])} />
      </div>
      {error && <p className="error" role="alert">{error}. {t('gpx.fallback')}</p>}
      <p className="hint">{t('gpx.hint')}</p>
    </div>
  )
}

function PlaceInput({ label, onPick }: { label: string; onPick: (p: Place) => void }) {
  const [q, setQ] = useState('')
  const [results, setResults] = useState<Place[]>([])
  const [picked, setPicked] = useState<Place | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout>>()
  const t = useT()

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
        placeholder={t('place.placeholder')}
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
  const t = useT()

  const onPick = (p: Place) => {
    setError('')
    if (!p.shape || p.shape.length < 3) {
      setError(t('err.placeNoShape'))
      return
    }
    setRoute([normalizePoints(p.shape)])
    if (p.linear) prefill({ distanceM: totalDistance(p.shape) })
  }

  return (
    <div>
      <PlaceInput label={t('place.label')} onPick={onPick} />
      {error && <p className="error" role="alert">{error}. {t('place.fallback')}</p>}
      <p className="hint">{t('place.hint')}</p>
    </div>
  )
}

function ShapesTab() {
  const [route, setRoute] = useAtom(routeAtom)
  const t = useT()
  const groups = [
    ['shapes.activities', ACTIVITY_SHAPES],
    ['shapes.fun', FUN_SHAPES],
  ] as const

  return (
    <div>
      {groups.map(([title, shapes]) => (
        <div className="field" key={title}>
          <label>{t(title)}</label>
          <div className="shape-grid">
            {Object.entries(shapes).map(([name, trace]) => (
              // Compara por referência: a forma escolhida é guardada como está, então
              // rota vinda de GPX, Strava ou local não casa com nenhuma e nada fica marcado.
              <button key={name} className="btn" aria-pressed={route === trace} onClick={() => setRoute(trace)}>
                {t(`shape.${name}` as Key)}
              </button>
            ))}
          </div>
        </div>
      ))}
      <p className="hint">{t('shapes.hint')}</p>
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
  const t = useT()

  const go = async () => {
    if (!a || !b) return
    setBusy(true)
    setError('')
    try {
      const { points, distanceM, durationS } = await fetchRoute(a, b)
      setRoute([normalizePoints(points as LatLon[])])
      prefill({ distanceM, durationS })
    } catch (e) {
      setError(errorText(e, t, 'err.routeFailed'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <PlaceInput label={t('ab.start')} onPick={setA} />
      <PlaceInput label={t('ab.end')} onPick={setB} />
      <button className="btn" disabled={!a || !b || busy} onClick={go}>
        {busy ? t('ab.busy') : t('ab.go')}
      </button>
      {error && <p className="error" role="alert">{error}. {t('ab.fallback')}</p>}
    </div>
  )
}
