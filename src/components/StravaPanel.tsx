import { useEffect, useState } from 'react'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { routeAtom, elementsAtom, importsAtom, newStat, StatElement } from '../state'
import { normalizePoints } from '../lib/geo'
import { statsFor, plannedVsActual, StatSeed } from '../lib/stats'
import { formatDistance } from '../lib/format'
import {
  StravaToken, ImportResult, parseActivityUrl, getActivity, listRoutes, exploreSegments,
  resolveShortLink, SPORT_SHAPE,
} from '../lib/strava'
import { SHAPES } from '../lib/shapes'
import { Trace } from '../lib/geo'
import { searchPlaces, Place } from '../lib/api'
import { useT, useLang, errorText, Key, T, Lang } from '../i18n'

// Mantém o nome antigo do app de propósito: renomear a chave desconectaria
// do Strava quem já autorizou, e ela não aparece pra ninguém.
const STORAGE_KEY = 'trajeto_strava'

function loadToken(): StravaToken | null {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null') } catch { return null }
}
function saveToken(t: StravaToken | null) {
  if (t) localStorage.setItem(STORAGE_KEY, JSON.stringify(t))
  else localStorage.removeItem(STORAGE_KEY)
}

async function tokenRequest(body: object): Promise<StravaToken> {
  const res = await fetch('/api/strava-token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error('err.stravaAuth')
  const data = await res.json()
  if (!data.access_token) throw new Error('err.stravaAuth')
  return { ...loadToken(), ...data }
}

export default function StravaPanel() {
  const [token, setToken] = useState<StravaToken | null>(loadToken)
  const [error, setError] = useState('')
  const t = useT()

  // Callback do OAuth: ?code= na URL
  useEffect(() => {
    const code = new URLSearchParams(location.search).get('code')
    if (!code) return
    history.replaceState(null, '', location.pathname)
    tokenRequest({ code })
      .then(t => { saveToken(t); setToken(t) })
      .catch(e => setError(errorText(e, t)))
  }, [])

  const connect = async () => {
    setError('')
    try {
      const { clientId } = await (await fetch('/api/strava-config')).json()
      if (!clientId) throw new Error('err.stravaConfig')
      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: location.origin + location.pathname,
        response_type: 'code',
        scope: 'read,activity:read',
        approval_prompt: 'auto',
      })
      location.href = `https://www.strava.com/oauth/authorize?${params}`
    } catch (e) {
      setError(errorText(e, t, 'err.connectFailed'))
    }
  }

  const disconnect = () => { saveToken(null); setToken(null) }

  /** Devolve access_token válido, renovando se expirou. */
  const freshToken = async (): Promise<string> => {
    if (!token) throw new Error('err.connectFirst')
    if (token.expires_at * 1000 > Date.now() + 60_000) return token.access_token
    const t = await tokenRequest({ refresh_token: token.refresh_token })
    saveToken(t); setToken(t)
    return t.access_token
  }

  if (!token) {
    return (
      <section className="card">
        <h2>Strava</h2>
        <p className="hint">{t('strava.hint')}</p>
        <button className="btn strava" style={{ marginTop: 10 }} onClick={connect}>{t('strava.connect')}</button>
        {error && <p className="error" role="alert">{error}</p>}
      </section>
    )
  }

  return (
    <section className="card">
      <h2>Strava{token.athlete?.firstname ? ` · ${token.athlete.firstname}` : ''}</h2>
      <Connected freshToken={freshToken} athleteId={token.athlete?.id} />
      <button className="btn" style={{ marginTop: 10 }} onClick={disconnect}>{t('strava.disconnect')}</button>
    </section>
  )
}

/** O que aproveitar da importação: tudo, só a geometria ou só as estatísticas. */
type ApplyMode = 'all' | 'shape' | 'stats'

// Duas colunas: as modalidades novas trazem frequência, calorias e esforço,
// e a coluna única de antes não comportava.
const STAT_SLOTS = [
  [8, 44], [55, 44], [8, 58], [55, 58], [8, 72], [55, 72], [8, 86], [55, 86],
] as const

/** Forma que substitui o traçado quando a atividade não tem mapa. */
function shapeFor(r: ImportResult): Trace | null {
  const nome = r.sportType ? SPORT_SHAPE[r.sportType] : undefined
  return nome ? SHAPES[nome] ?? null : null
}

/** Acrescenta o cruzamento sem tocar no resto do quadro, substituindo uma versão anterior dele. */
function withCross(els: StatElement[], cross: StatSeed): StatElement[] {
  // Pela chave, não pelo texto: o rótulo muda de idioma, a chave não.
  const rest = els.filter(e => e.key !== cross.key)
  const [x, y] = STAT_SLOTS[Math.min(rest.length, STAT_SLOTS.length - 1)]
  return [...rest, newStat(cross.label, cross.value, x, y, cross.key)]
}

function useApplyImport() {
  const setRoute = useSetAtom(routeAtom)
  const setElements = useSetAtom(elementsAtom)
  const [imports, setImports] = useAtom(importsAtom)
  const lang = useLang()
  const t = useT()

  return (r: ImportResult, mode: ApplyMode) => {
    if (mode !== 'stats') {
      // Atividade sem mapa não fica sem desenho: entra a forma da modalidade.
      const trace = r.points.length ? [normalizePoints(r.points)] : shapeFor(r)
      if (trace) setRoute(trace)
    }

    // Guarda por tipo pra cruzar previsto (rota) com feito (atividade), em qualquer ordem de importação.
    const next = { ...imports, [r.kind]: r }
    setImports(next)
    const cross = plannedVsActual(next.route, next.activity, t)

    // Só o traçado não mexe nos números, mas pode ter destravado o cruzamento: ele entra como dado novo.
    if (mode === 'shape') {
      if (cross) setElements(els => withCross(els, cross))
      return
    }

    const seeds = statsFor(r, lang, t)
    if (cross) seeds.push(cross)
    setElements(
      seeds.slice(0, STAT_SLOTS.length).map((s, i) => newStat(s.label, s.value, STAT_SLOTS[i][0], STAT_SLOTS[i][1], s.key)),
    )
  }
}

function Connected({ freshToken, athleteId }: { freshToken: () => Promise<string>; athleteId?: number }) {
  const apply = useApplyImport()
  const t = useT()
  const lang = useLang()
  const route = useAtomValue(routeAtom)
  const elements = useAtomValue(elementsAtom)
  const [link, setLink] = useState('')
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [options, setOptions] = useState<ImportResult[]>([])
  const [optionsLabel, setOptionsLabel] = useState<Key>('strava.myRoutes')
  const [pending, setPending] = useState<ImportResult | null>(null)

  /** Quadro vazio não tem o que mesclar: importa direto. Caso contrário pergunta o que aproveitar. */
  const offer = (r: ImportResult) => {
    if (!route && elements.length === 0) apply(r, 'all')
    else setPending(r)
  }

  const resolve = (mode: ApplyMode) => {
    if (pending) apply(pending, mode)
    setPending(null)
    setOptions([])
  }

  const run = async (what: string, fn: () => Promise<void>) => {
    setBusy(what); setError(''); setOptions([]); setPending(null)
    try { await fn() } catch (e) { setError(errorText(e, t)) } finally { setBusy('') }
  }

  const importLink = () => run('link', async () => {
    const ref = parseActivityUrl(link)
    if (!ref) throw new Error('err.badLink')
    const id = ref.kind === 'id' ? ref.id : await resolveShortLink(ref.url)
    offer(await getActivity(id, await freshToken()))
  })

  const loadRoutes = () => run('routes', async () => {
    if (!athleteId) throw new Error('err.noAthlete')
    const routes = await listRoutes(athleteId, await freshToken())
    if (routes.length === 0) throw new Error('err.noRoutes')
    setOptions(routes); setOptionsLabel('strava.myRoutes')
  })

  const [segPlace, setSegPlace] = useState<Place | null>(null)
  const [segQuery, setSegQuery] = useState('')
  const findSegments = () => run('segments', async () => {
    let place = segPlace
    if (!place) {
      const results = await searchPlaces(segQuery)
      if (results.length === 0) throw new Error('err.placeNotFound')
      place = results[0]
      setSegPlace(place)
    }
    const segs = await exploreSegments(place.lat, place.lon, await freshToken())
    if (segs.length === 0) throw new Error('err.noSegments')
    setOptions(segs); setOptionsLabel('strava.segments')
  })

  return (
    <div>
      <div className="field">
        <label htmlFor="strava-link">{t('strava.linkLabel')}</label>
        <input id="strava-link" type="text" inputMode="url" value={link}
          placeholder="strava.com/activities/… ou strava.app.link/…"
          onChange={e => setLink(e.target.value)} />
      </div>
      <div className="row">
        <button className="btn" disabled={!link || !!busy} onClick={importLink}>
          {busy === 'link' ? t('strava.importing') : t('strava.import')}
        </button>
        <button className="btn" disabled={!!busy} onClick={loadRoutes}>
          {busy === 'routes' ? t('strava.searching') : t('strava.myRoutes')}
        </button>
      </div>
      <div className="field" style={{ marginTop: 12 }}>
        <label htmlFor="seg-place">{t('strava.segLabel')}</label>
        <div className="row">
          <input id="seg-place" type="search" value={segQuery} placeholder={t('strava.segPlaceholder')}
            onChange={e => { setSegQuery(e.target.value); setSegPlace(null) }} style={{ flex: 1 }} />
          <button className="btn" disabled={segQuery.length < 3 || !!busy} onClick={findSegments}>
            {busy === 'segments' ? t('strava.searching') : t('strava.search')}
          </button>
        </div>
      </div>
      {pending && (
        <div className="field" style={{ marginTop: 12 }}>
          <label>{pending.name} · {formatDistance(pending.distanceM, lang)}</label>
          <div className="row">
            <button className="btn" onClick={() => resolve('all')}>{t('merge.all')}</button>
            <button className="btn" onClick={() => resolve('shape')}>{t('merge.shape')}</button>
            <button className="btn" onClick={() => resolve('stats')}>{t('merge.stats')}</button>
            <button className="btn" onClick={() => setPending(null)}>{t('merge.cancel')}</button>
          </div>
          <p className="hint">
            {t(pending.points.length === 0
              ? shapeFor(pending) ? 'merge.hintShape' : 'merge.hintNoShape'
              : 'merge.hintBoth')}
          </p>
        </div>
      )}
      {options.length > 0 && (
        <div className="field">
          <label>{t(optionsLabel)}</label>
          <ul className="suggest">
            {options.map((o, i) => (
              <li key={i}>
                <button onClick={() => offer(o)}>
                  {o.name} · {formatDistance(o.distanceM, lang)}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {error && <p className="error" role="alert">{error}</p>}
    </div>
  )
}
