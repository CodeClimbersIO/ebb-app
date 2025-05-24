import { Session, User } from '@supabase/supabase-js'
import { create } from 'zustand'

interface AuthStore {
  user: User | null
  loading: boolean
  session: Session | null
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  setSession: (session: Session | null) => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  loading: true,
  session: null,
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
  setSession: (session) => set({ session }),
}))
