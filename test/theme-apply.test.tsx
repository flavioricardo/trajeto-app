import { render, screen, fireEvent } from '@testing-library/react'
import { Provider } from 'jotai'
import App from '../src/components/App'
import { themeById } from '../src/lib/themes'

const open = () => {
  render(<Provider><App /></Provider>)
  fireEvent.click(screen.getByRole('tab', { name: 'Formas' }))
  fireEvent.click(screen.getByRole('button', { name: 'Corrida' }))
}

const themeBtn = (name: string) => screen.getByRole('button', { name })

it('começa sem tema e marca o escolhido', () => {
  open()
  expect(themeBtn('Nenhum').getAttribute('aria-pressed')).toBe('true')

  fireEvent.click(themeBtn('Futurista'))
  expect(themeBtn('Futurista').getAttribute('aria-pressed')).toBe('true')
  expect(themeBtn('Nenhum').getAttribute('aria-pressed')).toBe('false')
})

it('o tema aplica a paleta nos controles de Estilo', () => {
  open()
  fireEvent.click(themeBtn('Fofo'))

  const fofo = themeById('fofo')
  expect((screen.getByLabelText('Cor da rota') as HTMLInputElement).value)
    .toBe(fofo.palette.routeColor.toLowerCase())
  expect((screen.getByLabelText('Fonte') as HTMLSelectElement).value).toBe(fofo.palette.font)
})

it('o traço ganha uma camada por camada do tema', () => {
  open()
  const paths = () => document.querySelectorAll('.route-box .route-path')

  expect(paths()).toHaveLength(themeById('plain').route.length)
  fireEvent.click(themeBtn('3D'))
  expect(paths()).toHaveLength(themeById('3d').route.length)
  expect(paths().length).toBeGreaterThan(1) // a extrusão precisa de cópias
})

it('as camadas seguem a cor que o usuário escolher, não uma cor fixa', () => {
  open()
  fireEvent.click(themeBtn('3D'))
  fireEvent.change(screen.getByLabelText('Cor da rota'), { target: { value: '#00ff00' } })

  const strokes = [...document.querySelectorAll('.route-box .route-path')].map(p => p.getAttribute('stroke'))
  expect(strokes).toContain('#00ff00')
  // a sombra da extrusão é derivada da nova cor, então não sobrou nada de laranja
  expect(strokes.some(s => s?.toLowerCase().startsWith('#ff4d12'))).toBe(false)
})

it('camada vazada ganha máscara que abre o miolo do traço', () => {
  open()
  fireEvent.click(themeBtn('Carimbo'))

  const paths = [...document.querySelectorAll('.route-box > svg > g path')]
  expect(paths.length).toBeGreaterThan(0)
  expect(paths.every(p => p.getAttribute('mask')?.startsWith('url(#hollow-'))).toBe(true)

  // a máscara é branca por fora e preta no miolo, e o miolo é mais fino
  const mask = document.querySelector('.route-box mask')!
  const [fora, miolo] = [...mask.querySelectorAll('path')].map(p => Number(p.getAttribute('stroke-width')))
  expect(miolo).toBeLessThan(fora)
})

it('tema sem vazado não ganha máscara', () => {
  open()
  fireEvent.click(themeBtn('Nenhum'))
  expect(document.querySelector('.route-box path')!.getAttribute('mask')).toBeNull()
})

it('o texto recebe contorno e sombra do tema', () => {
  open()
  fireEvent.click(themeBtn('Fofo'))
  const stat = screen.getByText('Distância').closest('.stat') as HTMLElement
  expect(stat.style.getPropertyValue('-webkit-text-stroke-width')).toBe('0.7cqw')

  fireEvent.click(themeBtn('3D'))
  expect(stat.style.textShadow).toContain('cqw')
})
