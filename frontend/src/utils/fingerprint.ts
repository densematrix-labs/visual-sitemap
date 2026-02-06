/**
 * Device fingerprinting for anonymous user identification
 */
import FingerprintJS from '@fingerprintjs/fingerprintjs'

let cachedDeviceId: string | null = null

export async function getDeviceId(): Promise<string> {
  if (cachedDeviceId) {
    return cachedDeviceId
  }

  try {
    const fp = await FingerprintJS.load()
    const result = await fp.get()
    cachedDeviceId = result.visitorId
    return cachedDeviceId
  } catch (error) {
    // Fallback to random ID stored in localStorage
    const stored = localStorage.getItem('device_id')
    if (stored) {
      cachedDeviceId = stored
      return stored
    }
    
    const randomId = `fallback_${Math.random().toString(36).substring(2, 15)}`
    localStorage.setItem('device_id', randomId)
    cachedDeviceId = randomId
    return randomId
  }
}
