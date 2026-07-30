export const OVERLAY_FONTS = ['Archivo Black', 'Bebas Neue', 'Space Mono', 'Lora', 'Caveat', 'Fredoka'] as const
export type OverlayFont = (typeof OVERLAY_FONTS)[number]
