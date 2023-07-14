import { imageDataRGB } from 'stackblur-canvas'
import { colorHexToRgb } from '~/logic/utils'

export function liquidify(
  imageData: ImageData,
  radius: number,
  threshold: number,
  lightColor: string,
  darkColor: string,
) {
  const blurred = imageDataRGB(imageData, 0, 0, imageData.width, imageData.height, radius)
  const blurredData = blurred.data

  const lightRgb = colorHexToRgb(lightColor)!
  const darkRgb = colorHexToRgb(darkColor)!

  for (let i = 0; i < blurredData.length; i += 4) {
    const avarageLuminance = (blurredData[i] + blurredData[i + 1] + blurredData[i + 2]) / 3
    const color = avarageLuminance > threshold ? lightRgb : darkRgb
    blurredData[i] = color[0]
    blurredData[i + 1] = color[1]
    blurredData[i + 2] = color[2]
  }

  return new ImageData(blurredData, imageData.width, imageData.height)
}
