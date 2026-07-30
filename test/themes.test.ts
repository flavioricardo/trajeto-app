import { THEMES, themeById, shade, paintOf, themedTrace } from '../src/lib/themes'
import { OVERLAY_FONTS } from '../src/fonts'

it('shade escurece e clareia, e ignora entrada inválida', () => {
  expect(shade('#808080', -1)).toBe('#000000')
  expect(shade('#808080', 1)).toBe('#ffffff')
  expect(shade('#808080', 0)).toBe('#808080')
  expect(shade('não é cor', -0.5)).toBe('não é cor')
})

it('paintOf resolve os tokens contra as cores atuais', () => {
  expect(paintOf('route', '#FF4D12', '#FFFFFF')).toBe('#FF4D12')
  expect(paintOf('#123456', '#FF4D12', '#FFFFFF')).toBe('#123456')
  // derivadas seguem a cor escolhida pelo usuário, não uma cor fixa do tema
  expect(paintOf('routeDark', '#808080', '#FFFFFF')).toBe(paintOf('routeDark', '#808080', '#000000'))
  expect(paintOf('routeDark', '#808080', '#FFF')).not.toBe('#808080')
})

it('todo tema tem ao menos uma camada de traço e paleta completa', () => {
  for (const t of THEMES) {
    expect(t.route.length, t.id).toBeGreaterThan(0)
    for (const l of t.route) expect(l.width, t.id).toBeGreaterThan(0)
    expect(t.palette.routeColor, t.id).toMatch(/^#[\da-f]{6}$/i)
    expect(t.palette.textColor, t.id).toMatch(/^#[\da-f]{6}$/i)
    expect(t.palette.strokeWidth, t.id).toBeGreaterThan(0)
    expect(t.label, t.id).toBeTruthy()
    expect(t.hint, t.id).toBeTruthy()
  }
})

it('os ids são únicos e themeById cai no tema limpo se não achar', () => {
  const ids = THEMES.map(t => t.id)
  expect(new Set(ids).size).toBe(ids.length)
  expect(themeById('não existe').id).toBe('plain')
  expect(themeById('tech').id).toBe('tech')
})

it('o tema limpo não desenha efeito nenhum', () => {
  const plain = themeById('plain')
  expect(plain.route).toHaveLength(1)
  expect(plain.route[0]).toEqual({ paint: 'route', width: 1 })
  expect(plain.text).toEqual({})
})

it('todo tema usa uma fonte que o app carrega', () => {
  for (const t of THEMES) {
    expect(OVERLAY_FONTS, t.id).toContain(t.palette.font)
  }
})

it('o Fofo tem brilho no traço e no texto', () => {
  const fofo = themeById('fofo')
  expect(fofo.route.some(l => l.glow)).toBe(true)
  expect(fofo.text.shadow?.blur).toBeGreaterThan(0)
})

it('o Carimbo é monocromático e bate fora de registro', () => {
  const c = themeById('carimbo')
  // tinta única: texto e traço na mesma cor
  expect(c.palette.textColor).toBe(c.palette.routeColor)
  // pelo menos uma camada deslocada e translúcida, que é a batida irregular
  expect(c.route.some(l => (l.dx || l.dy) && (l.opacity ?? 1) < 1)).toBe(true)
})

it('themedTrace encolhe o conteúdo e acrescenta a moldura', () => {
  const route = [[{ x: 0, y: 0 }, { x: 1, y: 1 }]]
  const carimbo = themeById('carimbo')
  const out = themedTrace(route, carimbo)

  // o traço do usuário encolheu em torno do centro
  expect(out[0][0].x).toBeCloseTo(0.5 - 0.5 * carimbo.contentScale!, 6)
  expect(out[0][1].x).toBeCloseTo(0.5 + 0.5 * carimbo.contentScale!, 6)
  // e a moldura entrou como subcaminhos extras
  expect(out.length).toBe(route.length + carimbo.frame!.length)
})

it('themedTrace devolve o traço intacto quando o tema não tem moldura', () => {
  const route = [[{ x: 0.2, y: 0.3 }, { x: 0.8, y: 0.7 }]]
  expect(themedTrace(route, themeById('plain'))).toEqual(route)
})

it('a moldura do carimbo fica dentro do quadro e envolve o conteúdo', () => {
  const c = themeById('carimbo')
  for (const anel of c.frame!) {
    for (const p of anel) {
      expect(p.x).toBeGreaterThanOrEqual(0)
      expect(p.x).toBeLessThanOrEqual(1)
    }
  }
  // o conteúdo encolhido cabe dentro do anel interno, senão encostaria na moldura
  const raioInterno = 0.44
  const meiaDiagonal = (c.contentScale! * Math.SQRT2) / 2
  expect(meiaDiagonal).toBeLessThan(raioInterno)
})

it('o carimbo corrói a tinta e bate torto', () => {
  const c = themeById('carimbo')
  expect(c.rotate).toBeTruthy()
  expect(c.route.every(l => l.dash?.length)).toBe(true)
  // as falhas de camadas diferentes não podem coincidir, senão viram tracejado
  const offsets = c.route.map(l => l.dashOffset ?? 0)
  expect(new Set(offsets).size).toBe(offsets.length)
})

it('nenhum tema traz o personagem da Sanrio', () => {
  // Hello Kitty é marca registrada: o tema kawaii é original, sem personagem
  const texto = JSON.stringify(THEMES).toLowerCase()
  expect(texto).not.toContain('kitty')
  expect(texto).not.toContain('sanrio')
})
