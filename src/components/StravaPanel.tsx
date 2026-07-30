import { useEffect, useState } from 'react'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { routeAtom, elementsAtom, importsAtom, newStat, StatElement } from '../state'
import { normalizePoints } from '../lib/geo'
import { statsFor, plannedVsActual, StatSeed } from '../lib/stats'
import { formatDistance } from '../lib/format'
import {
  StravaToken, ImportResult, parseActivityUrl, getActivity, listRoutes, exploreSegments,
} from '../lib/strava'
import { searchPlaces, Place } from '../lib/api'

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
  if (!res.ok) throw new Error('Falha na autenticação com o Strava')
  const data = await res.json()
  if (!data.access_token) throw new Error('Falha na autenticação com o Strava')
  return { ...loadToken(), ...data }
}

export default function StravaPanel() {
  const [token, setToken] = useState<StravaToken | null>(loadToken)
  const [error, setError] = useState('')

  // Callback do OAuth: ?code= na URL
  useEffect(() => {
    const code = new URLSearchParams(location.search).get('code')
    if (!code) return
    history.replaceState(null, '', location.pathname)
    tokenRequest({ code })
      .then(t => { saveToken(t); setToken(t) })
      .catch(e => setError(e.message))
  }, [])

  const connect = async () => {
    setError('')
    try {
      const { clientId } = await (await fetch('/api/strava-config')).json()
      if (!clientId) throw new Error('Integração com o Strava ainda não configurada neste servidor')
      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: location.origin + location.pathname,
        response_type: 'code',
        scope: 'read,activity:read',
        approval_prompt: 'auto',
      })
      location.href = `https://www.strava.com/oauth/authorize?${params}`
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao iniciar conexão')
    }
  }

  const disconnect = () => { saveToken(null); setToken(null) }

  /** Devolve access_token válido, renovando se expirou. */
  const freshToken = async (): Promise<string> => {
    if (!token) throw new Error('Conecte com o Strava primeiro')
    if (token.expires_at * 1000 > Date.now() + 60_000) return token.access_token
    const t = await tokenRequest({ refresh_token: token.refresh_token })
    saveToken(t); setToken(t)
    return t.access_token
  }

  if (!token) {
    return (
      <section className="card">
        <h2>Strava</h2>
        <p className="hint">Conecte pra importar suas atividades, rotas salvas e segmentos da comunidade.</p>
        <button className="btn strava" style={{ marginTop: 10 }} onClick={connect}>Conectar com Strava</button>
        {error && <p className="error" role="alert">{error}</p>}
      </section>
    )
  }

  return (
    <section className="card">
      <h2>Strava{token.athlete?.firstname ? ` · ${token.athlete.firstname}` : ''}</h2>
      <Connected freshToken={freshToken} athleteId={token.athlete?.id} />
      <button className="btn" style={{ marginTop: 10 }} onClick={disconnect}>Desconectar</button>
    </section>
  )
}

/** O que aproveitar da importação: tudo, só a geometria ou só as estatísticas. */
type ApplyMode = 'all' | 'shape' | 'stats'

const STAT_SLOTS = [[8, 56], [8, 70], [55, 56], [55, 70], [8, 84]] as const

/** Acrescenta o cruzamento sem tocar no resto do quadro, substituindo uma versão anterior dele. */
function withCross(els: StatElement[], cross: StatSeed): StatElement[] {
  const rest = els.filter(e => e.label !== cross.label)
  const [x, y] = STAT_SLOTS[Math.min(rest.length, STAT_SLOTS.length - 1)]
  return [...rest, newStat(cross.label, cross.value, x, y)]
}

function useApplyImport() {
  const setRoute = useSetAtom(routeAtom)
  const setElements = useSetAtom(elementsAtom)
  const [imports, setImports] = useAtom(importsAtom)

  return (r: ImportResult, mode: ApplyMode) => {
    if (mode !== 'stats') setRoute([normalizePoints(r.points)])

    // Guarda por tipo pra cruzar previsto (rota) com feito (atividade), em qualquer ordem de importação.
    const next = { ...imports, [r.kind]: r }
    setImports(next)
    const cross = plannedVsActual(next.route, next.activity)

    // Só o traçado não mexe nos números, mas pode ter destravado o cruzamento: ele entra como dado novo.
    if (mode === 'shape') {
      if (cross) setElements(els => withCross(els, cross))
      return
    }

    const seeds = statsFor(r)
    if (cross) seeds.push(cross)
    setElements(
      seeds.slice(0, STAT_SLOTS.length).map((s, i) => newStat(s.label, s.value, STAT_SLOTS[i][0], STAT_SLOTS[i][1])),
    )
  }
}

function Connected({ freshToken, athleteId }: { freshToken: () => Promise<string>; athleteId?: number }) {
  const apply = useApplyImport()
  const route = useAtomValue(routeAtom)
  const elements = useAtomValue(elementsAtom)
  const [link, setLink] = useState('')
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [options, setOptions] = useState<ImportResult[]>([])
  const [optionsLabel, setOptionsLabel] = useState('')
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
    try { await fn() } catch (e) { setError(e instanceof Error ? e.message : 'Deu erro') } finally { setBusy('') }
  }

  const importLink = () => run('link', async () => {
    const id = parseActivityUrl(link)
    if (!id) throw new Error('Cole um link no formato strava.com/activities/…')
    offer(await getActivity(id, await freshToken()))
  })

  const loadRoutes = () => run('routes', async () => {
    if (!athleteId) throw new Error('Conta sem identificador. Conecte de novo')
    const routes = await listRoutes(athleteId, await freshToken())
    if (routes.length === 0) throw new Error('Nenhuma rota salva na sua conta')
    setOptions(routes); setOptionsLabel('Minhas rotas')
  })

  const [segPlace, setSegPlace] = useState<Place | null>(null)
  const [segQuery, setSegQuery] = useState('')
  const findSegments = () => run('segments', async () => {
    let place = segPlace
    if (!place) {
      const results = await searchPlaces(segQuery)
      if (results.length === 0) throw new Error('Local não encontrado')
      place = results[0]
      setSegPlace(place)
    }
    const segs = await exploreSegments(place.lat, place.lon, await freshToken())
    if (segs.length === 0) throw new Error('Nenhum segmento de corrida nessa região')
    setOptions(segs); setOptionsLabel('Segmentos da região')
  })

  return (
    <div>
      <div className="field">
        <label htmlFor="strava-link">Link da atividade</label>
        <input id="strava-link" type="text" inputMode="url" value={link}
          placeholder="https://www.strava.com/activities/…"
          onChange={e => setLink(e.target.value)} />
      </div>
      <div className="row">
        <button className="btn" disabled={!link || !!busy} onClick={importLink}>
          {busy === 'link' ? 'Importando…' : 'Importar atividade'}
        </button>
        <button className="btn" disabled={!!busy} onClick={loadRoutes}>
          {busy === 'routes' ? 'Buscando…' : 'Minhas rotas'}
        </button>
      </div>
      <div className="field" style={{ marginTop: 12 }}>
        <label htmlFor="seg-place">Segmentos perto de um local</label>
        <div className="row">
          <input id="seg-place" type="search" value={segQuery} placeholder="Ex.: Gruta do Janelão"
            onChange={e => { setSegQuery(e.target.value); setSegPlace(null) }} style={{ flex: 1 }} />
          <button className="btn" disabled={segQuery.length < 3 || !!busy} onClick={findSegments}>
            {busy === 'segments' ? 'Buscando…' : 'Buscar'}
          </button>
        </div>
      </div>
      {pending && (
        <div className="field" style={{ marginTop: 12 }}>
          <label>{pending.name} · {formatDistance(pending.distanceM)}</label>
          <div className="row">
            <button className="btn" onClick={() => resolve('all')}>Substituir tudo</button>
            <button className="btn" onClick={() => resolve('shape')}>Só o traçado</button>
            <button className="btn" onClick={() => resolve('stats')}>Só os números</button>
            <button className="btn" onClick={() => setPending(null)}>Cancelar</button>
          </div>
          <p className="hint">
            Pra juntar os dois: importe a atividade e depois a rota com "Só o traçado". O desenho fica o da
            rota planejada e os números seguem os da sua atividade.
          </p>
        </div>
      )}
      {options.length > 0 && (
        <div className="field">
          <label>{optionsLabel}</label>
          <ul className="suggest">
            {options.map((o, i) => (
              <li key={i}>
                <button onClick={() => offer(o)}>
                  {o.name} · {formatDistance(o.distanceM)}
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
