import { createStore } from 'zustand'

interface ToastStoreState {
  error: Error | null
  setError: (error: Error | null) => void
}

export const toastStore = createStore<ToastStoreState>((set) => ({
  error: null,
  setError: (error: Error | null) => set({ error }),
}))
  
