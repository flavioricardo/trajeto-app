// Extrai o markup interno dos ícones do Feather, pra alimentar o gen-shapes.
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import * as Feather from 'react-feather'

const WANTED = ['Heart', 'Star', 'Circle', 'Zap', 'ThumbsUp', 'ThumbsDown']
for (const name of WANTED) {
  const html = renderToStaticMarkup(createElement(Feather[name], { size: 24 }))
  const inner = html.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '')
  console.log(`###${name}`)
  console.log(inner)
}
