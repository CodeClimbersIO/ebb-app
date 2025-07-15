import { create } from 'zustand'
import { Duration } from 'luxon'
import { FlowSessionApi } from '../../api/ebbApi/flowSessionApi'

interface FlowTimerStore {
  totalDuration: Duration | null
  setTotalDuration: (duration: Duration | null) => void
  addToTimer: (additionalSeconds: number) => Promise<void>
}

export const useFlowTimer = create<FlowTimerStore>((set) => ({
  totalDuration: null,
  setTotalDuration: (totalDuration) => set({ totalDuration }),
  addToTimer: async (additionalSeconds: number) => {
    const flowSession = await FlowSessionApi.getInProgressFlowSession()
    if (!flowSession || !flowSession.duration) return

    const newTotalDurationInSeconds = flowSession.duration + additionalSeconds

    await FlowSessionApi.updateFlowSessionDuration(flowSession.id, newTotalDurationInSeconds)

    const newTotalDurationForStore = Duration.fromObject({ seconds: newTotalDurationInSeconds })
    set({ totalDuration: newTotalDurationForStore })

  }
})) 

export const getDurationFromDefault = (minutes: number | null) => {
  if (!minutes) return null
  return Duration.fromObject({ minutes })
}
