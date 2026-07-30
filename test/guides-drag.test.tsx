import { render, screen, fireEvent } from '@testing-library/react'
import { Provider } from 'jotai'
import App from '../src/components/App'

const W = 400
const H = 700

/** jsdom não traz PointerEvent, e sem ele o clientX do arrasto se perde. MouseEvent já carrega. */
class PointerEventPolyfill extends MouseEvent {
  pointerId: number
  constructor(type: string, props: PointerEventInit = {}) {
    super(type, props)
    this.pointerId = props.pointerId ?? 1
  }
}

beforeEach(() => {
  // jsdom não implementa pointer capture nem layout: os dois são necessários pro arrasto rodar.
  vi.stubGlobal('PointerEvent', PointerEventPolyfill)
  Element.prototype.setPointerCapture = vi.fn()
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
    width: W, height: H, top: 0, left: 0, right: W, bottom: H, x: 0, y: 0, toJSON: () => ({}),
  })
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

const statEl = () => screen.getByText('Distância').closest('.stat') as HTMLElement

/** Arrasta o bloco em pixels, como o navegador faria. */
const drag = (el: HTMLElement, dxPx: number, dyPx: number) => {
  fireEvent.pointerDown(el, { clientX: 0, clientY: 0 })
  fireEvent.pointerMove(el, { clientX: dxPx, clientY: dyPx })
}

it('mostra a guia vertical ao encostar no centro do quadro', () => {
  render(<Provider><App /></Provider>)
  const stat = statEl()
  expect(stat.style.left).toBe('8%')

  // 42% da largura leva de 8% ao centro (50%)
  drag(stat, (42 / 100) * W, 0)

  expect(screen.getByTestId('guide-v')).toBeTruthy()
  expect(screen.queryByTestId('guide-h')).toBeNull()
  expect(statEl().style.left).toBe('50%')
})

it('a guia some ao soltar', () => {
  render(<Provider><App /></Provider>)
  const stat = statEl()
  drag(stat, (42 / 100) * W, 0)
  expect(screen.getByTestId('guide-v')).toBeTruthy()

  fireEvent.pointerUp(stat)
  expect(screen.queryByTestId('guide-v')).toBeNull()
})

it('sem alvo por perto não há guia e a posição é livre', () => {
  render(<Provider><App /></Provider>)
  drag(statEl(), (20 / 100) * W, 0)

  expect(screen.queryByTestId('guide-v')).toBeNull()
  expect(statEl().style.left).toBe('28%')
})

it('alinha um dado ao outro, não só ao quadro', () => {
  render(<Provider><App /></Provider>)
  // "Tempo" nasce em y=72; arrastar "Distância" de y=58 pra perto disso deve grudar
  drag(statEl(), 0, (13.8 / 100) * H)

  expect(screen.getByTestId('guide-h')).toBeTruthy()
  expect(statEl().style.top).toBe('72%')
})
