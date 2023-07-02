import seedrandom from 'seedrandom'

import { QrCode, QrCodeEcc, QrSegment } from '../vendor/qrcodegen'
import type { QRCodeGeneratorState } from './types'
import { qrcode } from './state'
import { effects } from './effects'

const eccMap = {
  L: QrCodeEcc.LOW,
  M: QrCodeEcc.MEDIUM,
  Q: QrCodeEcc.QUARTILE,
  H: QrCodeEcc.HIGH,
}

interface MarkerInfo {
  x: number
  y: number
  position: 'top-left' | 'top-right' | 'bottom-left'
}

interface PixelInfo {
  x: number
  y: number
  isDark: boolean
  marker?: MarkerInfo
}

export function generateQRCode(canvas: HTMLCanvasElement, state: QRCodeGeneratorState) {
  if (!canvas)
    return

  const seg = QrSegment.makeSegments(state.text)
  const qr = QrCode.encodeSegments(
    seg,
    eccMap[state.ecc],
    state.minVersion,
    state.maxVersion,
    state.maskPattern,
    state.boostECC,
  )

  qrcode.value = qr

  const {
    scale: cell,
    rotate,
    margin,
    marginNoise,
    seed,
    marginNoiseRate,
    marginNoiseSpace,
    pixelStyle,
    markerStyle,
    markerShape,
    invert,
  } = state

  const lightColor = invert ? state.darkColor : state.lightColor
  const darkColor = invert ? state.lightColor : state.darkColor

  if (cell <= 0 || margin < 0)
    throw new RangeError('Value out of range')
  const halfcell = cell / 2
  const width: number = (qr.size + margin * 2) * cell
  canvas.width = width
  canvas.height = width
  const ctx = canvas.getContext('2d', { willReadFrequently: true }) as CanvasRenderingContext2D

  const borderRng = seedrandom(String(seed))
  const styleRng = seedrandom(String(seed))
  const markerRng = seedrandom(String(seed))

  ctx.fillStyle = lightColor
  ctx.fillRect(0, 0, width, width)

  const marginSize = qr.size + margin * 2

  function getInfo(x: number, y: number): PixelInfo {
    let isBorder = marginNoiseSpace === 'full'
      ? x < -1 || y < -1 || x > qr.size || y > qr.size
      : x < 0 || y < 0 || x >= qr.size || y >= qr.size

    if (marginNoiseSpace === 'marker') {
      if (x >= -1 && x <= 7 && y >= -1 && y <= 7)
        isBorder = false
      if (x >= -1 && x <= 7 && y >= qr.size - 7 && y <= qr.size)
        isBorder = false
      if (x >= qr.size - 7 && x <= qr.size && y >= -1 && y <= 7)
        isBorder = false
    }

    let isDark = false
    if (isBorder && marginNoise)
      isDark = borderRng() < marginNoiseRate
    else
      isDark = qr.getModule(x, y)

    let marker: MarkerInfo | undefined

    if (x >= 0 && x < 7 && y >= 0 && y < 7) {
      marker = {
        x,
        y,
        position: 'top-left',
      }
    }
    else if (x >= 0 && x < 7 && y >= qr.size - 7 && y < qr.size) {
      marker = {
        x,
        y: y - qr.size + 7,
        position: 'bottom-left',
      }
    }
    else if (x >= qr.size - 7 && x < qr.size && y >= 0 && y < 7) {
      marker = {
        x: x - qr.size + 7,
        y,
        position: 'top-right',
      }
    }

    if (marker && markerShape === 'plus') {
      if (!((marker.x >= 2 && marker.x <= 4) || (marker.y >= 2 && marker.y <= 4)))
        isDark = false
    }
    else if (marker && markerShape === 'box') {
      if (!((marker.x >= 1 && marker.x <= 5) || (marker.y >= 1 && marker.y <= 5)))
        isDark = false
    }
    else if (marker && markerShape === 'random') {
      if (!((marker.x >= 2 && marker.x <= 4) || (marker.y >= 2 && marker.y <= 4))) {
        if (isDark)
          isDark = markerRng() < 0.5
      }
    }

    let targetX = (x + margin)
    let targetY = (y + margin)

    if (rotate === 90) {
      targetX = marginSize - targetX - 1
      ;[targetX, targetY] = [targetY, targetX]
    }
    else if (rotate === 180) {
      targetX = marginSize - targetX - 1
      targetY = marginSize - targetY - 1
    }
    else if (rotate === 270) {
      targetY = marginSize - targetY - 1
      ;[targetX, targetY] = [targetY, targetX]
    }

    return {
      isDark,
      marker,
      x: targetX,
      y: targetY,
    }
  }

  ctx.fillStyle = darkColor

  const pixels: PixelInfo[] = []

  for (let y = -margin; y < qr.size + margin; y++) {
    for (let x = -margin; x < qr.size + margin; x++)
      pixels.push(getInfo(x, y))
  }

  for (const { isDark, marker, x, y } of pixels) {
    let _pixelStyle = pixelStyle
    let _markerStyle = markerStyle

    if (_markerStyle === 'auto')
      _markerStyle = pixelStyle

    if (marker)
      _pixelStyle = _markerStyle

    if (marker) {
      if (markerShape === 'circle') {
        if (marker.x !== 3 || marker.y !== 3)
          continue

        const cX = x * cell + halfcell
        const cY = y * cell + halfcell

        ctx.beginPath()
        ctx.fillStyle = darkColor
        ctx.arc(cX, cY, cell * 3.5, 0, Math.PI * 2)
        ctx.fill()

        ctx.beginPath()
        ctx.fillStyle = lightColor
        ctx.arc(cX, cY, cell * 2.5, 0, Math.PI * 2)
        ctx.fill()

        ctx.beginPath()
        ctx.fillStyle = darkColor
        ctx.arc(cX, cY, cell * 1.5, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    function square() {
      ctx.fillRect(x * cell, y * cell, cell, cell)
    }

    function dot() {
      ctx.fillStyle = isDark ? darkColor : lightColor
      ctx.beginPath()
      ctx.arc(x * cell + halfcell, y * cell + halfcell, halfcell, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = darkColor
    }

    function corner(index: number) {
      const pos = [
        [0, 0], // top left
        [0, halfcell], // bottom left
        [halfcell, 0], // top right
        [halfcell, halfcell], // bottom right
      ][index]
      ctx.fillRect(x * cell + pos[0], y * cell + pos[1], halfcell, halfcell)
    }

    if (!isDark && _pixelStyle !== 'rounded')
      continue

    if (_pixelStyle === 'mixed')
      _pixelStyle = styleRng() < 0.5 ? 'squircle' : 'square'

    if (_pixelStyle === 'dot') {
      dot()
    }
    else if (_pixelStyle === 'squircle') {
      dot()
      for (let i = 0; i < 4; i++) {
        if (styleRng() < 0.5)
          corner(i)
      }
    }
    else if (_pixelStyle === 'rounded' || _pixelStyle === 'row' || _pixelStyle === 'column') {
      const top = pixels.find(p => p.x === x && p.y === y - 1)?.isDark !== false
      const bottom = pixels.find(p => p.x === x && p.y === y + 1)?.isDark !== false
      const left = pixels.find(p => p.x === x - 1 && p.y === y)?.isDark !== false
      const right = pixels.find(p => p.x === x + 1 && p.y === y)?.isDark !== false
      const topLeft = pixels.find(p => p.x === x - 1 && p.y === y - 1)?.isDark !== false
      const topRight = pixels.find(p => p.x === x + 1 && p.y === y - 1)?.isDark !== false
      const bottomLeft = pixels.find(p => p.x === x - 1 && p.y === y + 1)?.isDark !== false
      const bottomRight = pixels.find(p => p.x === x + 1 && p.y === y + 1)?.isDark !== false

      if (isDark) {
        if (top && _pixelStyle !== 'row') {
          corner(0)
          corner(2)
        }
        if (bottom && _pixelStyle !== 'row') {
          corner(1)
          corner(3)
        }
        if (left && _pixelStyle !== 'column') {
          corner(0)
          corner(1)
        }
        if (right && _pixelStyle !== 'column') {
          corner(2)
          corner(3)
        }
      }
      else {
        if (top && left && topLeft)
          corner(0)
        if (top && right && topRight)
          corner(2)
        if (bottom && left && bottomLeft)
          corner(1)
        if (bottom && right && bottomRight)
          corner(3)
      }

      dot()
    }
    else {
      square()
    }
  }

  if (state.effect === 'crystalize') {
    const data = ctx.getImageData(0, 0, width, width)
    const newData = effects.crystalize(data, state.effectCrystalizeRadius, state.seed)
    ctx.putImageData(newData, 0, 0)
  }
}
