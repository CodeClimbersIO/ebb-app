import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import supabase from '@/lib/integrations/supabase'
import { logAndToastError } from '@/lib/utils/ebbError.util'
import { useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { isSupabaseError, SupabaseErrorCodes } from '@/lib/utils/supabase.util'
import { platformApiRequest } from '../platformRequest'
import { User } from '@supabase/supabase-js'

const profileKeys = {
  all: ['profile'] as const,
  current: () => [...profileKeys.all, 'current'] as const,
}

export type EbbStatus = 'online' | 'flowing' | 'active' | 'offline'

export type UserProfile = {
  id: string
  online_status: EbbStatus
  last_check_in: string
  latitude: number | null
  longitude: number | null
  preferences: Record<string, string | number | boolean>
  created_at: string
  updated_at: string
  version: string
}

interface CreateProfile {
  id: string
  online_status: EbbStatus
  last_check_in: string
  preferences: Record<string, string | number | boolean>
}

const fetchCurrentProfile = async () => {
  const { data } = await platformApiRequest({
    url: '/api/users/profile/me',
    method: 'GET',
  })
  return data as UserProfile
}

const createProfile = async (profile: CreateProfile) => {
  const { data, error } = await supabase
    .from('user_profile')
    .insert(profile)
    .select()
    .order('created_at', { ascending: false })
    .limit(1)

  if (error) throw error
  return data?.[0] as UserProfile
}

const updateProfile = async (updates: Partial<UserProfile>) => {
  const {id, ...profileUpdates} = updates

  const { data, error } = await supabase
    .from('user_profile')
    .update(profileUpdates)
    .eq('id', id)
    .select()
    .order('created_at', { ascending: false })
    .limit(1)

  if (error) throw error
  return data?.[0] as UserProfile
}

const updateProfileLocation = async () => {
  const data = await platformApiRequest({
    url: '/api/users/location',
    method: 'POST',
  })

  return data
}

export function useGetCurrentProfile(user: User | null) {
  return useQuery({
    queryKey: profileKeys.current(),
    queryFn: fetchCurrentProfile,
    enabled: !!user,
    retry: false,
  })
}

export function useCreateProfile() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: createProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.all })
    },
    onError: (error) => {
      if(isSupabaseError(error) && error.code === SupabaseErrorCodes.ResourceAlreadyExists) return        
      logAndToastError('Failed to create profile', error)
    },
  })
}

export function useUpdateProfile() {

  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.all })
    },
    onError: (error) => {
      logAndToastError('Failed to update profile', error)
    },
  })
}

export const useUpdateProfileLocation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateProfileLocation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.all })
    },
    onError: (error) => {
      logAndToastError('Failed to update profile location', error)
    },
  })
}

export const useProfile = () => {
  const { user, loading: authLoading } = useAuth()
  const { data: profile, isLoading, refetch } = useGetCurrentProfile(user)
  const { mutate: createProfile } = useCreateProfile()

  useEffect(() => {
    if(isLoading || authLoading) return
    if(!profile && user) {
      createProfile({
        id: user.id,
        online_status: 'active',
        last_check_in: new Date().toISOString(),
        preferences: {},
      })
    }
    
  }, [profile, isLoading, user])

  return { profile, isLoading, refetch }
}
