import seedrandom from 'seedrandom'

import { QrCode, QrCodeEcc, QrSegment } from '../vendor/qrcodegen'
import type { QRCodeGeneratorState } from './types'
import { generateQRCodeInfo, qrcode } from './state'
import { effects } from './effects'
import { resolveMargin } from './utils'

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
  isCenter: boolean
  isBorder: boolean
  isInner: boolean
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

  let innerMarkerShape = state.markerInnerShape
  if (innerMarkerShape === 'auto') {
    if (markerShape === 'circle')
      innerMarkerShape = 'circle'
    else if (markerShape === 'tiny-plus')
      innerMarkerShape = 'plus'
    else if (markerShape === 'octagon')
      innerMarkerShape = 'diamond'
    else
      innerMarkerShape = 'square'
  }

  const lightColor = invert ? state.darkColor : state.lightColor
  const darkColor = invert ? state.lightColor : state.darkColor

  const {
    top: marginTop,
    right: marginRight,
    bottom: marginBottom,
    left: marginLeft,
  } = resolveMargin(margin)

  const halfcell = cell / 2
  const width: number = (qr.size + marginLeft + marginRight) * cell
  const height: number = (qr.size + marginTop + marginBottom) * cell
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d', { willReadFrequently: true }) as CanvasRenderingContext2D

  generateQRCodeInfo.value = {
    width,
    height,
  }

  const borderRng = seedrandom(String(seed))
  const styleRng = seedrandom(String(seed))
  const markerRng = seedrandom(String(seed))

  ctx.fillStyle = lightColor
  ctx.fillRect(0, 0, width, height)

  function getInfo(x: number, y: number): PixelInfo {
    let isBorder = marginNoiseSpace === 'full'
      ? x < -1 || y < -1 || x > qr.size || y > qr.size
      : x < 0 || y < 0 || x >= qr.size || y >= qr.size

    if (marginNoiseSpace === 'marker') {
      if (x >= -1 && x <= 7 && y >= -1 && y <= 7)
        isBorder = false
      if (x >= -1 && x <= 7 && y >= qr.size - 8 && y <= qr.size)
        isBorder = false
      if (x >= qr.size - 8 && x <= qr.size && y >= -1 && y <= 7)
        isBorder = false
    }

    let isDark = false
    if (isBorder && marginNoise)
      isDark = borderRng() < marginNoiseRate
    else
      isDark = qr.getModule(x, y)

    let marker: MarkerInfo | undefined

    function createMarker(x: number, y: number, position: MarkerInfo['position']) {
      const isInner = x >= 2 && x <= 4 && y >= 2 && y <= 4
      const isBorder = !isInner
      const isCenter = x === 3 && y === 3

      return {
        x,
        y,
        position,
        isInner,
        isBorder,
        isCenter,
      }
    }

    if (x >= 0 && x < 7 && y >= 0 && y < 7)
      marker = createMarker(x, y, 'top-left')
    else if (x >= 0 && x < 7 && y >= qr.size - 7 && y < qr.size)
      marker = createMarker(x, y - qr.size + 7, 'bottom-left')
    else if (x >= qr.size - 7 && x < qr.size && y >= 0 && y < 7)
      marker = createMarker(x - qr.size + 7, y, 'top-right')

    if (marker?.isBorder) {
      if (markerShape === 'plus') {
        if (!((marker.x >= 2 && marker.x <= 4) || (marker.y >= 2 && marker.y <= 4)))
          isDark = false
      }
      else if (markerShape === 'box') {
        if (!((marker.x >= 1 && marker.x <= 5) || (marker.y >= 1 && marker.y <= 5)))
          isDark = false
      }
      else if (markerShape === 'random') {
        if (marker.x !== 3 && marker.y !== 3) {
          if (isDark)
            isDark = markerRng() < 0.5
        }
      }
      else if (markerShape === 'tiny-plus') {
        if (marker.x !== 3 && marker.y !== 3)
          isDark = false
      }
    }

    if (marker?.isInner && innerMarkerShape === 'plus') {
      if (marker.x !== 3 && marker.y !== 3)
        isDark = false
    }

    let targetX = x
    let targetY = y

    // Rotate the QR code
    if (x >= -1 && y >= -1 && x < qr.size + 1 && y < qr.size + 1) {
      targetX = x
      targetY = y
      if (rotate === 90) {
        targetX = qr.size - targetX - 1
        ;[targetX, targetY] = [targetY, targetX]
      }
      else if (rotate === 180) {
        targetX = qr.size - targetX - 1
        targetY = qr.size - targetY - 1
      }
      else if (rotate === 270) {
        targetY = qr.size - targetY - 1
        ;[targetX, targetY] = [targetY, targetX]
      }
    }

    targetX += marginLeft
    targetY += marginTop

    return {
      isDark,
      marker,
      x: targetX,
      y: targetY,
    }
  }

  ctx.fillStyle = darkColor

  const pixels: PixelInfo[] = []

  for (let y = -marginTop; y < qr.size + marginBottom; y++) {
    for (let x = -marginLeft; x < qr.size + marginRight; x++)
      pixels.push(getInfo(x, y))
  }

  // Sort pixels so the markers are drawn in the correct order
  pixels.sort((a, b) => {
    const getOrder = (p: PixelInfo) => {
      if (p.marker?.isBorder)
        return 0
      if (p.marker?.isCenter)
        return 1
      if (p.marker?.isInner)
        return 2
      return 4
    }
    return getOrder(a) - getOrder(b)
  })

  for (const { isDark, marker, x, y } of pixels) {
    let _pixelStyle = pixelStyle
    let _markerStyle = markerStyle

    if (_markerStyle === 'auto')
      _markerStyle = pixelStyle

    if (marker) {
      _pixelStyle = _markerStyle
      const cX = x * cell + halfcell
      const cY = y * cell + halfcell

      if (markerShape === 'circle') {
        if (marker.isBorder)
          continue

        if (marker.isCenter) {
          ctx.beginPath()
          ctx.fillStyle = darkColor
          ctx.arc(cX, cY, cell * 3.5, 0, Math.PI * 2)
          ctx.fill()

          ctx.beginPath()
          ctx.fillStyle = lightColor
          ctx.arc(cX, cY, cell * 2.5, 0, Math.PI * 2)
          ctx.fill()

          ctx.fillStyle = darkColor
        }
      }
      else if (markerShape === 'octagon') {
        if (marker.isBorder)
          continue

        if (marker.isCenter) {
          const octagonFor = (dx: number, dy: number) => {
            return [
              [dx, dy],
              [-dx, dy],
              [-dy, dx],
              [-dy, -dx],
              [-dx, -dy],
              [dx, -dy],
              [dy, -dx],
              [dy, dx],
            ] as const
          }

          function drawOctagon(size: number) {
            ctx.beginPath()
            const points = octagonFor(1.5 / 3.5 * size, size)

            if (_pixelStyle === 'rounded') {
              const innerPoints = octagonFor(1.5 / 3.5 * (size - 1), size - 1)
              const startPoint = [
                (points[0][0] + points[1][0]) / 2,
                (points[0][1] + points[1][1]) / 2,
              ]
              ctx.moveTo(cX + startPoint[0] * cell, cY + startPoint[1] * cell)
              ;[...points, points[0]]
                .forEach(([x, y], i) => {
                  const previous = points.at(i - 1)!
                  const next = points.at((i + 1) % points.length)!
                  const inner = innerPoints.at(i % innerPoints.length)!
                  const p1 = pointToLineProjection(
                    ...inner,
                    ...previous,
                    x,
                    y,
                  )
                  const p2 = pointToLineProjection(
                    ...inner,
                    ...next,
                    x,
                    y,
                  )
                  ctx.lineTo(cX + p1[0] * cell, cY + p1[1] * cell)
                  ctx.arcTo(
                    cX + x * cell,
                    cY + y * cell,
                    cX + p2[0] * cell,
                    cY + p2[1] * cell,
                    cell,
                  )
                  ctx.lineTo(cX + p2[0] * cell, cY + p2[1] * cell)
                })
            }
            else {
              points.forEach(([x, y], i) => {
                ctx[i === 0 ? 'moveTo' : 'lineTo'](cX + x * cell, cY + y * cell)
              })
            }
            ctx.closePath()
            ctx.fill()
          }

          ctx.fillStyle = darkColor
          drawOctagon(3.5)

          ctx.fillStyle = lightColor
          drawOctagon(2.5)

          // if (_pixelStyle === 'rounded') {
          //   ctx.beginPath()
          //   ctx.fillStyle = darkColor
          //   ctx.arc(cX, cY, cell * 1.5, 0, Math.PI * 2)
          //   ctx.fill()
          // }
          // else {
          //   ctx.fillStyle = darkColor
          //   drawOctagon(1.5)
          // }

          ctx.fillStyle = darkColor
        }
      }

      if (marker.isInner) {
        // inner markers
        if (innerMarkerShape === 'circle') {
          if (marker.isCenter) {
            ctx.beginPath()
            ctx.fillStyle = darkColor
            ctx.arc(cX, cY, cell * 1.5, 0, Math.PI * 2)
            ctx.fill()
          }
          continue
        }
        else if (innerMarkerShape === 'eye') {
          if (marker.isCenter) {
            ctx.beginPath()
            ctx.fillStyle = darkColor
            ctx.moveTo(cX, cY - cell * 1.5)
            ctx.arcTo(cX + cell * 1.5, cY, cX, cY + cell * 1.5, cell)
            ctx.lineTo(cX, cY + cell * 1.5)
            ctx.arcTo(cX - cell * 1.5, cY, cX, cY - cell * 1.5, cell)
            ctx.fill()
          }
          continue
        }
        else if (innerMarkerShape === 'diamond') {
          if (marker.isCenter) {
            ctx.beginPath()
            ctx.fillStyle = darkColor
            ctx.moveTo(cX, cY - cell * 1.5)
            ctx.lineTo(cX + cell * 1.5, cY)
            ctx.lineTo(cX, cY + cell * 1.5)
            ctx.lineTo(cX - cell * 1.5, cY)
            ctx.fill()
          }
          continue
        }
      }
    }

    function square() {
      ctx.fillStyle = isDark ? darkColor : lightColor
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

    // Skip white pixels when its not rounded
    if (!isDark && _pixelStyle !== 'rounded')
      continue

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
    const data = ctx.getImageData(0, 0, width, height)
    const newData = effects.crystalize(data, state.effectCrystalizeRadius, state.seed)
    ctx.putImageData(newData, 0, 0)
  }
}

function pointToLineProjection(px: number, py: number, x1: number, y1: number, x2: number, y2: number) {
  const dx = x2 - x1
  const dy = y2 - y1
  const d = dx * dx + dy * dy
  const u = ((px - x1) * dx + (py - y1) * dy) / d
  const x = x1 + u * dx
  const y = y1 + u * dy
  return [x, y] as const
}
