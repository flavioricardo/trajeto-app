import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Provider } from 'jotai'
import App from '../src/components/App'

const openShapes = () => {
  render(<Provider><App /></Provider>)
  fireEvent.click(screen.getByRole('tab', { name: 'Formas' }))
}

// no RTL a comparação por string já é do nome acessível inteiro
const shapeBtn = (name: string) => screen.getByRole('button', { name })

it('nenhuma forma nasce marcada', () => {
  openShapes()
  for (const name of ['Coração', 'Estrela', 'Tênis']) {
    expect(shapeBtn(name).getAttribute('aria-pressed')).toBe('false')
  }
})

it('a forma escolhida fica marcada, e só ela', () => {
  openShapes()
  fireEvent.click(shapeBtn('Estrela'))

  expect(shapeBtn('Estrela').getAttribute('aria-pressed')).toBe('true')
  for (const other of ['Coração', 'Círculo', 'Tênis', 'Joinha']) {
    expect(shapeBtn(other).getAttribute('aria-pressed'), other).toBe('false')
  }
})

it('escolher outra forma move a marcação', () => {
  openShapes()
  fireEvent.click(shapeBtn('Estrela'))
  fireEvent.click(shapeBtn('Joinha'))

  expect(shapeBtn('Joinha').getAttribute('aria-pressed')).toBe('true')
  expect(shapeBtn('Estrela').getAttribute('aria-pressed')).toBe('false')
})

it('rota vinda de outra origem não marca forma nenhuma', async () => {
  openShapes()
  fireEvent.click(shapeBtn('Coração'))
  expect(shapeBtn('Coração').getAttribute('aria-pressed')).toBe('true')

  // um GPX qualquer substitui a rota: a marcação tem que sumir
  fireEvent.click(screen.getByRole('tab', { name: 'GPX' }))
  const gpx = `<gpx><trk><trkseg>
    <trkpt lat="-19.0" lon="-44.0"><ele>800</ele></trkpt>
    <trkpt lat="-19.1" lon="-44.1"><ele>820</ele></trkpt>
  </trkseg></trk></gpx>`
  const file = new File([gpx], 'rota.gpx', { type: 'application/gpx+xml' })
  Object.defineProperty(file, 'text', { value: async () => gpx })
  fireEvent.change(screen.getByLabelText('Arquivo GPX da atividade'), { target: { files: [file] } })

  await waitFor(() => expect(document.querySelector('.route-box')).toBeTruthy())
  fireEvent.click(screen.getByRole('tab', { name: 'Formas' }))
  expect(shapeBtn('Coração').getAttribute('aria-pressed')).toBe('false')
})
