import { render, screen, fireEvent } from '@testing-library/react'
import { Provider } from 'jotai'
import App from '../src/components/App'

const POLYLINE = '_p~iF~ps|U_ulLnnqC_mqNvxq`@'

const activity = {
  name: 'Corrida matinal',
  distance: 10000,
  moving_time: 3480,
  total_elevation_gain: 120,
  map: { polyline: POLYLINE },
}

const savedRoute = {
  name: 'Volta da lagoa',
  distance: 10000,
  elevation_gain: 118,
  estimated_moving_time: 3900,
  map: { summary_polyline: POLYLINE },
}

beforeEach(() => {
  localStorage.setItem('trajeto_strava', JSON.stringify({
    access_token: 'tok', refresh_token: 'ref',
    expires_at: Math.floor(Date.now() / 1000) + 86400,
    athlete: { id: 1, firstname: 'Flávio' },
  }))
  vi.stubGlobal('fetch', vi.fn(async (url: string) => ({
    ok: true,
    status: 200,
    json: async () => (String(url).includes('/routes') ? [savedRoute] : activity),
  })))
})

afterEach(() => {
  localStorage.clear()
  vi.unstubAllGlobals()
})

const importActivity = async () => {
  render(<Provider><App /></Provider>)
  fireEvent.change(screen.getByLabelText('Link da atividade'), {
    target: { value: 'https://www.strava.com/activities/123' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Importar atividade' }))
  await screen.findByRole('button', { name: 'Só o traçado' })
}

it('oferece mesclar em vez de substituir quando o quadro já tem conteúdo', async () => {
  await importActivity()
  for (const name of ['Substituir tudo', 'Só o traçado', 'Só os números', 'Cancelar']) {
    expect(screen.getByRole('button', { name })).toBeTruthy()
  }
})

it('"Só o traçado" troca o desenho e preserva os números do quadro', async () => {
  await importActivity()
  fireEvent.click(screen.getByRole('button', { name: 'Só o traçado' }))

  expect(document.querySelector('.route-box')).toBeTruthy()
  // estatísticas iniciais seguem intactas: nada da atividade entrou
  expect(screen.getByText('4,85 km')).toBeTruthy()
  expect(screen.queryByText('Elevação')).toBeNull()
})

it('"Só os números" traz as estatísticas sem desenhar rota', async () => {
  await importActivity()
  fireEvent.click(screen.getByRole('button', { name: 'Só os números' }))

  expect(document.querySelector('.route-box')).toBeNull()
  expect(screen.getByText('10,00 km')).toBeTruthy()
  expect(screen.getByText('Elevação')).toBeTruthy()
})

it('traçado da rota sobre os números da atividade rende o previsto vs. feito', async () => {
  await importActivity()
  fireEvent.click(screen.getByRole('button', { name: 'Substituir tudo' }))
  expect(screen.getByText('58m')).toBeTruthy() // tempo real da atividade

  // agora troca só o desenho pela rota planejada
  fireEvent.click(screen.getByRole('button', { name: 'Minhas rotas' }))
  fireEvent.click(await screen.findByRole('button', { name: /Volta da lagoa/ }))
  fireEvent.click(await screen.findByRole('button', { name: 'Só o traçado' }))

  // o cruzamento aparece como dado novo, sem derrubar os números reais
  expect(screen.getByText('vs. previsto')).toBeTruthy()
  expect(screen.getByText('−7 min')).toBeTruthy()
  expect(screen.getByText('58m')).toBeTruthy()
  expect(screen.queryByText('Tempo previsto')).toBeNull()
})

it('cancelar não mexe no quadro', async () => {
  await importActivity()
  fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))

  expect(document.querySelector('.route-box')).toBeNull()
  expect(screen.getByText('4,85 km')).toBeTruthy()
  expect(screen.queryByRole('button', { name: 'Só o traçado' })).toBeNull()
})
