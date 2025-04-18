import { create } from 'zustand'

interface ErrorState {
  error: string | null
  setError: (error: string) => void
  clearError: () => void
}

export const useErrorStore = create<ErrorState>((set) => ({
  error: null,
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
})) 
