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

it('a corrosão acompanha a espessura em vez de virar conta de colar', () => {
  open()
  fireEvent.click(themeBtn('Carimbo'))
  const dash = () => document.querySelector('.route-box path')!.getAttribute('stroke-dasharray')!.split(' ').map(Number)

  const antes = dash()
  fireEvent.change(screen.getByLabelText(/^Traço/), { target: { value: '1' } })
  const depois = dash()

  // afinar o traço encolhe o padrão inteiro na mesma proporção: trecho de tinta
  // da ordem da espessura vira quadradinho, e é isso que o teste impede
  const razao = antes[0] / depois[0]
  expect(razao).toBeGreaterThan(1)
  expect(antes[1] / depois[1]).toBeCloseTo(razao, 6)
})

it('camada corroída usa ponta reta, senão a lacuna some', () => {
  open()
  fireEvent.click(themeBtn('Carimbo'))
  expect(document.querySelector('.route-box path')!.getAttribute('stroke-linecap')).toBe('butt')

  fireEvent.click(themeBtn('Nenhum'))
  expect(document.querySelector('.route-box path')!.getAttribute('stroke-linecap')).toBe('round')
})

it('o texto recebe contorno e sombra do tema', () => {
  open()
  fireEvent.click(themeBtn('Fofo'))
  const stat = screen.getByText('Distância').closest('.stat') as HTMLElement
  expect(stat.style.getPropertyValue('-webkit-text-stroke-width')).toBe('0.7cqw')

  fireEvent.click(themeBtn('3D'))
  expect(stat.style.textShadow).toContain('cqw')
})
