type P = { size?: number }
const base = (size = 16) => ({
  width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
  stroke: 'currentColor', strokeWidth: 2.2, strokeLinecap: 'round', strokeLinejoin: 'round',
} as const)

export const IconResize = ({ size }: P) => (
  <svg {...base(size)} aria-hidden="true">
    <path d="M15 3h6v6M9 21H3v-15M21 3l-7 7M3 21l7-7" />
  </svg>
)

export const IconX = ({ size }: P) => (
  <svg {...base(size)} aria-hidden="true"><path d="M18 6L6 18M6 6l12 12" /></svg>
)

export const IconPlus = ({ size }: P) => (
  <svg {...base(size)} aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
)

export const IconDownload = ({ size }: P) => (
  <svg {...base(size)} aria-hidden="true"><path d="M12 3v12m0 0l-4-4m4 4l4-4M4 21h16" /></svg>
)
