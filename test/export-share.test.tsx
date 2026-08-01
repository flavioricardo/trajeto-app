import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Provider } from 'jotai'
import App from '../src/components/App'

// O canvas não existe no jsdom, e o que está sob teste é a decisão entre
// compartilhar e baixar — não o desenho.
vi.mock('../src/lib/export', () => ({
  renderOverlay: vi.fn(async () => new Blob(['imagem'], { type: 'image/png' })),
}))

let cliques: string[]

beforeEach(() => {
  cliques = []
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
    cliques.push(this.download)
  })
  vi.stubGlobal('URL', {
    ...URL,
    createObjectURL: vi.fn(() => 'blob:fake'),
    revokeObjectURL: vi.fn(),
  })
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

/** Instala um Web Share que se comporta do jeito pedido. */
const comShare = (share: () => Promise<void>) => {
  Object.defineProperty(navigator, 'canShare', { value: () => true, configurable: true })
  Object.defineProperty(navigator, 'share', { value: share, configurable: true })
}
const semShare = () => {
  Object.defineProperty(navigator, 'canShare', { value: undefined, configurable: true })
}

const salvar = async () => {
  render(<Provider><App /></Provider>)
  fireEvent.click(screen.getByRole('button', { name: /Salvar/ }))
}

it('sem Web Share, baixa o arquivo direto', async () => {
  semShare()
  await salvar()
  await waitFor(() => expect(cliques).toEqual(['storyline-story.png']))
})

it('share que falha cai pro download em vez de sumir', async () => {
  // A ativação do clique expira enquanto o canvas renderiza, e o share rejeita.
  // Antes isso era engolido: o botão voltava do "Gerando…" sem entregar nada.
  comShare(() => Promise.reject(new DOMException('user activation', 'NotAllowedError')))
  await salvar()
  await waitFor(() => expect(cliques).toEqual(['storyline-story.png']))
})

it('share cancelado pelo usuário não força download', async () => {
  // Fechar a folha de compartilhamento é escolha dele: baixar seria atropelar.
  comShare(() => Promise.reject(new DOMException('abort', 'AbortError')))
  await salvar()
  await new Promise(r => setTimeout(r, 50))
  expect(cliques).toEqual([])
})

it('share que dá certo não baixa nada por cima', async () => {
  comShare(() => Promise.resolve())
  await salvar()
  await new Promise(r => setTimeout(r, 50))
  expect(cliques).toEqual([])
})

it('falha ao gerar a imagem aparece pro usuário, em vez de silêncio', async () => {
  const { renderOverlay } = await import('../src/lib/export')
  vi.mocked(renderOverlay).mockRejectedValueOnce(new Error('Falha ao gerar a imagem'))
  semShare()
  await salvar()

  const alerta = await screen.findByRole('alert')
  expect(alerta.textContent).toContain('Falha ao gerar a imagem')
  // e o botão volta a ficar disponível
  expect(screen.getByRole('button', { name: /Salvar/ })).toBeTruthy()
})
