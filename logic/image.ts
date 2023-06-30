import type { ComparionState, Diff, Segment } from './types'

export const HightlightFactor = 1.8

export async function segmentImage(dataurl: string, gridSize = 16) {
  const img = new Image()
  img.src = dataurl
  await new Promise<any>(resolve => img.addEventListener('load', resolve))

  const canvasSize = 1024
  const canvas = document.createElement('canvas')
  canvas.width = canvasSize
  canvas.height = canvasSize
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  ctx.drawImage(img, 0, 0, canvasSize, canvasSize)

  const cellSize = canvasSize / gridSize
  const cells: Segment[] = []

  for (let i = 0; i < gridSize * gridSize; i++) {
    const x = i % gridSize
    const y = Math.floor(i / gridSize)
    const data = ctx.getImageData(x * cellSize, y * cellSize, cellSize, cellSize)
    const color = getAverageColor(data)
    const luminance = (color[0] * 299 + color[1] * 587 + color[2] * 114) / 1000 * (color[3] / 255)
    cells.push(markRaw({
      index: i,
      x,
      y,
      data,
      color,
      hex: rgbaToHex(...color),
      dataUrl: '',
      luminance,
      expected: 0,
      value: luminance >= 128 ? 1 : 0,
      isMargin: false,
    }))
  }

  return cells
}

export function compareSegments(segments: Segment[], qrcodeSegments: Segment[], state: ComparionState): Diff {
  const {
    gridMarginSize: marginSize,
    gridSize,
    diffThreshold,
  } = state

  for (const seg of segments) {
    seg.expected = qrcodeSegments[seg.index].value
    const { x, y } = seg
    seg.isMargin = x < marginSize || y < marginSize || x >= gridSize - marginSize || y >= gridSize - marginSize
  }

  const mainSegments = segments.filter(i => !i.isMargin)
  const avarageLuminance = mainSegments.reduce((a, b) => a + b.luminance, 0) / mainSegments.length

  const lightSegments = mainSegments.filter(i => i.expected)
  const darkSegments = mainSegments.filter(i => i.expected === 0)

  const lightLuminance = lightSegments.reduce((a, b) => a + b.luminance, 0) / lightSegments.length
  const darkLuminance = darkSegments.reduce((a, b) => a + b.luminance, 0) / darkSegments.length

  segments.forEach((i) => {
    const dislight = Math.abs(i.luminance - lightLuminance)
    const disdark = Math.abs(i.luminance - darkLuminance)
    const dis = Math.abs(dislight - disdark)
    i.value = dis < diffThreshold
      ? -1
      : dislight < disdark ? 1 : 0
  })

  const mismatchDark = mainSegments
    .filter(i => i.expected === 1 && i.value !== i.expected)
    .sort((a, b) => a.luminance - b.luminance)
  const mismatchLight = mainSegments
    .filter(i => i.expected === 0 && i.value !== i.expected)
    .sort((a, b) => b.luminance - a.luminance)
  const mismatchCount = mismatchDark.length + mismatchLight.length

  return {
    segments,
    mainSegments,
    mismatchDark,
    mismatchLight,
    mismatchCount,
    avarageLuminance,
    lightLuminance,
    darkLuminance,
  }
}

export function generateMask(
  diff: Diff,
  state: ComparionState,
  type: 'mask' | 'correction',
) {
  const canvasSize = 2000
  const cellSize = canvasSize / state.gridSize
  const canvas = document.createElement('canvas')
  canvas.width = canvasSize
  canvas.height = canvasSize
  const ctx = canvas.getContext('2d')!

  if (type === 'mask') {
    ctx.fillStyle = '#fff'
    for (const segment of diff.mismatchLight)
      ctx.fillRect(segment.x * cellSize, segment.y * cellSize, cellSize, cellSize)
    for (const segment of diff.mismatchDark)
      ctx.fillRect(segment.x * cellSize, segment.y * cellSize, cellSize, cellSize)
  }
  else {
    function getOpacity(luminance: number) {
      return Math.min(255, Math.abs(diff.darkLuminance - luminance) * HightlightFactor) / 255
    }
    ctx.fillStyle = '#000000'
    for (const segment of diff.mismatchLight) {
      ctx.globalAlpha = getOpacity(segment.luminance)
      ctx.fillRect(segment.x * cellSize, segment.y * cellSize, cellSize, cellSize)
    }
    ctx.fillStyle = '#ffffff'
    for (const segment of diff.mismatchDark) {
      ctx.globalAlpha = getOpacity(segment.luminance)
      ctx.fillRect(segment.x * cellSize, segment.y * cellSize, cellSize, cellSize)
    }
  }

  return canvas.toDataURL()
}

export function imageDataToDataUrl(data: ImageData) {
  const canvas = document.createElement('canvas')
  canvas.width = data.width
  canvas.height = data.height
  const ctx = canvas.getContext('2d')!
  ctx.putImageData(data, 0, 0)
  return canvas.toDataURL()
}

function getAverageColor(data: ImageData): [number, number, number, number] {
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

function rgbaToHex(r: number, g: number, b: number, a: number) {
  return `#${[r, g, b, a].map(c => c.toString(16).padStart(2, '0')).join('')}`
}
