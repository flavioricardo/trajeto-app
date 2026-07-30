import { decodePolyline } from '../src/lib/polyline'
import { parseActivityUrl } from '../src/lib/strava'

it('decodePolyline vetor oficial google', () => {
  const pts = decodePolyline('_p~iF~ps|U_ulLnnqC_mqNvxq`@')
  expect(pts).toHaveLength(3)
  expect(pts[0].lat).toBeCloseTo(38.5, 4)
  expect(pts[0].lon).toBeCloseTo(-120.2, 4)
  expect(pts[2].lat).toBeCloseTo(43.252, 3)
  expect(pts[2].lon).toBeCloseTo(-126.453, 3)
})

it('parseActivityUrl aceita as formas que o Strava dá pra copiar', () => {
  const id = (s: string) => parseActivityUrl(s)
  expect(id('https://www.strava.com/activities/12345678901')).toEqual({ kind: 'id', id: '12345678901' })
  expect(id('strava.com/activities/999?share=abc')).toEqual({ kind: 'id', id: '999' })
  expect(id('https://www.strava.com/activities/555/overview')).toEqual({ kind: 'id', id: '555' })
  expect(id('  https://STRAVA.com/Activities/777  ')).toEqual({ kind: 'id', id: '777' })
  // id colado sozinho
  expect(id('12345678901')).toEqual({ kind: 'id', id: '12345678901' })
})

it('parseActivityUrl reconhece o link curto de compartilhar', () => {
  // o botão Compartilhar do app do Strava devolve esse formato
  expect(parseActivityUrl('https://strava.app.link/4ft9gn9Nc5b')).toEqual({
    kind: 'short',
    url: 'https://strava.app.link/4ft9gn9Nc5b',
  })
  // sem protocolo também
  expect(parseActivityUrl('strava.app.link/4ft9gn9Nc5b')).toEqual({
    kind: 'short',
    url: 'https://strava.app.link/4ft9gn9Nc5b',
  })
})

it('parseActivityUrl recusa o que não é atividade', () => {
  expect(parseActivityUrl('https://example.com/foo')).toBeNull()
  expect(parseActivityUrl('texto qualquer')).toBeNull()
  expect(parseActivityUrl('')).toBeNull()
  // número curto demais pra ser id de atividade
  expect(parseActivityUrl('42')).toBeNull()
})
