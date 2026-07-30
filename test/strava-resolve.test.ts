import handler from '../api/strava-resolve.js'

const resposta = () => {
  const r: any = { code: 0, body: null }
  r.status = (c: number) => { r.code = c; return r }
  r.json = (b: unknown) => { r.body = b; return r }
  return r
}

const chamar = (url: string) => {
  const res = resposta()
  return handler({ query: { url } } as never, res).then(() => res)
}

afterEach(() => vi.unstubAllGlobals())

it('só aceita link curto do próprio Strava', async () => {
  // a URL vem do usuário: sem allowlist o endpoint viraria proxy pra qualquer host
  const fetchSpy = vi.fn()
  vi.stubGlobal('fetch', fetchSpy)

  for (const ruim of [
    'https://exemplo.com/qualquer',
    'http://strava.app.link/abc',              // sem TLS
    'https://strava.app.link.evil.com/abc',    // host parecido
    'https://strava.app.link/abc?next=http://interno',
    'https://169.254.169.254/latest/meta-data',
    '',
  ]) {
    const res = await chamar(ruim)
    expect(res.code, ruim).toBe(400)
  }
  expect(fetchSpy).not.toHaveBeenCalled()
})

it('devolve o id quando o redirect chega na atividade', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => ({
    url: 'https://www.strava.com/activities/98765432',
    text: async () => '',
  })))
  const res = await chamar('https://strava.app.link/4ft9gn9Nc5b')
  expect(res.code).toBe(200)
  expect(res.body).toEqual({ id: '98765432' })
})

it('acha o id no corpo quando o Branch responde página em vez de redirect', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => ({
    url: 'https://strava.app.link/4ft9gn9Nc5b',
    text: async () => '{"$canonical_url":"https://www.strava.com/activities/13579"}',
  })))
  const res = await chamar('https://strava.app.link/4ft9gn9Nc5b')
  expect(res.body).toEqual({ id: '13579' })
})

it('link válido que não leva a atividade devolve 404', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => ({
    url: 'https://www.strava.com/athletes/42',
    text: async () => 'sem nada',
  })))
  const res = await chamar('https://strava.app.link/abcdef')
  expect(res.code).toBe(404)
})

it('falha de rede não derruba o endpoint', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('offline') }))
  const res = await chamar('https://strava.app.link/abcdef')
  expect(res.code).toBe(502)
})
