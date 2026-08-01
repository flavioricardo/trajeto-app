import { render, screen, fireEvent } from '@testing-library/react'
import { Provider } from 'jotai'
import App from '../src/components/App'

/**
 * Posicionar é a interação central do app. Antes disto dava pra focar cada item
 * pelo teclado e não dava pra mover nenhum: falha de WCAG 2.1.1, e o axe não
 * pega porque o elemento é focável e tem nome.
 */
const open = () => {
  render(<Provider><App /></Provider>)
  fireEvent.click(screen.getByRole('tab', { name: 'Formas' }))
  fireEvent.click(screen.getByRole('button', { name: 'Corrida' }))
}

const rota = () => document.querySelector('.route-box') as HTMLElement
const dado = () => document.querySelector('.stat') as HTMLElement
const pos = (el: HTMLElement) => [el.style.left, el.style.top]
/** O controle de tamanho da rota. O de espessura, no painel Estilo, também é slider. */
const tamanho = () => document.querySelector('.resize') as HTMLElement

it('setas movem a rota, e shift anda mais', () => {
  open()
  expect(pos(rota())).toEqual(['15%', '8%'])

  fireEvent.keyDown(rota(), { key: 'ArrowRight' })
  fireEvent.keyDown(rota(), { key: 'ArrowDown' })
  expect(pos(rota())).toEqual(['16%', '9%'])

  fireEvent.keyDown(rota(), { key: 'ArrowLeft', shiftKey: true })
  expect(pos(rota())).toEqual(['11%', '9%'])
})

it('setas movem o bloco de dado', () => {
  open()
  const antes = pos(dado())
  fireEvent.keyDown(dado(), { key: 'ArrowRight' })
  expect(pos(dado())[0]).not.toBe(antes[0])
})

it('dentro do texto editável a seta é do cursor, não do bloco', () => {
  open()
  const antes = pos(dado())
  const label = dado().querySelector('.label') as HTMLElement
  fireEvent.keyDown(label, { key: 'ArrowRight', bubbles: true })
  expect(pos(dado())).toEqual(antes)
})

it('a rota não escapa do quadro pela seta', () => {
  open()
  for (let i = 0; i < 40; i++) fireEvent.keyDown(rota(), { key: 'ArrowLeft', shiftKey: true })
  expect(rota().style.left).toBe('-20%')
})

it('o controle de tamanho é um slider operável e anunciado', () => {
  open()
  const slider = tamanho()
  expect(slider.getAttribute('role')).toBe('slider')
  expect(slider.tabIndex).toBe(0)
  expect(slider.getAttribute('aria-valuemin')).toBe('15')
  expect(slider.getAttribute('aria-valuemax')).toBe('140')

  const antes = Number(slider.getAttribute('aria-valuenow'))
  fireEvent.keyDown(slider, { key: 'ArrowRight' })
  expect(Number(tamanho().getAttribute('aria-valuenow'))).toBe(antes + 2)

  fireEvent.keyDown(tamanho(), { key: 'Home' })
  expect(Number(tamanho().getAttribute('aria-valuenow'))).toBe(15)
  fireEvent.keyDown(tamanho(), { key: 'End' })
  expect(Number(tamanho().getAttribute('aria-valuenow'))).toBe(140)
})

it('a tecla do slider não move a rota junto', () => {
  open()
  const antes = pos(rota())
  fireEvent.keyDown(tamanho(), { key: 'ArrowRight', bubbles: true })
  expect(pos(rota())).toEqual(antes)
})
