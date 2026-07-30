import { render, screen } from '@testing-library/react'
import { Provider, useSetAtom } from 'jotai'
import { useEffect } from 'react'
import App from '../src/components/App'
import { routeAtom } from '../src/state'

/** Monta o app já com uma rota no quadro, pra renderizar os controles da rota. */
function WithRoute() {
  const setRoute = useSetAtom(routeAtom)
  useEffect(() => {
    setRoute([{ x: 0.1, y: 0.1 }, { x: 0.9, y: 0.9 }])
  }, [setRoute])
  return <App />
}

const renderWithRoute = () => render(<Provider><WithRoute /></Provider>)

it('o traçado é filho direto da rota: o CSS que o estica depende disso', () => {
  renderWithRoute()
  const box = document.querySelector('.route-box') as HTMLElement

  // `.route-box > svg` estica pra 100%. Se o traçado deixar de ser filho direto,
  // o seletor para de valer; se virar descendente, ele espicha os ícones das alças.
  expect(box.querySelector(':scope > svg')).toBeTruthy()
  expect(box.querySelector(':scope > svg')?.querySelector('.route-path')).toBeTruthy()
})

it('os ícones dos controles pedem tamanho próprio, não o da caixa', () => {
  renderWithRoute()
  const icons = document.querySelectorAll('.grab svg, .resize svg, .remove svg')
  expect(icons.length).toBeGreaterThan(0)
  for (const icon of icons) {
    expect(icon.getAttribute('width')).toBe('12')
    expect(icon.getAttribute('height')).toBe('12')
  }
})

it('os controles do canvas usam a assinatura do Feather', () => {
  renderWithRoute()
  const icons = [...document.querySelectorAll('.grab svg, .resize svg, .remove svg')]
  expect(icons.length).toBeGreaterThan(0)
  for (const icon of icons) {
    expect(icon.getAttribute('viewBox')).toBe('0 0 24 24')
    expect(icon.getAttribute('fill')).toBe('none')
    expect(icon.getAttribute('stroke')).toBe('currentColor')
    expect(icon.getAttribute('stroke-linecap')).toBe('round')
  }
})

it('o fechar é mesmo o X do Feather, na geometria original', () => {
  renderWithRoute()
  const lines = [...document.querySelectorAll('.remove:first-of-type svg line')].slice(0, 2).map(
    l => [l.getAttribute('x1'), l.getAttribute('y1'), l.getAttribute('x2'), l.getAttribute('y2')].join(' '),
  )
  expect(lines).toEqual(['18 6 6 18', '6 6 18 18'])
})

it('a alça de arrastar não é anunciada como controle operável', () => {
  renderWithRoute()
  expect(document.querySelector('.stat .grab')?.getAttribute('aria-hidden')).toBe('true')
  // o bloco em si segue focável e rotulado
  expect(screen.getByLabelText('Rota. Arraste pra mover')).toBeTruthy()
})
