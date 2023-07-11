import seedrandom from 'seedrandom'

import Perspective from '../vendor/perspective'
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
  position: 'top-left' | 'top-right' | 'bottom-left' | 'sub'
  isCenter: boolean
  isBorder: boolean
  isInner: boolean
}

interface PixelInfo {
  x: number
  y: number
  isDark: boolean
  isBorder: boolean
  marker?: MarkerInfo
}

const disconnectBorder = false

export async function generateQRCode(canvas: HTMLCanvasElement, state: QRCodeGeneratorState) {
  if (!canvas)
    return

  const seg = QrSegment.makeSegments(state.text || 'qrcode.antfu.me')
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
    markerSub,
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

  const {
    top: marginTop,
    right: marginRight,
    bottom: marginBottom,
    left: marginLeft,
  } = resolveMargin(margin)

  const halfcell = cell / 2
  const width: number = (qr.size + marginLeft + marginRight) * cell
  const height: number = (qr.size + marginTop + marginBottom) * cell

  const can = document.createElement('canvas')
  can.width = width
  can.height = height
  const ctx = can.getContext('2d', { willReadFrequently: true })!
  ctx.clearRect(0, 0, width, height)

  generateQRCodeInfo.value = {
    width,
    height,
  }

  const borderRng = seedrandom(String(seed))
  const borderOpacityRng = seedrandom(String(seed))
  const styleRng = seedrandom(String(seed))
  const markerRng = seedrandom(String(seed))

  function getBorderOpacity() {
    if (typeof state.marginNoiseOpacity === 'number')
      return state.marginNoiseOpacity
    const [min, max] = state.marginNoiseOpacity
    return borderOpacityRng() * (max - min) + min
  }

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
    else if (marginNoiseSpace === 'minimal' || marginNoiseSpace === 'extreme') {
      if (y >= 2 && y <= 4 && x >= -1 && x <= qr.size)
        isBorder = false
      if (x >= 2 && x <= 4 && y >= -1 && y <= qr.size)
        isBorder = false
      if (y >= qr.size - 5 && y <= qr.size - 3 && x >= -1 && x <= 7)
        isBorder = false
      if (x >= qr.size - 5 && x <= qr.size - 3 && y >= -1 && y <= 7)
        isBorder = false
    }

    let isDark = false
    if (isBorder && marginNoise)
      isDark = borderRng() < marginNoiseRate
    else
      isDark = qr.getModule(x, y)

    let marker: MarkerInfo | undefined

    function createMarker(x: number, y: number, position: MarkerInfo['position'], isSubMarker = false) {
      const isInner = position === 'sub'
        ? x === 2 && y === 2
        : x >= 2 && x <= 4 && y >= 2 && y <= 4
      const isBorder = !isInner
      const isCenter = position === 'sub'
        ? x === 2 && y === 2
        : x === 3 && y === 3

      return {
        x,
        y,
        position,
        isInner,
        isBorder,
        isCenter,
        isSubMarker,
      }
    }

    if (x >= 0 && x < 7 && y >= 0 && y < 7) {
      marker = createMarker(x, y, 'top-left')
    }
    else if (x >= 0 && x < 7 && y >= qr.size - 7 && y < qr.size) {
      marker = createMarker(x, y - qr.size + 7, 'bottom-left')
    }
    else if (x >= qr.size - 7 && x < qr.size && y >= 0 && y < 7) {
      marker = createMarker(x - qr.size + 7, y, 'top-right')
    }
    else if (qr.isSubMarker(x, y)) {
      let dx = x
      let dy = y
      while (qr.isSubMarker(dx, dy))
        dx -= 1
      dx += 1
      while (qr.isSubMarker(dx, dy))
        dy -= 1
      dy += 1
      marker = createMarker(x - dx, y - dy, 'sub')
    }

    if (marker) {
      if (marker.position !== 'sub') {
        if (marker.isBorder) {
          if (markerShape === 'circle' || markerShape === 'octagon')
            isDark = false

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
      }

      else if (marker?.position === 'sub') {
        if (marker.isBorder) {
          if (markerSub === 'circle' || markerSub === 'octagon')
            isDark = false
        }

        if (markerSub === 'plus' || markerSub === 'tiny-plus') {
          if (marker.x !== 2 && marker.y !== 2)
            isDark = false
        }
        else if (markerSub === 'box') {
          if (!((marker.x >= 1 && marker.x <= 3) || (marker.y >= 1 && marker.y <= 3)))
            isDark = false
        }
        else if (markerSub === 'random') {
          if (marker.x !== 2 && marker.y !== 2) {
            if (isDark)
              isDark = markerRng() < 0.5
          }
        }
      }
    }

    function cutOut(ix: number, iy: number, w: number, h: number) {
      if (x >= ix && x < ix + w && y >= iy && y < iy + h) {
        isDark = false
        isBorder = true
      }
    }

    if (marginNoiseSpace === 'extreme') {
      cutOut(-1, -1, 3, 3)
      cutOut(-1, 5, 3, 3)
      cutOut(-1, qr.size - 2, 3, 3)
      cutOut(-1, qr.size - 8, 3, 3)
      cutOut(5, -1, 3, 3)
      cutOut(5, 5, 3, 3)
      cutOut(5, qr.size - 2, 3, 3)
      cutOut(5, qr.size - 8, 3, 3)
      cutOut(qr.size - 2, -1, 3, 3)
      cutOut(qr.size - 2, 5, 3, 3)
      cutOut(qr.size - 8, -1, 3, 3)
      cutOut(qr.size - 8, 5, 3, 3)
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
      isBorder,
      marker,
      x: targetX,
      y: targetY,
    }
  }

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

  for (const { isDark, marker, x, y, isBorder } of pixels) {
    let _pixelStyle = pixelStyle
    const _markerStyle = markerStyle === 'auto'
      ? pixelStyle
      : markerStyle

    const opacity = isBorder ? getBorderOpacity() : 1
    const darkColorHex = (Math.round((1 - opacity) * 255)).toString(16).padStart(2, '0')
    const _darkColor = `#${darkColorHex}${darkColorHex}${darkColorHex}`

    const lightColor = invert ? _darkColor : state.lightColor
    const darkColor = invert ? state.lightColor : _darkColor
    ctx.fillStyle = darkColor

    const cX = x * cell + halfcell
    const cY = y * cell + halfcell

    if (marker && marker.position !== 'sub') {
      _pixelStyle = _markerStyle

      if (markerShape === 'circle') {
        if (marker.isBorder)
          continue

        if (marker.isCenter) {
          ctx.fillStyle = lightColor
          ctx.fillRect(cX - cell * 3.5, cY - cell * 3.5, cell * 7, cell * 7)

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
          ctx.fillStyle = lightColor
          ctx.fillRect(cX - cell * 3.5, cY - cell * 3.5, cell * 7, cell * 7)

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

          ctx.fillStyle = darkColor
        }
      }

      if (marker.isInner) {
        // inner markers
        if (innerMarkerShape === 'circle') {
          if (marker.isCenter) {
            ctx.fillStyle = lightColor
            ctx.fillRect(cX - cell * 1.5, cY - cell * 1.5, cell * 3, cell * 3)
            ctx.beginPath()
            ctx.fillStyle = darkColor
            ctx.arc(cX, cY, cell * 1.5, 0, Math.PI * 2)
            ctx.fill()
          }
          continue
        }
        else if (innerMarkerShape === 'eye') {
          if (marker.isCenter) {
            ctx.fillStyle = lightColor
            ctx.fillRect(cX - cell * 1.5, cY - cell * 1.5, cell * 3, cell * 3)
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
            ctx.fillStyle = lightColor
            ctx.fillRect(cX - cell * 1.5, cY - cell * 1.5, cell * 3, cell * 3)
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

    if (marker?.position === 'sub') {
      if (markerSub === 'circle') {
        if (marker.isBorder)
          continue

        if (marker.isCenter) {
          ctx.fillStyle = lightColor
          ctx.fillRect(cX - cell * 2.5, cY - cell * 2.5, cell * 5, cell * 5)

          ctx.beginPath()
          ctx.fillStyle = darkColor
          ctx.arc(cX, cY, cell * 2.5, 0, Math.PI * 2)
          ctx.fill()

          ctx.beginPath()
          ctx.fillStyle = lightColor
          ctx.arc(cX, cY, cell * 1.5, 0, Math.PI * 2)
          ctx.fill()

          ctx.fillStyle = darkColor
        }
      }
    }

    function square(color = isDark ? darkColor : lightColor) {
      ctx.fillStyle = color
      ctx.fillRect(x * cell, y * cell, cell, cell)
    }

    function dot(color = isDark ? darkColor : lightColor) {
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.arc(x * cell + halfcell, y * cell + halfcell, halfcell, 0, Math.PI * 2)
      ctx.fill()
    }

    function corner(index: number, color?: string) {
      const pos = [
        [0, 0], // top left
        [0, halfcell], // bottom left
        [halfcell, 0], // top right
        [halfcell, halfcell], // bottom right
      ][index]
      if (color)
        ctx.fillStyle = color
      ctx.fillRect(x * cell + pos[0], y * cell + pos[1], halfcell, halfcell)
    }

    // Skip white pixels when its not rounded
    if (!isDark && state.backgroundImage && isBorder)
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
      function shouldConnect(dx: number, dy: number) {
        const pixel = pixels.find(p => p.x === x + dx && p.y === y + dy)
        if (!pixel)
          return true
        if (disconnectBorder)
          return pixel.isDark && pixel.isBorder === isBorder
        else
          return pixel.isDark
      }

      const top = shouldConnect(0, -1)
      const bottom = shouldConnect(0, 1)
      const left = shouldConnect(-1, 0)
      const right = shouldConnect(1, 0)
      const topLeft = shouldConnect(-1, -1)
      const topRight = shouldConnect(1, -1)
      const bottomLeft = shouldConnect(-1, 1)
      const bottomRight = shouldConnect(1, 1)

      if (isDark) {
        square(lightColor)
        ctx.fillStyle = darkColor
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
        if (_pixelStyle === 'rounded') {
          corner(0, (top && left && topLeft) ? darkColor : lightColor)
          corner(2, (top && right && topRight) ? darkColor : lightColor)
          corner(1, (bottom && left && bottomLeft) ? darkColor : lightColor)
          corner(3, (bottom && right && bottomRight) ? darkColor : lightColor)
        }
      }
      dot()
    }
    else {
      square()
    }
  }

  await applyPerspective()

  if (state.effectTiming === 'after')
    await applyBackground()

  if (state.effect === 'crystalize') {
    const data = ctx.getImageData(0, 0, width, height)
    const newData = effects.crystalize(data, state.effectCrystalizeRadius, state.seed)
    ctx.putImageData(newData, 0, 0)
  }
  else if (state.effect === 'liquidify') {
    const data = ctx.getImageData(0, 0, width, height)
    const newData1 = state.effectLiquidifyDistortRadius
      ? effects.crystalize(data, state.effectLiquidifyDistortRadius, state.seed)
      : data
    const newData2 = effects.liquidify(newData1, state.effectLiquidifyRadius, state.effectLiquidifyThreshold)
    ctx.putImageData(newData2, 0, 0)
  }

  if (state.effectTiming === 'before')
    await applyBackground()

  // final, copy offscreen canvas to the real one
  canvas.width = width
  canvas.height = height
  const realCtx = canvas.getContext('2d')!
  realCtx.save()
  realCtx.fillStyle = invert ? state.darkColor : state.lightColor
  realCtx.fillRect(0, 0, width, height)
  realCtx.setTransform(
    state.transformScale,
    0,
    0,
    state.transformScale,
    -(state.transformScale - 1) * width / 2,
    -(state.transformScale - 1) * height / 2,
  )
  realCtx.drawImage(can, 0, 0, width, height)
  realCtx.restore()

  async function applyPerspective() {
    if (state.transformPerspectiveX === 0 && state.transformPerspectiveY === 0)
      return

    const data = ctx.getImageData(0, 0, width, height)
    ctx.clearRect(0, 0, width, height)
    const perspective = new Perspective(ctx as any, data)

    const perspectiveX = state.transformPerspectiveX
    const perspectiveY = state.transformPerspectiveY

    const pos = {
      topLeftX: 0,
      topLeftY: 0,
      bottomLeftX: 0,
      bottomLeftY: height,
      topRightX: width,
      topRightY: 0,
      bottomRightX: width,
      bottomRightY: height,
    }

    if (perspectiveX !== 0) {
      const offsetX = Math.abs(width * perspectiveX / 2)
      const offsetY = Math.abs(height * perspectiveX / 3)

      // perspectiveX
      pos.topLeftX += offsetX
      pos.topRightX -= offsetX
      pos.bottomLeftX += offsetX
      pos.bottomRightX -= offsetX
      if (perspectiveX > 0) {
        pos.topRightY += offsetY
        pos.bottomRightY -= offsetY
      }
      else {
        pos.topLeftY += offsetY
        pos.bottomLeftY -= offsetY
      }
    }

    // perspectiveY
    if (perspectiveY !== 0) {
      const offsetX = Math.abs(width * perspectiveY / 3)
      const offsetY = Math.abs(height * perspectiveY / 2)

      pos.topLeftY += offsetY
      pos.topRightY += offsetY
      pos.bottomLeftY -= offsetY
      pos.bottomRightY -= offsetY
      if (perspectiveY > 0) {
        pos.bottomLeftX += offsetX
        pos.bottomRightX -= offsetX
      }
      else {
        pos.topLeftX += offsetX
        pos.topRightX -= offsetX
      }
    }

    perspective.draw(pos)
  }

  async function applyBackground() {
    ctx.restore()
    const clone = document.createElement('canvas')
    clone.width = width
    clone.height = height
    clone.getContext('2d')!.putImageData(ctx.getImageData(0, 0, width, height), 0, 0)

    ctx.fillStyle = invert ? state.darkColor : state.lightColor
    ctx.fillRect(0, 0, width, height)
    if (state.backgroundImage) {
      const img = new Image()
      img.src = state.backgroundImage
      await new Promise(resolve => img.onload = resolve).then()
      // draw the image full cover the canvas with aspect ratio
      const imgRatio = img.width / img.height
      const canvasRatio = canvas.width / canvas.height
      if (imgRatio < canvasRatio)
        ctx.drawImage(img, 0, (canvas.height - canvas.width / imgRatio) / 2, canvas.width, canvas.width / imgRatio)
      else
        ctx.drawImage(img, (canvas.width - canvas.height * imgRatio) / 2, 0, canvas.height * imgRatio, canvas.height)
    }

    ctx.drawImage(clone, 0, 0)
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
