import { create } from 'zustand'
import { Duration } from 'luxon'
import { Workflow } from '@/api/ebbApi/workflowApi'

export interface FlowSessionState {
  id: string
  sessionId: string
  workflowId: string
  workflow: Workflow | null
}

interface FlowSessionStore {
  duration: Duration | null
  session: FlowSessionState | null 
  totalDuration: Duration | null
  setDuration: (duration: Duration | null) => void
  setTotalDuration: (duration: Duration | null) => void
  setSession: (session: FlowSessionState | null) => void
}

export const useFlowSession = create<FlowSessionStore>((set) => ({
  duration: null,
  session: null,
  totalDuration: null,
  isFlowActive: false,
  setDuration: (duration) => set({ duration }),
  setTotalDuration: (totalDuration) => set({ totalDuration }),
  setSession: (session) => set({ session }),
})) 

export const getDurationFromDefault = (minutes: number | null) => {
  if (!minutes) return null
  return Duration.fromObject({ minutes })
}
