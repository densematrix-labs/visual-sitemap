/**
 * Payment API functions for Visual Sitemap
 */

const API_BASE = '/api/v1'

export interface CheckoutRequest {
  product_sku: string
  device_id: string
  success_url: string
  cancel_url: string
}

export interface CheckoutResponse {
  checkout_url: string
  checkout_id: string
}

export interface TokenInfo {
  token: string
  remaining_generations: number
  total_generations: number
  expires_at: string
  product_sku: string
}

export async function createCheckout(request: CheckoutRequest): Promise<CheckoutResponse> {
  const response = await fetch(`${API_BASE}/payment/create-checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    throw new Error('Failed to create checkout')
  }

  return response.json()
}

export async function fetchTokenByDevice(deviceId: string): Promise<TokenInfo | null> {
  const response = await fetch(`${API_BASE}/tokens/by-device/${deviceId}`)
  
  if (response.status === 404) {
    return null
  }

  if (!response.ok) {
    throw new Error('Failed to fetch token')
  }

  return response.json()
}

export async function validateToken(token: string): Promise<TokenInfo | null> {
  const response = await fetch(`${API_BASE}/tokens/validate/${token}`)
  
  if (response.status === 404) {
    return null
  }

  if (!response.ok) {
    throw new Error('Failed to validate token')
  }

  return response.json()
}

export async function useGeneration(token: string): Promise<{ remaining: number }> {
  const response = await fetch(`${API_BASE}/tokens/use/${token}`, {
    method: 'POST',
  })

  if (!response.ok) {
    throw new Error('Failed to use generation')
  }

  return response.json()
}
