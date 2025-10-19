import { useStore } from 'zustand'
import { paywallStore } from '@/lib/stores/paywallStore'

export const usePaywall = () => {
  const isOpen = useStore(paywallStore, (state) => state.isOpen)
  const openPaywall = useStore(paywallStore, (state) => state.openPaywall)
  const closePaywall = useStore(paywallStore, (state) => state.closePaywall)

  return {
    isOpen,
    openPaywall,
    closePaywall,
  }
}
