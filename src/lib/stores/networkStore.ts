import { create } from 'zustand'

interface NetworkStore {
  isOffline: boolean
  setOffline: (offline: boolean) => void
}

export const useNetworkStore = create<NetworkStore>((set) => ({
  isOffline: false,
  setOffline: (isOffline) => set({ isOffline }),
}))
