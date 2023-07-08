import { imageDataRGB } from 'stackblur-canvas'

export function liquidify(imageData: ImageData, radius: number, threshold: number) {
  const blurred = imageDataRGB(imageData, 0, 0, imageData.width, imageData.height, radius)
  const blurredData = blurred.data

  for (let i = 0; i < blurredData.length; i += 4) {
    const avarageLuminance = (blurredData[i] + blurredData[i + 1] + blurredData[i + 2]) / 3
    const color = avarageLuminance > threshold ? 255 : 0
    blurredData[i] = color
    blurredData[i + 1] = color
    blurredData[i + 2] = color
  }

  return new ImageData(blurredData, imageData.width, imageData.height)
}
