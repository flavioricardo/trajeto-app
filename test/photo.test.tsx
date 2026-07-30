import { render, screen, fireEvent } from '@testing-library/react'
import { Provider } from 'jotai'
import App from '../src/components/App'
import { coverRect } from '../src/lib/photo'

it('coverRect preenche o destino sem distorcer, cortando o excesso', () => {
  // foto quadrada num quadro 9:16: sobra largura, então o corte é lateral
  const r = coverRect(1000, 1000, 1080, 1920)
  expect(r.sh).toBe(1000)
  expect(r.sw).toBeCloseTo(1000 * (1080 / 1920), 6)
  expect(r.sx).toBeCloseTo((1000 - r.sw) / 2, 6) // centralizado
  expect(r.sy).toBe(0)
})

it('coverRect corta a altura quando a foto é mais larga que o quadro', () => {
  const r = coverRect(4000, 1000, 1080, 1080)
  expect(r.sw).toBeCloseTo(1000, 6)
  expect(r.sh).toBeCloseTo(1000, 6)
  expect(r.sy).toBeCloseTo(0, 6)
  expect(r.sx).toBeCloseTo(1500, 6)
})

it('coverRect nunca pede recorte maior que a foto', () => {
  for (const [iw, ih] of [[100, 3000], [3000, 100], [800, 600]]) {
    const r = coverRect(iw, ih, 1080, 1920)
    expect(r.sw).toBeLessThanOrEqual(iw)
    expect(r.sh).toBeLessThanOrEqual(ih)
  }
})

const arquivo = (nome = 'foto.jpg') => new File([new Uint8Array([1, 2, 3])], nome, { type: 'image/jpeg' })

const subir = (nome?: string) => {
  const criados: string[] = []
  const revogados: string[] = []
  vi.stubGlobal('URL', {
    ...URL,
    createObjectURL: vi.fn(() => {
      const u = `blob:fake-${criados.length}`
      criados.push(u)
      return u
    }),
    revokeObjectURL: vi.fn((u: string) => revogados.push(u)),
  })
  render(<Provider><App /></Provider>)
  fireEvent.change(screen.getByLabelText('Escolha uma foto'), { target: { files: [arquivo(nome)] } })
  return { criados, revogados }
}

afterEach(() => vi.unstubAllGlobals())

it('a foto escolhida vira o fundo do quadro', () => {
  subir('corrida.jpg')
  const img = screen.getByTestId('photo') as HTMLImageElement
  expect(img.getAttribute('src')).toBe('blob:fake-0')
  expect(screen.getByTestId('editor').className).toContain('has-photo')
  expect(screen.getByText('corrida.jpg')).toBeTruthy()
})

it('a foto fica só no navegador: nada de rede nem de armazenamento', () => {
  const fetchSpy = vi.fn()
  vi.stubGlobal('fetch', fetchSpy)
  subir()

  expect(fetchSpy).not.toHaveBeenCalled()
  // nada persistido: recarregar a aba tem que perder a foto
  expect(localStorage.length).toBe(0)
  expect(sessionStorage.length).toBe(0)
})

it('trocar ou remover a foto libera o object URL anterior', () => {
  const { revogados } = subir()
  expect(revogados).toEqual([])

  fireEvent.click(screen.getByRole('button', { name: 'Remover foto' }))
  expect(revogados).toEqual(['blob:fake-0'])
  expect(screen.queryByTestId('photo')).toBeNull()
})

it('com foto, o padrão é salvar a composição, e dá pra voltar ao PNG transparente', () => {
  subir()
  const check = screen.getByRole('checkbox', { name: /Salvar a imagem com a foto/ }) as HTMLInputElement
  expect(check.checked).toBe(true)
  expect(screen.getByText(/JPEG com a foto e o overlay/)).toBeTruthy()

  fireEvent.click(check)
  expect(screen.getByText(/PNG transparente de sempre/)).toBeTruthy()
})
