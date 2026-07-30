import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Provider } from 'jotai'
import App from '../src/components/App'
import { SHAPES } from '../src/lib/shapes'

const POLYLINE = '_p~iF~ps|U_ulLnnqC_mqNvxq`@'

/** Musculação: tem dados, não tem mapa. */
const musculacao = {
  name: 'Treino de força',
  distance: 0,
  moving_time: 3600,
  total_elevation_gain: 0,
  sport_type: 'WeightTraining',
  average_heartrate: 118.6,
  calories: 412,
  suffer_score: 44,
  map: {},
}

const pedal = {
  name: 'Pedal da manhã',
  distance: 20000,
  moving_time: 3600,
  total_elevation_gain: 320,
  sport_type: 'Ride',
  average_heartrate: 141,
  average_watts: 187.5,
  map: { polyline: POLYLINE },
}

function montar(atividade: object, { resolveId = '999' } = {}) {
  const chamadas: string[] = []
  localStorage.setItem('trajeto_strava', JSON.stringify({
    access_token: 'tok', refresh_token: 'ref',
    expires_at: Math.floor(Date.now() / 1000) + 86400,
    athlete: { id: 1, firstname: 'Flávio' },
  }))
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    chamadas.push(String(url))
    if (String(url).includes('/api/strava-resolve')) {
      return { ok: true, status: 200, json: async () => ({ id: resolveId }) }
    }
    return { ok: true, status: 200, json: async () => atividade }
  }))
  render(<Provider><App /></Provider>)
  return chamadas
}

afterEach(() => {
  localStorage.clear()
  vi.unstubAllGlobals()
})

const colar = (texto: string) => {
  fireEvent.change(screen.getByLabelText('Link da atividade'), { target: { value: texto } })
  fireEvent.click(screen.getByRole('button', { name: 'Importar atividade' }))
}

it('importa pelo link curto de compartilhar, resolvendo no servidor', async () => {
  const chamadas = montar(pedal, { resolveId: '4242' })
  colar('https://strava.app.link/4ft9gn9Nc5b')

  await screen.findByRole('button', { name: 'Substituir tudo' })
  // passou pelo serverless, porque o navegador esbarra em CORS no Branch
  expect(chamadas.some(u => u.includes('/api/strava-resolve'))).toBe(true)
  // e usou o id resolvido pra buscar a atividade
  expect(chamadas.some(u => u.includes('/activities/4242'))).toBe(true)
})

it('link curto que o servidor não resolve vira erro legível', async () => {
  localStorage.setItem('trajeto_strava', JSON.stringify({
    access_token: 'tok', refresh_token: 'ref',
    expires_at: Math.floor(Date.now() / 1000) + 86400, athlete: { id: 1 },
  }))
  vi.stubGlobal('fetch', vi.fn(async () => ({
    ok: false, status: 404, json: async () => ({ error: 'Esse link não leva a uma atividade' }),
  })))
  render(<Provider><App /></Provider>)
  colar('https://strava.app.link/xxxxx')

  const alerta = await screen.findByRole('alert')
  expect(alerta.textContent).toContain('Esse link não leva a uma atividade')
})

it('atividade sem mapa usa a forma da modalidade no lugar do traçado', async () => {
  montar(musculacao)
  colar('https://www.strava.com/activities/123')

  fireEvent.click(await screen.findByRole('button', { name: 'Substituir tudo' }))

  // musculação não tem traçado, mas o quadro não fica vazio
  await waitFor(() => expect(document.querySelector('.route-box')).toBeTruthy())
  const paths = document.querySelectorAll('.route-box path').length
  expect(paths).toBeGreaterThan(0)
  // e os dados dela entraram
  expect(screen.getByText('412 kcal')).toBeTruthy()
  expect(screen.getByText('119 bpm')).toBeTruthy()
  // sem distância nem pace, que a modalidade não tem
  expect(screen.queryByText('Distância')).toBeNull()
  expect(screen.queryByText('Pace')).toBeNull()
})

it('a forma escolhida é mesmo a da modalidade importada', async () => {
  montar(musculacao)
  colar('https://www.strava.com/activities/123')
  fireEvent.click(await screen.findByRole('button', { name: 'Substituir tudo' }))

  await waitFor(() => expect(document.querySelector('.route-box')).toBeTruthy())
  // WeightTraining mapeia pra Musculação, que tem mais de um subcaminho
  fireEvent.click(screen.getByRole('tab', { name: 'Formas' }))
  expect(screen.getByRole('button', { name: 'Musculação' }).getAttribute('aria-pressed')).toBe('true')
  expect(SHAPES['Musculação'].length).toBeGreaterThan(1)
})

it('pedal traz velocidade e potência em vez de pace', async () => {
  montar(pedal)
  colar('https://www.strava.com/activities/321')
  fireEvent.click(await screen.findByRole('button', { name: 'Substituir tudo' }))

  await waitFor(() => expect(screen.getByText('20,0 km/h')).toBeTruthy())
  expect(screen.getByText('Velocidade')).toBeTruthy()
  expect(screen.getByText('188 W')).toBeTruthy()
  expect(screen.queryByText('Pace')).toBeNull()
})
