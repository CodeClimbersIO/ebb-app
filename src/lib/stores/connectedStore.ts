import { create } from 'zustand'
import { Duration } from 'luxon'

interface ConnectedStore {
  connected: boolean
  setConnected: (connected: boolean) => void
}

export const useConnectedStore = create<ConnectedStore>((set) => ({
  connected: false,
  setConnected: (connected) => set({ connected })
})) 

export const getDurationFromDefault = (minutes: number | null) => {
  if (!minutes) return null
  return Duration.fromObject({ minutes })
}
