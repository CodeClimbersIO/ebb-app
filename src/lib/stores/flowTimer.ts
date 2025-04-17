import { create } from 'zustand'
import { Duration } from 'luxon'

interface FlowTimerStore {
  duration: Duration | null
  totalDuration: Duration | null
  setDuration: (duration: Duration | null) => void
  setTotalDuration: (duration: Duration | null) => void
}

export const useFlowTimer = create<FlowTimerStore>((set) => ({
  duration: null,
  totalDuration: null,
  setDuration: (duration) => set({ duration }),
  setTotalDuration: (totalDuration) => set({ totalDuration })
})) 

export const getDurationFromDefault = (minutes: number | null) => {
  if (!minutes) return null
  return Duration.fromObject({ minutes })
}
