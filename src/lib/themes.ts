import { OverlayFont } from '../fonts'

/**
 * Um tema pinta o conteúdo do quadro: o traço e os dados.
 *
 * O traço é desenhado em camadas, de baixo pra cima — é isso que permite
 * extrusão 3D (cópias deslocadas), contorno (camada grossa embaixo) e néon
 * (camada larga e brilhante embaixo de um núcleo fino).
 *
 * Toda medida de espessura e deslocamento é relativa: espessura multiplica a
 * escolhida pelo usuário, e deslocamento/brilho são % da largura do quadro.
 * Assim o tema vale igual no editor e no PNG, que têm tamanhos diferentes.
 */

/** Cor da camada: literal em hex, ou derivada da cor que o usuário escolheu. */
export type Paint = 'route' | 'routeDark' | 'routeLight' | (string & {})

export type RouteLayer = {
  paint: Paint
  /** multiplica a espessura escolhida pelo usuário */
  width: number
  /** deslocamento em % da largura do quadro */
  dx?: number
  dy?: number
  /** brilho ao redor, em % da largura do quadro */
  glow?: { paint: Paint; blur: number }
  opacity?: number
}

export type TextTheme = {
  /** contorno ao redor das letras, largura em % da largura do quadro */
  outline?: { paint: Paint; width: number }
  shadow?: { paint: Paint; dx: number; dy: number; blur: number }
}

export type Theme = {
  id: string
  label: string
  hint: string
  /** aplicado ao estilo ao escolher o tema; o usuário pode ajustar depois */
  palette: { routeColor: string; textColor: string; font: OverlayFont; strokeWidth: number }
  route: RouteLayer[]
  text: TextTheme
}

const clampByte = (v: number) => Math.min(255, Math.max(0, Math.round(v)))

/** Clareia (amount > 0) ou escurece (amount < 0) um hex. */
export function shade(hex: string, amount: number): string {
  const m = /^#?([\da-f]{6})$/i.exec(hex.trim())
  if (!m) return hex
  const n = parseInt(m[1], 16)
  const parts = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(c =>
    clampByte(amount >= 0 ? c + (255 - c) * amount : c * (1 + amount)),
  )
  return '#' + parts.map(c => c.toString(16).padStart(2, '0')).join('')
}

/** Resolve o token da camada contra as cores atuais. */
export function paintOf(paint: Paint, routeColor: string, textColor: string): string {
  switch (paint) {
    case 'route': return routeColor
    case 'routeDark': return shade(routeColor, -0.55)
    case 'routeLight': return shade(routeColor, 0.5)
    case 'text': return textColor
    default: return paint
  }
}

const PLAIN: Theme = {
  id: 'plain',
  label: 'Nenhum',
  hint: 'O traço limpo, do jeito que sempre foi.',
  palette: { routeColor: '#FF4D12', textColor: '#FFFFFF', font: 'Archivo Black', strokeWidth: 1.2 },
  route: [{ paint: 'route', width: 1 }],
  text: {},
}

// Extrusão: cópias escurecidas em diagonal decrescente dão volume sem sombra borrada.
const TRIDI: Theme = {
  id: '3d',
  label: '3D',
  hint: 'Traço com volume, extrudado na diagonal.',
  palette: { routeColor: '#FF4D12', textColor: '#FFFFFF', font: 'Archivo Black', strokeWidth: 1.4 },
  route: [
    { paint: 'routeDark', width: 1, dx: 1.6, dy: 1.6 },
    { paint: 'routeDark', width: 1, dx: 1.2, dy: 1.2 },
    { paint: 'routeDark', width: 1, dx: 0.8, dy: 0.8 },
    { paint: 'routeDark', width: 1, dx: 0.4, dy: 0.4 },
    { paint: 'route', width: 1 },
  ],
  text: { shadow: { paint: 'routeDark', dx: 0.9, dy: 0.9, blur: 0 } },
}

// Manuscrito: tinta sépia sobre contorno escuro, serifa com contraste.
const MEDIEVAL: Theme = {
  id: 'medieval',
  label: 'Medieval',
  hint: 'Tinta e ouro sobre pergaminho, com serifa.',
  palette: { routeColor: '#C9A227', textColor: '#F4E7C8', font: 'Lora', strokeWidth: 1.6 },
  route: [
    { paint: '#3A2A16', width: 2, dx: 0.15, dy: 0.15 },
    { paint: 'route', width: 1 },
    { paint: 'routeLight', width: 0.3, dx: -0.2, dy: -0.2, opacity: 0.7 },
  ],
  text: { outline: { paint: '#3A2A16', width: 0.55 } },
}

// Néon: halo largo e fraco, linha média brilhante, núcleo branco fino.
const TECH: Theme = {
  id: 'tech',
  label: 'Futurista',
  hint: 'Néon sobre grade, com monoespaçada.',
  palette: { routeColor: '#22E1FF', textColor: '#EAFDFF', font: 'Space Mono', strokeWidth: 0.9 },
  route: [
    { paint: 'route', width: 2.6, opacity: 0.22, glow: { paint: 'route', blur: 3.2 } },
    { paint: 'route', width: 1, glow: { paint: 'route', blur: 1.4 } },
    { paint: '#FFFFFF', width: 0.32 },
  ],
  text: { shadow: { paint: 'route', dx: 0, dy: 0, blur: 2.2 } },
}

// Kawaii original: rosa pastel, contorno branco, brilho suave e letra
// arredondada. Nada de personagem: Hello Kitty é marca registrada da Sanrio.
const FOFO: Theme = {
  id: 'fofo',
  label: 'Fofo',
  hint: 'Rosa pastel com brilho, contorno branco e letra arredondada.',
  palette: { routeColor: '#FF7EB6', textColor: '#FFFFFF', font: 'Fredoka', strokeWidth: 1.8 },
  route: [
    { paint: 'route', width: 2.4, opacity: 0.4, glow: { paint: 'route', blur: 2.8 } },
    { paint: '#FFFFFF', width: 1.9 },
    { paint: 'route', width: 1 },
    { paint: 'routeLight', width: 0.28, dy: -0.25, opacity: 0.85 },
  ],
  text: {
    outline: { paint: 'route', width: 0.7 },
    shadow: { paint: 'route', dx: 0, dy: 0, blur: 1.6 },
  },
}

// Carimbo de borracha: tinta única, batida fora de registro e cobertura
// irregular. A fonte condensada em caixa alta é metade da leitura.
const CARIMBO: Theme = {
  id: 'carimbo',
  label: 'Carimbo',
  hint: 'Tinta única batida fora de registro, em caixa alta condensada.',
  palette: { routeColor: '#A8231B', textColor: '#A8231B', font: 'Bebas Neue', strokeWidth: 1.5 },
  route: [
    { paint: 'route', width: 1.3, opacity: 0.32, dx: 0.55, dy: 0.6 },
    { paint: 'route', width: 1, opacity: 0.9 },
    { paint: 'routeDark', width: 0.42, opacity: 0.35, dx: -0.16, dy: -0.16 },
  ],
  text: { shadow: { paint: 'route', dx: 0.22, dy: 0.24, blur: 0.35 } },
}

export const THEMES: Theme[] = [PLAIN, TRIDI, MEDIEVAL, TECH, FOFO, CARIMBO]

export const themeById = (id: string): Theme => THEMES.find(t => t.id === id) ?? PLAIN
