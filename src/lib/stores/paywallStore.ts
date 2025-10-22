import { createStore } from 'zustand'

interface PaywallStoreState {
  isOpen: boolean
  openPaywall: () => void
  closePaywall: () => void
}

export const paywallStore = createStore<PaywallStoreState>((set) => ({
  isOpen: false,
  openPaywall: () => set({ isOpen: true }),
  closePaywall: () => set({ isOpen: false }),
}))
