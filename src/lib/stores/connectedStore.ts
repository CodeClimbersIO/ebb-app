import { create } from 'zustand'

interface ConnectedStore {
  connected: boolean
  setConnected: (connected: boolean) => void
}

export const useConnectedStore = create<ConnectedStore>((set) => ({
  connected: false,
  setConnected: (connected) => set({ connected })
})) 
