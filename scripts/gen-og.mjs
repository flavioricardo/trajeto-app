/**
 * Gera public/og.png e public/apple-touch-icon.png.
 *
 * Por que gerar em vez de desenhar à mão: o cartão usa a mesma marca do header
 * (Archivo Black, "line" em laranja) e as mesmas curvas de nível. Escrever o
 * layout aqui é o que mantém os dois iguais quando um deles mudar — e as redes
 * sociais não rasterizam SVG em og:image, então precisa sair PNG.
 *
 * As fontes vêm do Google e entram embutidas como data URI: o Chromium desta
 * caixa não alcança fonts.googleapis.com, mas o fetch do node alcança o
 * gstatic. Sem embutir, o cartão sairia na fonte de sistema.
 *
 * Uso: npm i -D playwright && node scripts/gen-og.mjs
 * (o playwright fica fora do package.json de propósito: só serve pra regerar)
 */
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

const FONTS = {
  black: 'https://fonts.gstatic.com/s/archivoblack/v23/HTxqL289NzCGg4MzN6KJ7eW6OYs.ttf',
  regular: 'https://fonts.gstatic.com/s/archivo/v25/k3k6o8UDI-1M0wlSV9XAw6lQkqWY8Q82sJaRE-NWIDdgffTTNDNp8A.ttf',
}

const dataUri = async url => {
  const buf = Buffer.from(await (await fetch(url)).arrayBuffer())
  return `data:font/ttf;base64,${buf.toString('base64')}`
}
const [black, regular] = await Promise.all([dataUri(FONTS.black), dataUri(FONTS.regular)])

/** Tokens de src/styles.css. Repetidos porque o cartão não passa pelo bundle. */
const PAPER = '#edefec'
const INK = '#17201b'
const ACCENT = '#ff4d12'
const CONTOUR = '#c9cfc7'
const MOSS = '#5e6b5f'

/** Mesmas curvas do <Contours> do header, em escala de cartaz. */
const contours = (w, h) => {
  const rings = [0, 10, 22, 36, 52, 68, 86]
  const paths = rings
    .map(r => `M ${300 - r} 45 q ${8 + r} ${-30 - r} ${60 + r * 2} ${-8 - r} q 40 18 30 ${40 + r}`)
    .map(d => `<path d="${d}" fill="none" stroke="${CONTOUR}" stroke-width="1"/>`)
    .join('')
  return `<svg viewBox="0 0 400 90" preserveAspectRatio="xMaxYMid slice" width="${w}" height="${h}">${paths}</svg>`
}

/**
 * O traço é o produto, então tem que parecer trajeto gravado e não onda de
 * enfeite: uma curva limpa lê como decoração. A base é amostrada e cada ponto
 * sacudido, que é como um GPS entrega — o mesmo getPointAtLength do
 * gen-shapes.mjs, aqui só pra sujar o traço. O ruído é semeado, senão a imagem
 * mudava a cada regeração.
 */
const BASE = 'M 30 296 C 74 236 92 168 152 158 C 214 148 226 214 286 226 C 340 236 356 190 330 160 \
C 306 132 258 148 258 186 C 258 232 300 268 372 262 C 452 255 470 150 540 148 C 594 146 612 200 656 196'
const SAMPLE_STEP = 7
const JITTER = 3.4

const traceRoute = async page => {
  await page.setContent(`<svg id="s" viewBox="0 0 680 340"><path id="p" d="${BASE}"/></svg>`)
  return page.evaluate(
    ([step, jitter]) => {
      const el = document.getElementById('p')
      const len = el.getTotalLength()
      const n = Math.round(len / step)
      // LCG: ruído reprodutível, porque Math.random mudaria o PNG a cada rodada.
      let seed = 20260805
      const noise = () => (((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff) - 0.5) * 2 * jitter
      const pts = []
      for (let i = 0; i <= n; i++) {
        const p = el.getPointAtLength((i / n) * len)
        pts.push(`${(p.x + noise()).toFixed(1)},${(p.y + noise()).toFixed(1)}`)
      }
      return pts.join(' ')
    },
    [SAMPLE_STEP, JITTER],
  )
}

const card = route => `<!doctype html>
<meta charset="utf-8">
<style>
  @font-face { font-family: 'Archivo Black'; src: url('${black}') format('truetype'); }
  @font-face { font-family: 'Archivo'; src: url('${regular}') format('truetype'); }
  * { margin: 0; box-sizing: border-box; }
  body { width: 1200px; height: 630px; background: ${PAPER}; color: ${INK};
         font-family: 'Archivo', sans-serif; overflow: hidden; }
  .card { position: relative; width: 100%; height: 100%; padding: 74px 80px; }
  .contours { position: absolute; inset: 0; opacity: 0.55; }
  .contours svg { width: 100%; height: 100%; }
  .brand { position: relative; font-family: 'Archivo Black', sans-serif;
           font-size: 92px; letter-spacing: 0.04em; text-transform: uppercase; line-height: 1; }
  .brand em { font-style: normal; color: ${ACCENT}; }
  .tagline { position: relative; margin-top: 18px; font-size: 30px; color: ${MOSS}; }
  .route { position: absolute; left: 62px; right: 62px; bottom: 40px; height: 340px; }
  /* Os números são o overlay que o app entrega, junto do traço que os gerou. */
  .stats { position: absolute; right: 80px; bottom: 62px; text-align: right; }
  .stats b { display: block; font-family: 'Archivo Black', sans-serif; font-size: 58px; line-height: 1; }
  .stats span { display: block; margin-top: 8px; font-size: 21px; letter-spacing: 0.16em;
                text-transform: uppercase; color: ${MOSS}; }
</style>
<div class="card">
  <div class="contours">${contours(1200, 630)}</div>
  <h1 class="brand">Story<em>line</em></h1>
  <p class="tagline">Sua atividade vira imagem pro story</p>
  <svg class="route" viewBox="0 0 680 340" fill="none">
    <polyline points="${route}" stroke="${ACCENT}" stroke-width="13"
              stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
  <div class="stats"><b>12,4 km</b><span>Distância</span></div>
</div>`

/** Marca de aba: a rota, sem texto — 16px não cabe palavra. */
const icon = `<!doctype html>
<meta charset="utf-8">
<style>
  * { margin: 0; }
  body { width: 180px; height: 180px; background: ${PAPER}; }
</style>
<svg width="180" height="180" viewBox="0 0 180 180" fill="none">
  <path d="M 22 118 C 46 60, 76 52, 96 84 S 130 140, 158 96"
        stroke="${ACCENT}" stroke-width="20" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`

mkdirSync(new URL('../public/', import.meta.url), { recursive: true })
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' })

const sampler = await browser.newPage()
const route = await traceRoute(sampler)
await sampler.close()

for (const [html, size, file] of [
  [card(route), { width: 1200, height: 630 }, 'og.png'],
  [icon, { width: 180, height: 180 }, 'apple-touch-icon.png'],
]) {
  const page = await browser.newPage({ viewport: size, deviceScaleFactor: 1 })
  await page.setContent(html)
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({ path: new URL(`../public/${file}`, import.meta.url).pathname })
  await page.close()
  console.log('ok:', file)
}

await browser.close()
