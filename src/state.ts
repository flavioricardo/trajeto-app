import { atom } from 'jotai'
import { Trace } from './lib/geo'
import { ImportKind, ImportResult } from './lib/strava'
import { OverlayFont } from './fonts'
import { Key, detectLang, dict } from './i18n'
import { ThemeId } from './lib/themes'
import { formatDistance, formatDuration } from './lib/format'

export type Preset = 'story' | 'feed'
export const PRESETS: Record<Preset, { w: number; h: number; label: string }> = {
  story: { w: 1080, h: 1920, label: 'Story 9:16' },
  feed: { w: 1080, h: 1080, label: 'Feed 1:1' },
}

/**
 * Posições e tamanhos sempre em % (0-100) da largura/altura do canvas.
 *
 * `key` diz de qual rótulo do dicionário o texto veio, e é o que permite
 * reescrevê-lo quando o idioma muda. Editar o rótulo na mão apaga a chave: dali
 * em diante o texto é do usuário, e trocar de idioma não mexe mais nele.
 */
export type StatElement = { id: string; key?: Key; label: string; value: string; x: number; y: number }
export type RouteBox = { x: number; y: number; size: number } // size = % da largura
export type Style = { routeColor: string; textColor: string; font: OverlayFont; strokeWidth: number }

export const presetAtom = atom<Preset>('story')
export const routeAtom = atom<Trace | null>(null)
export const routeBoxAtom = atom<RouteBox>({ x: 15, y: 8, size: 70 })
export const styleAtom = atom<Style>({ routeColor: '#FF4D12', textColor: '#FFFFFF', font: 'Archivo Black', strokeWidth: 1.2 })

/**
 * Foto de fundo escolhida pelo usuário. `url` é um object URL: mora na memória
 * da aba, não vai pro servidor e morre quando a aba fecha. Nada de persistir.
 */
export type Photo = { url: string; name: string }
export const photoAtom = atom<Photo | null>(null)

/** Com foto no quadro, o padrão é entregar a composição pronta. */
export const photoInExportAtom = atom(true)

/** Tema visual do conteúdo do quadro. Ver lib/themes. */
export const themeAtom = atom<ThemeId>('plain')

/** Guias de alinhamento visíveis durante o arrasto. Estado efêmero de UI, some ao soltar. */
export const guidesAtom = atom<{ x: number | null; y: number | null }>({ x: null, y: null })

/** Última importação de cada tipo, pra poder cruzar o previsto da rota com o feito da atividade. */
export const importsAtom = atom<Partial<Record<ImportKind, ImportResult>>>({})

let nextId = 1
export const newStat = (label: string, value: string, x = 8, y = 62, key?: Key): StatElement =>
  ({ id: String(nextId++), key, label, value, x, y })

/** Exemplo do quadro vazio, no idioma detectado. */
const demo = (): StatElement[] => {
  const lang = detectLang()
  const t = dict(lang)
  return [
    newStat(t('stat.distance'), formatDistance(4850, lang), 8, 58, 'stat.distance'),
    newStat(t('stat.time'), formatDuration(4380), 8, 72, 'stat.time'),
  ]
}

export const elementsAtom = atom<StatElement[]>(demo())
