/**
 * Foto de fundo. Vive só na aba: `URL.createObjectURL` aponta pra memória do
 * navegador, não sobe pra lugar nenhum e morre quando a aba fecha.
 */

/** Recorte da origem que preenche o destino sem distorcer — o mesmo que `object-fit: cover`. */
export function coverRect(iw: number, ih: number, dw: number, dh: number) {
  const scale = Math.max(dw / iw, dh / ih)
  const sw = Math.min(iw, dw / scale)
  const sh = Math.min(ih, dh / scale)
  return { sx: (iw - sw) / 2, sy: (ih - sh) / 2, sw, sh }
}

export function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('err.photoRead'))
    img.src = url
  })
}
