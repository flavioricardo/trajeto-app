import { THEMES, themeById, shade, paintOf } from '../src/lib/themes'
import { dict } from '../src/i18n'
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
    expect(dict('pt')(`theme.${t.id}.label`), t.id).toBeTruthy()
    expect(dict('pt')(`theme.${t.id}.hint`), t.id).toBeTruthy()
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

it('o Carimbo imita a fonte: contorno vazado e sombra riscada', () => {
  const c = themeById('carimbo')
  // tinta única: texto e traço na mesma cor
  expect(c.palette.textColor).toBe(c.palette.routeColor)
  // o miolo é aberto, que é o vazado da letra
  expect(c.carve).toBeGreaterThan(0)
  // e a sombra é riscada e deslocada, não cópia chapada do contorno
  const sombra = c.route.find(l => l.ticks)!
  expect(sombra).toBeTruthy()
  expect(sombra.dx || sombra.dy).toBeTruthy()
  expect(c.rotate).toBeTruthy()
})

it('o vazado deixa borda de sobra: miolo não pode engolir a linha', () => {
  for (const t of THEMES) {
    if (t.carve == null) continue
    expect(t.carve, t.id).toBeGreaterThan(0)
    expect(t.carve, t.id).toBeLessThan(1)
  }
})

it('o risco deixa vão de sobra, senão a sombra vira cor chapada', () => {
  for (const t of THEMES) {
    for (const l of t.route) {
      if (!l.ticks) continue
      expect(l.ticks.gap, t.id).toBeGreaterThanOrEqual(l.ticks.length)
      expect(l.ticks.length, t.id).toBeGreaterThan(0)
    }
  }
})

it('a camada riscada é deslocada, senão o corpo cobre os riscos inteiros', () => {
  for (const t of THEMES) {
    for (const l of t.route) {
      if (!l.ticks) continue
      expect(Math.abs(l.dx ?? 0) + Math.abs(l.dy ?? 0), t.id).toBeGreaterThan(0)
    }
  }
})

it('nenhum tema desenha moldura própria: os anéis saíram do Carimbo', () => {
  expect(THEMES.some(t => 'frame' in t)).toBe(false)
})

it('nenhum tema traz o personagem da Sanrio', () => {
  // Hello Kitty é marca registrada: o tema kawaii é original, sem personagem
  const texto = JSON.stringify(THEMES).toLowerCase()
  expect(texto).not.toContain('kitty')
  expect(texto).not.toContain('sanrio')
})
