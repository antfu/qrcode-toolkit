import type { ScanResult } from 'qrcode-opencv-wechat'
import { scan } from 'qrcode-opencv-wechat'

export async function scanQRCodeFromDataUrl(dataurl: string) {
  const image = new Image()
  const promise = new Promise((resolve, reject) => {
    image.onload = resolve
    image.onerror = reject
  })
  image.src = dataurl
  await promise

  let result: ScanResult | null = null
  let error: Error | null = null
  try {
    result = await scan(image)
  }
  catch (e) {
    error = e as any
  }

  return { result, error }
}
