import { create } from 'zustand'
import { Duration } from 'luxon'

interface FlowTimerStore {
  duration: Duration | null
  setDuration: (duration: Duration | null) => void
}

export const useFlowTimer = create<FlowTimerStore>((set) => ({
  duration: null,
  setDuration: (duration) => set({ duration })
})) 

export const getDurationFromDefault = (minutes: number | null) => {
  if (!minutes) return null
  return Duration.fromObject({ minutes })
}
