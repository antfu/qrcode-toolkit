import { getAverageColor, rgbaToHex } from './image'
import type { ComparionState, Diff, Segment } from './types'
import { resolveMargin } from './utils'

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

  const shortSide = Math.min(img.width, img.height)
  ctx.drawImage(img,
    (img.width - shortSide) / 2,
    (img.height - shortSide) / 2,
    shortSide,
    shortSide,
    0,
    0,
    canvasSize,
    canvasSize,
  )

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
    gridSize,
    diffThreshold,
  } = state

  const margin = resolveMargin(state.gridMarginSize)
  const marginSize = Math.min(margin.left, margin.top, margin.right, margin.bottom)

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
