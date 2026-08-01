import { render, screen, fireEvent } from '@testing-library/react'
import { Provider } from 'jotai'
import App from '../src/components/App'
import { dict, errorText, localizeNumbers, hasKey, Key } from '../src/i18n'
import { SHAPES } from '../src/lib/shapes'
import { THEMES } from '../src/lib/themes'

const open = () => render(<Provider><App /></Provider>)
const btn = (name: string) => screen.getByRole('button', { name })
const stat = (label: string) => screen.getByText(label).closest('.stat') as HTMLElement

it('a suíte começa em português e o botão mostra qual está valendo', () => {
  open()
  expect(btn('PT').getAttribute('aria-pressed')).toBe('true')
  expect(btn('EN').getAttribute('aria-pressed')).toBe('false')
  expect(screen.getByText('Estatísticas')).toBeTruthy()
})

it('trocar de idioma reescreve a interface inteira', () => {
  open()
  fireEvent.click(btn('EN'))

  expect(screen.getByText('Stats')).toBeTruthy()
  expect(screen.getByText('Style')).toBeTruthy()
  expect(screen.getByText('Background photo')).toBeTruthy()
  expect(screen.queryByText('Estatísticas')).toBeNull()
})

it('a escolha fica salva, senão ela se perde ao recarregar', () => {
  open()
  fireEvent.click(btn('EN'))
  expect(localStorage.getItem('storyline_lang')).toBe('en')
})

it('o idioma vai junto pro documento, pra leitor de tela e busca', () => {
  open()
  fireEvent.click(btn('EN'))
  expect(document.documentElement.lang).toBe('en')
  expect(document.title).toBe(dict('en')('doc.title'))
})

it('os rótulos do quadro seguem o idioma, porque eles vão pra imagem', () => {
  open()
  expect(screen.getByText('Distância')).toBeTruthy()

  fireEvent.click(btn('EN'))
  expect(screen.getByText('Distance')).toBeTruthy()
  expect(screen.queryByText('Distância')).toBeNull()
})

it('o separador decimal do valor acompanha o idioma', () => {
  open()
  expect(stat('Distância').querySelector('.value')!.textContent).toBe('4,85 km')

  fireEvent.click(btn('EN'))
  expect(stat('Distance').querySelector('.value')!.textContent).toBe('4.85 km')
})

it('rótulo renomeado à mão não é atropelado pela troca de idioma', () => {
  open()
  const label = stat('Distância').querySelector('.label') as HTMLElement
  label.textContent = 'Distânça do rolê'
  fireEvent.blur(label)

  fireEvent.click(btn('EN'))
  expect(screen.getByText('Distânça do rolê')).toBeTruthy()
  expect(screen.queryByText('Distance')).toBeNull()
})

it('toda forma e todo tema têm entrada nos dois idiomas', () => {
  for (const nome of Object.keys(SHAPES)) {
    expect(hasKey(`shape.${nome}`), nome).toBe(true)
    expect(dict('en')(`shape.${nome}` as Key), nome).toBeTruthy()
  }
  for (const t of THEMES) {
    expect(dict('en')(`theme.${t.id}.label`), t.id).toBeTruthy()
    expect(dict('en')(`theme.${t.id}.hint`), t.id).toBeTruthy()
  }
})

it('erro conhecido é traduzido; o que vem de fora passa como está', () => {
  const t = dict('en')
  expect(errorText(new Error('err.gpxNoPoints'), t)).toBe('GPX has no trackpoints')
  // mensagem de rede ou do navegador não tem tradução: mostrar ela é melhor que engolir
  expect(errorText(new Error('NetworkError when attempting to fetch'), t)).toBe('NetworkError when attempting to fetch')
  expect(errorText('não é Error', t, 'err.render')).toBe('Could not generate the image')
})

it('só o separador decimal muda de idioma, o resto do valor fica', () => {
  expect(localizeNumbers('4,85 km', 'en')).toBe('4.85 km')
  expect(localizeNumbers('4.85 km', 'pt')).toBe('4,85 km')
  // nem tudo é número: hora, pace e unidade se escrevem igual nos dois
  expect(localizeNumbers('1h 13m', 'en')).toBe('1h 13m')
  expect(localizeNumbers(`15'03"/km`, 'en')).toBe(`15'03"/km`)
  expect(localizeNumbers('152 bpm', 'en')).toBe('152 bpm')
})
