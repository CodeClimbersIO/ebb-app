import { create } from 'zustand'
import supabase from '@/lib/integrations/supabase'
import { devtools, subscribeWithSelector } from 'zustand/middleware'
import { RealtimeChannel } from '@supabase/supabase-js'
import { error as logError } from '@tauri-apps/plugin-log'

export interface License {
  id: string
  status: string
  license_type: 'perpetual' | 'subscription'
  expiration_date: string | null
}

interface LicenseStoreState {
  license: License | null
  isLoading: boolean
  error: Error | null
  channel: RealtimeChannel | null
  fetchLicense: (userId: string | null) => Promise<void>
  initSubscription: (userId: string) => void
  clearSubscription: () => Promise<void>
}

export const useLicenseStore = create<LicenseStoreState>()(
  devtools(
    subscribeWithSelector(
      (set, get) => ({
        license: null,
        isLoading: true,
        error: null,
        channel: null,

        fetchLicense: async (userId: string | null) => {
          if (!userId) {
            set({ license: null, isLoading: false, error: null })
            return
          }

          set({ isLoading: true, error: null })

          try {
            const { data: activeData, error: activeError } = await supabase
              .from('licenses')
              .select('id, status, license_type, expiration_date')
              .eq('user_id', userId)
              .eq('status', 'active')
              .maybeSingle()

            let data = activeData

            if (activeError && activeError.code !== 'PGRST116') {
              logError(`Error fetching active license: ${activeError}`)
              throw activeError
            }

            if (!data) {
              const { data: trialData, error: trialError } = await supabase
                .from('licenses')
                .select('id, status, license_type, expiration_date')
                .eq('user_id', userId)
                .eq('status', 'trialing')
                .maybeSingle()

              if (trialError && trialError.code !== 'PGRST116') {
                logError(`Error fetching trial license: ${trialError}`)
                throw trialError
              }
              data = trialData
            }

            set({ license: data as License | null, isLoading: false, error: null })
          } catch (err) {
            logError(`Failed to fetch license status: ${err instanceof Error ? err.message : String(err)}`)
            set({ license: null, isLoading: false, error: err instanceof Error ? err : new Error('Failed to fetch license') })
          }
        },

        initSubscription: (userId: string) => {
          if (get().channel) {
            return
          }

          const channel = supabase
            .channel(`license-updates-${userId}`)
            .on(
              'postgres_changes',
              {
                event: '*',
                schema: 'public',
                table: 'licenses',
                filter: `user_id=eq.${userId}`,
              },
              () => {
                get().fetchLicense(userId)
              }
            )
            .subscribe((status, err) => {
               if (status === 'CHANNEL_ERROR') {
                 logError(`Subscription error for user ${userId}: ${err}`)
                 get().clearSubscription()
               } else if (status === 'TIMED_OUT') {
                 logError(`Subscription timed out for user ${userId}.`)
                 get().clearSubscription()
               }
             })

          set({ channel })
        },

        clearSubscription: async () => {
           const channel = get().channel
           if (channel) {
             try {
                await supabase.removeChannel(channel)
             } catch (error) {
                logError(`Error removing Supabase channel: ${error}`)
             } finally {
                set({ channel: null })
             }
           }
         },
      })
    )
  )
)
