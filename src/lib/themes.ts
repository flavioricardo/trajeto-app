import { OverlayFont } from '../fonts'
import { Pt, Trace } from './geo'

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
  /**
   * Traço/lacuna alternados que corroem a tinta, em **múltiplos da espessura
   * da própria camada** — não em % do quadro. Precisa ser relativo: o usuário
   * mexe na espessura, e um padrão fixo vira contas de colar quando a linha
   * engrossa e some quando ela afina.
   */
  dash?: number[]
  /** desloca o início do padrão, pra que as falhas de duas camadas não coincidam */
  dashOffset?: number
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
  /** Geometria própria do tema, em 0-1, desenhada junto do traço. Ex.: os anéis do carimbo. */
  frame?: Trace
  /** Encolhe o traço em torno do centro pra caber dentro da moldura. */
  contentScale?: number
  /** Inclina o conteúdo do quadro, em graus. */
  rotate?: number
}

/** Círculo em 0-1 centrado no quadro, pros anéis da moldura. */
const ring = (r: number, n = 120): Pt[] =>
  Array.from({ length: n + 1 }, (_, i) => {
    const t = (i / n) * 2 * Math.PI
    return { x: 0.5 + r * Math.cos(t), y: 0.5 + r * Math.sin(t) }
  })

/**
 * Traçado final: o do usuário encolhido pela moldura, mais a geometria do tema.
 * Editor e export chamam a mesma função, então não há como divergirem.
 */
export function themedTrace(route: Trace, theme: Theme): Trace {
  const s = theme.contentScale ?? 1
  const scaled =
    s === 1
      ? route
      : route.map(sub => sub.map(p => ({ x: 0.5 + (p.x - 0.5) * s, y: 0.5 + (p.y - 0.5) * s })))
  return theme.frame ? [...scaled, ...theme.frame] : scaled
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
  palette: { routeColor: '#FF7EB6', textColor: '#FFFFFF', font: 'Baloo 2', strokeWidth: 1.8 },
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

// Carimbo de borracha: anéis em volta, tinta corroída e a impressão torta.
// O padrão de traço é longo e irregular de propósito — um tracejado regular
// leria como intenção, não como desgaste.
// Múltiplos da espessura: trechos longos de tinta cortados por fendas curtas.
// Trecho na ordem da própria espessura vira conta de colar, não rachadura.
const INK_BREAKS = [3.5, 0.2, 2.2, 0.16, 6, 0.26, 1.5, 0.17, 4.4, 0.22]

const CARIMBO: Theme = {
  id: 'carimbo',
  label: 'Carimbo',
  hint: 'Anéis, tinta corroída e a impressão batida torta.',
  palette: { routeColor: '#8E241D', textColor: '#8E241D', font: 'Rubik Doodle Shadow', strokeWidth: 2.4 },
  route: [
    { paint: 'route', width: 1.15, opacity: 0.5, dx: 0.5, dy: 0.55, dash: INK_BREAKS, dashOffset: 0.9 },
    { paint: 'route', width: 1, dash: INK_BREAKS },
    { paint: 'routeDark', width: 0.38, opacity: 0.55, dx: -0.15, dy: -0.15, dash: INK_BREAKS, dashOffset: 2.1 },
  ],
  // Sem sombra própria: a Rubik Doodle Shadow já traz a sombra no desenho da
  // letra, e somar outra deixaria o texto sujo.
  text: {},
  frame: [ring(0.49), ring(0.44)],
  contentScale: 0.62,
  rotate: -8,
}

export const THEMES: Theme[] = [PLAIN, TRIDI, MEDIEVAL, TECH, FOFO, CARIMBO]

export const themeById = (id: string): Theme => THEMES.find(t => t.id === id) ?? PLAIN
