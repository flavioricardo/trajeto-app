export const OVERLAY_FONTS = ['Archivo Black', 'Bebas Neue', 'Space Mono', 'Lora', 'Caveat', 'Fredoka', 'Baloo 2', 'Rubik Doodle Shadow'] as const
export type OverlayFont = (typeof OVERLAY_FONTS)[number]
