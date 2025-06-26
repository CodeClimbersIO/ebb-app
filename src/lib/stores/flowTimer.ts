import { create } from 'zustand'
import { Duration } from 'luxon'

interface FlowTimerStore {
  totalDuration: Duration | null
  setTotalDuration: (duration: Duration | null) => void
}

export const useFlowTimer = create<FlowTimerStore>((set) => ({
  totalDuration: null,
  setTotalDuration: (totalDuration) => set({ totalDuration })
})) 

export const getDurationFromDefault = (minutes: number | null) => {
  if (!minutes) return null
  return Duration.fromObject({ minutes })
}
