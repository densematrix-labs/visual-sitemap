/**
 * Token Store for Visual Sitemap
 * Persists user's scan credits locally
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface TokenInfo {
  token: string
  remaining_generations: number
  total_generations: number
  expires_at: string
  product_sku: string
}

interface TokenState {
  token: TokenInfo | null
  setToken: (token: TokenInfo | null) => void
  decrementCredits: () => void
  clearToken: () => void
  hasCredits: () => boolean
}

export const useTokenStore = create<TokenState>()(
  persist(
    (set, get) => ({
      token: null,
      
      setToken: (token) => set({ token }),
      
      decrementCredits: () => {
        const current = get().token
        if (current && current.remaining_generations > 0) {
          set({
            token: {
              ...current,
              remaining_generations: current.remaining_generations - 1,
            },
          })
        }
      },
      
      clearToken: () => set({ token: null }),
      
      hasCredits: () => {
        const token = get().token
        if (!token) return false
        if (new Date(token.expires_at) < new Date()) return false
        return token.remaining_generations > 0
      },
    }),
    {
      name: 'visual-sitemap-token',
    }
  )
)
