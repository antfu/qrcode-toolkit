import QrScanner from 'qr-scanner'
import type { ScanResult } from './types'

export async function scanQRCodeFromDataUrl(dataurl: string): Promise<ScanResult> {
  let result: QrScanner.ScanResult | null = null
  let error: Error | null = null
  try {
    result = await QrScanner.scanImage(dataurl, {
      returnDetailedScanResult: true,
      alsoTryWithoutScanRegion: true,
    })
  }
  catch (e) {
    error = e as any
  }
  return { result, error }
}
