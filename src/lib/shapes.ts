import { Trace } from './geo'
import { ACTIVITY_SHAPES, FUN_SHAPES } from './shapes-icons'

export { ACTIVITY_SHAPES, FUN_SHAPES }

/** Modalidades primeiro: o app serve mais que corrida, e a lista diz isso. */
export const SHAPES: Record<string, Trace> = { ...ACTIVITY_SHAPES, ...FUN_SHAPES }
