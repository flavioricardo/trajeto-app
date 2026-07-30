import { snapTo, CANVAS_TARGETS, SNAP_THRESHOLD } from '../src/lib/guides'

it('gruda no alvo dentro do limiar e devolve a guia', () => {
  expect(snapTo(50.8, CANVAS_TARGETS)).toEqual({ value: 50, guide: 50 })
  expect(snapTo(0.5, CANVAS_TARGETS)).toEqual({ value: 0, guide: 0 })
})

it('não mexe no valor nem mostra guia fora do limiar', () => {
  expect(snapTo(40, CANVAS_TARGETS)).toEqual({ value: 40, guide: null })
  expect(snapTo(50 + SNAP_THRESHOLD + 0.1, CANVAS_TARGETS)).toEqual({
    value: 50 + SNAP_THRESHOLD + 0.1,
    guide: null,
  })
})

it('escolhe o alvo mais próximo quando há vários por perto', () => {
  expect(snapTo(30.4, [30, 31])).toEqual({ value: 30, guide: 30 })
  expect(snapTo(30.7, [30, 31])).toEqual({ value: 31, guide: 31 })
})

it('alinha com outros elementos, não só com o quadro', () => {
  const targets = [...CANVAS_TARGETS, 72]
  expect(snapTo(72.5, targets)).toEqual({ value: 72, guide: 72 })
})

it('sem alvos não há encaixe', () => {
  expect(snapTo(12.3, [])).toEqual({ value: 12.3, guide: null })
})

it('o valor encaixado não prende o elemento: a posição livre continua andando', () => {
  // simula o arrasto: deltas pequenos acumulam na posição livre, não na encaixada
  let free = 49
  const step = 0.4 // menor que o limiar, sozinho nunca escaparia do ímã
  const seen: (number | null)[] = []
  for (let i = 0; i < 8; i++) {
    free += step
    seen.push(snapTo(free, CANVAS_TARGETS).guide)
  }
  expect(seen).toContain(50) // grudou ao passar pelo centro
  expect(seen[seen.length - 1]).toBeNull() // e soltou do outro lado
})
