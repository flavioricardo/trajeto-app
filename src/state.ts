import { atom } from 'jotai'
import { Pt } from './lib/geo'
import { ImportKind, ImportResult } from './lib/strava'
import { OverlayFont } from './fonts'

export type Preset = 'story' | 'feed'
export const PRESETS: Record<Preset, { w: number; h: number; label: string }> = {
  story: { w: 1080, h: 1920, label: 'Story 9:16' },
  feed: { w: 1080, h: 1080, label: 'Feed 1:1' },
}

/** Posições e tamanhos sempre em % (0-100) da largura/altura do canvas. */
export type StatElement = { id: string; label: string; value: string; x: number; y: number }
export type RouteBox = { x: number; y: number; size: number } // size = % da largura
export type Style = { routeColor: string; textColor: string; font: OverlayFont; strokeWidth: number }

export const presetAtom = atom<Preset>('story')
export const routeAtom = atom<Pt[] | null>(null)
export const routeBoxAtom = atom<RouteBox>({ x: 15, y: 8, size: 70 })
export const styleAtom = atom<Style>({ routeColor: '#FF4D12', textColor: '#FFFFFF', font: 'Archivo Black', strokeWidth: 1.2 })

/** Guias de alinhamento visíveis durante o arrasto. Estado efêmero de UI, some ao soltar. */
export const guidesAtom = atom<{ x: number | null; y: number | null }>({ x: null, y: null })

/** Última importação de cada tipo, pra poder cruzar o previsto da rota com o feito da atividade. */
export const importsAtom = atom<Partial<Record<ImportKind, ImportResult>>>({})

let nextId = 1
export const newStat = (label: string, value: string, x = 8, y = 62): StatElement => ({ id: String(nextId++), label, value, x, y })

export const elementsAtom = atom<StatElement[]>([
  newStat('Distância', '4,85 km', 8, 58),
  newStat('Tempo', '1h 13m', 8, 72),
])
