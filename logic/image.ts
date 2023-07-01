export function imageDataToDataUrl(data: ImageData) {
  const canvas = document.createElement('canvas')
  canvas.width = data.width
  canvas.height = data.height
  const ctx = canvas.getContext('2d')!
  ctx.putImageData(data, 0, 0)
  return canvas.toDataURL()
}

export function getAverageColor(data: ImageData): [number, number, number, number] {
  let r = 0
  let g = 0
  let b = 0
  let a = 0

  for (let i = 0; i < data.data.length; i += 4) {
    r += data.data[i]
    g += data.data[i + 1]
    b += data.data[i + 2]
    a += data.data[i + 3]
  }

  const count = data.data.length / 4

  r = Math.round(r / count)
  g = Math.round(g / count)
  b = Math.round(b / count)
  a = Math.round(a / count)

  return [r, g, b, a]
}

export function rgbaToHex(r: number, g: number, b: number, a: number) {
  return `#${[r, g, b, a].map(c => c.toString(16).padStart(2, '0')).join('')}`
}
