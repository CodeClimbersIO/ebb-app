import { create } from 'zustand'

export type RangeMode = 'day' | 'week' | 'month'

interface UsageSummaryStore {
  date: Date
  rangeMode: RangeMode
  setDate: (date: Date) => void
  setRangeMode: (rangeMode: RangeMode) => void
}

export const useUsageSummaryStore = create<UsageSummaryStore>((set) => ({
  date: new Date(),
  rangeMode: 'day',
  setDate: (date) => set({ date }),
  setRangeMode: (rangeMode) => set({ rangeMode }),
}))
