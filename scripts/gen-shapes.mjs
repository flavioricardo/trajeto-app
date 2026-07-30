/**
 * Gera src/lib/shapes-icons.ts amostrando ícones em polilinhas.
 *
 * Fontes, ambas MIT:
 *   Feather Icons — © Cole Bemis — https://github.com/feathericons/feather
 *   Tabler Icons  — © Paweł Kuna — https://github.com/tabler/tabler-icons
 *
 * O Feather cobre as formas decorativas, mas não tem nenhum ícone de esporte
 * (conferido: 0 de 287), então as modalidades vêm do Tabler, que nasceu na
 * mesma grade 24×24 com traço 2 e pontas arredondadas.
 *
 * Por que gerar pontos em vez de guardar o `d`: o app desenha a rota como
 * polilinha, no editor e no canvas do export. Achatar o caminho exige geometria
 * SVG de verdade (getPointAtLength), que o jsdom não implementa — fazer isso em
 * runtime tiraria as formas do alcance dos testes.
 *
 * Uso: npm i -D playwright && node scripts/gen-shapes.mjs
 * (o playwright fica fora do package.json de propósito: só serve pra regenerar)
 */
import { chromium } from 'playwright'
import { writeFileSync } from 'node:fs'

const path = d => `<path d="${d}"/>`

/** Modalidades — Tabler (o Feather não tem esporte). */
const ACTIVITIES = {
  Corrida: [
    'M11.007 5a2 2 0 1 0 4 0a2 2 0 1 0 -4 0',
    'M4 17l5 1l.75 -1.5',
    'M15 21v-4l-4 -3l1 -6',
    'M7 12v-3l5 -1l3 3l3 1',
  ].map(path),
  Pedal: [
    'M2 18a3 3 0 1 0 6 0a3 3 0 0 0 -6 0',
    'M16 18a3 3 0 1 0 6 0a3 3 0 0 0 -6 0',
    'M12 19v-4l-3 -3l5 -4l2 3h3',
    'M13.007 5a2 2 0 1 0 4 0a2 2 0 1 0 -4 0',
  ].map(path),
  Natação: [
    'M15 9a1 1 0 1 0 2 0a1 1 0 1 0 -2 0',
    'M6 11l4 -2l3.5 3l-1.5 2',
    'M3 16.75a2.4 2.4 0 0 0 1 .25a2.4 2.4 0 0 0 2 -1a2.4 2.4 0 0 1 2 -1a2.4 2.4 0 0 1 2 1a2.4 2.4 0 0 0 2 1a2.4 2.4 0 0 0 2 -1a2.4 2.4 0 0 1 2 -1a2.4 2.4 0 0 1 2 1a2.4 2.4 0 0 0 2 1a2.4 2.4 0 0 0 1 -.25',
  ].map(path),
  Caminhada: [
    'M12 4a1 1 0 1 0 2 0a1 1 0 1 0 -2 0',
    'M7 21l3 -4',
    'M16 21l-2 -4l-3 -3l1 -6',
    'M6 12l2 -3l4 -1l3 3l3 1',
  ].map(path),
  Trilha: [
    'M11 4a1 1 0 1 0 2 0a1 1 0 1 0 -2 0',
    'M7 21l2 -4',
    'M13 21v-4l-3 -3l1 -6l3 4l3 2',
    'M10 14l-1.827 -1.218a2 2 0 0 1 -.831 -2.15l.28 -1.117a2 2 0 0 1 1.939 -1.515h1.439l4 1l3 -2',
    'M17 12v9',
    'M16 20h2',
  ].map(path),
  Musculação: [
    'M2 12h1',
    'M6 8h-2a1 1 0 0 0 -1 1v6a1 1 0 0 0 1 1h2',
    'M6 7v10a1 1 0 0 0 1 1h1a1 1 0 0 0 1 -1v-10a1 1 0 0 0 -1 -1h-1a1 1 0 0 0 -1 1',
    'M9 12h6',
    'M15 7v10a1 1 0 0 0 1 1h1a1 1 0 0 0 1 -1v-10a1 1 0 0 0 -1 -1h-1a1 1 0 0 0 -1 1',
    'M18 8h2a1 1 0 0 1 1 1v6a1 1 0 0 1 -1 1h-2',
    'M22 12h-1',
  ].map(path),
  Yoga: [
    'M4 20h4l1.5 -3',
    'M17 20l-1 -5h-5l1 -7',
    'M4 10l4 -1l4 -1l4 1.5l4 1.5',
    'M10.007 5a2 2 0 1 0 4 0a2 2 0 1 0 -4 0',
  ].map(path),
  Skate: [
    'M5 15a2 2 0 1 0 4 0a2 2 0 1 0 -4 0',
    'M15 15a2 2 0 1 0 4 0a2 2 0 1 0 -4 0',
    'M3 9a2 1 0 0 0 2 1h14a2 1 0 0 0 2 -1',
  ].map(path),
  Remo: [
    'M6.414 6.414a2 2 0 0 0 0 -2.828l-1.414 -1.414l-2.828 2.828l1.414 1.414a2 2 0 0 0 2.828 0',
    'M17.586 17.586a2 2 0 0 0 0 2.828l1.414 1.414l2.828 -2.828l-1.414 -1.414a2 2 0 0 0 -2.828 0',
    'M6.5 6.5l11 11',
    'M22 2.5c-9.983 2.601 -17.627 7.952 -20 19.5c9.983 -2.601 17.627 -7.952 20 -19.5',
    'M6.5 12.5l5 5',
    'M12.5 6.5l5 5',
  ].map(path),
  Esqui: [
    'M17 17.5l-5 -4.5v-6l5 4',
    'M7 17.5l5 -4.5',
    'M15.103 21.58l6.762 -14.502a2 2 0 0 0 -.968 -2.657',
    'M8.897 21.58l-6.762 -14.503a2 2 0 0 1 .968 -2.657',
    'M7 11l5 -4',
    'M10.007 4a2 2 0 1 0 4 0a2 2 0 1 0 -4 0',
  ].map(path),
  Futebol: [
    'M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0',
    'M12 7l4.76 3.45l-1.76 5.55h-6l-1.76 -5.55l4.76 -3.45',
    'M12 7v-4m3 13l2.5 3m-.74 -8.55l3.74 -1.45m-11.44 7.05l-2.56 2.95m.74 -8.55l-3.74 -1.45',
  ].map(path),
  Vela: [
    'M2 20a2.4 2.4 0 0 0 2 1a2.4 2.4 0 0 0 2 -1a2.4 2.4 0 0 1 2 -1a2.4 2.4 0 0 1 2 1a2.4 2.4 0 0 0 2 1a2.4 2.4 0 0 0 2 -1a2.4 2.4 0 0 1 2 -1a2.4 2.4 0 0 1 2 1a2.4 2.4 0 0 0 2 1a2.4 2.4 0 0 0 2 -1',
    'M4 18l-1 -3h18l-1 3',
    'M11 12h7l-7 -9v9',
    'M8 7l-2 5',
  ].map(path),
}

/** Formas decorativas — Feather, que é o conjunto já usado na interface do app. */
const FUN = {
  Coração: ['<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>'],
  Estrela: ['<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>'],
  Círculo: ['<circle cx="12" cy="12" r="10"/>'],
  Raio: ['<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>'],
  Joinha: ['<path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>'],
  'Não curti': ['<path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/>'],
  // O Feather não tem calçado; este é o único decorativo vindo do Tabler.
  Tênis: [
    'M4 6h5.426a1 1 0 0 1 .863 .496l1.064 1.823a3 3 0 0 0 1.896 1.407l4.677 1.114a4 4 0 0 1 3.074 3.89v2.27a1 1 0 0 1 -1 1h-16a1 1 0 0 1 -1 -1v-10a1 1 0 0 1 1 -1',
    'M14 13l1 -2',
    'M8 18v-1a4 4 0 0 0 -4 -4h-1',
    'M10 12l1.5 -3',
  ].map(path),
}

/** Passo de amostragem no espaço 24×24 do ícone. Menor = mais liso e mais pesado. */
const STEP = 0.45

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' })
const page = await browser.newPage()
await page.setContent('<svg id="s" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"></svg>')

const sampled = {}
for (const [name, markup] of Object.entries({ ...ACTIVITIES, ...FUN })) {
  sampled[name] = await page.evaluate(
    ([markup, step]) => {
      const svg = document.getElementById('s')
      svg.innerHTML = markup.join('')
      const out = []
      for (const el of svg.querySelectorAll('path,circle,line,polyline,polygon,rect,ellipse')) {
        const len = el.getTotalLength()
        const n = Math.max(2, Math.round(len / step))
        const pts = []
        for (let i = 0; i <= n; i++) {
          const p = el.getPointAtLength((i / n) * len)
          pts.push([p.x, p.y])
        }
        // Um mesmo elemento pode ter subcaminhos soltos (o polegar e o punho do
        // ThumbsDown). O salto entre eles não tem comprimento, então aparece como
        // um pulo entre amostras vizinhas: corta ali, senão sai um risco ligando os dois.
        let run = [pts[0]]
        for (let i = 1; i < pts.length; i++) {
          const dx = pts[i][0] - pts[i - 1][0]
          const dy = pts[i][1] - pts[i - 1][1]
          if (Math.hypot(dx, dy) > step * 4) {
            if (run.length > 1) out.push(run)
            run = []
          }
          run.push(pts[i])
        }
        if (run.length > 1) out.push(run)
      }
      return out
    },
    [markup, STEP],
  )
}
await browser.close()

/** Encaixa o ícone em 0-1 preservando proporção e centralizando. */
function fit(subpaths) {
  const all = subpaths.flat()
  const xs = all.map(p => p[0])
  const ys = all.map(p => p[1])
  const minX = Math.min(...xs), maxX = Math.max(...xs)
  const minY = Math.min(...ys), maxY = Math.max(...ys)
  const scale = Math.max(maxX - minX, maxY - minY) || 1
  const padX = (1 - (maxX - minX) / scale) / 2
  const padY = (1 - (maxY - minY) / scale) / 2
  const r = v => Math.round(v * 1000) / 1000
  return subpaths.map(sp => sp.map(([x, y]) => [r((x - minX) / scale + padX), r((y - minY) / scale + padY)]))
}

const emit = names =>
  names
    .map(name => {
      const paths = fit(sampled[name])
        .map(sp => '    [' + sp.map(([x, y]) => `[${x},${y}]`).join(',') + ']')
        .join(',\n')
      return `  ${JSON.stringify(name)}: [\n${paths},\n  ]`
    })
    .join(',\n')

writeFileSync(
  new URL('../src/lib/shapes-icons.ts', import.meta.url),
  `// GERADO por scripts/gen-shapes.mjs — não editar à mão.
//
// Traçados derivados de Feather Icons (MIT, © Cole Bemis) e, para as
// modalidades e o tênis, de Tabler Icons (MIT, © Paweł Kuna).
import { Pt, Trace } from './geo'

type Raw = Record<string, [number, number][][]>

const trace = (raw: Raw): Record<string, Trace> =>
  Object.fromEntries(
    Object.entries(raw).map(([name, sub]) => [name, sub.map(sp => sp.map(([x, y]): Pt => ({ x, y })))]),
  )

const ACTIVITIES: Raw = {
${emit(Object.keys(ACTIVITIES))},
}

const FUN: Raw = {
${emit(Object.keys(FUN))},
}

export const ACTIVITY_SHAPES = trace(ACTIVITIES)
export const FUN_SHAPES = trace(FUN)
`,
)
console.log('ok:', Object.keys(sampled).length, 'formas')
