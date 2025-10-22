import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { logAndToastError } from '@/lib/utils/ebbError.util'

import { DeviceApi } from '../ebbApi/deviceApi'



const deviceKeys = {
  all: ['devices'] as const,
  currentId: () => [...deviceKeys.all, 'currentId'] as const,
  userDevices: (userId: string, filter?: { active?: boolean }) => 
    [...deviceKeys.all, 'user', userId, filter] as const,
  registration: (userId: string, maxDevices: number) => 
    [...deviceKeys.all, 'registration', userId, maxDevices] as const,
}

// All device logic moved to DeviceApi

// React Query hooks
export function useGetCurrentDeviceId() {
  return useQuery({
    queryKey: deviceKeys.currentId(),
    queryFn: DeviceApi.getCurrentDeviceId,
    staleTime: 5 * 60 * 1000, // 5 minutes - device ID doesn't change often
  })
}

export function useGetUserDevices(userId: string, filter: { active?: boolean } = {}) {
  return useQuery({
    queryKey: deviceKeys.userDevices(userId, filter),
    queryFn: () => DeviceApi.getUserDevices(userId, filter),
    enabled: !!userId,
  })
}

export function useUpsertDevice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, deviceId, deviceName }: { 
      userId: string
      deviceId: string 
      deviceName: string 
    }) => DeviceApi.upsertDevice(userId, deviceId, deviceName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: deviceKeys.all })
    },
    onError: (error) => {
      logAndToastError('Failed to register device', error)
    },
  })
}

export function useLogoutDevice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, deviceId }: { userId: string; deviceId: string }) => 
      DeviceApi.logoutDevice(userId, deviceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: deviceKeys.all })
    },
    onError: (error) => {
      logAndToastError('Failed to logout device', error)
    },
  })
}

export function useRegisterDevice(userId: string, maxDevices = 1) {
  return useQuery({
    queryKey: deviceKeys.registration(userId, maxDevices),
    queryFn: () => DeviceApi.registerDevice(userId, maxDevices),
    enabled: !!userId && maxDevices > 0,
  })
}

// Export the API for backwards compatibility
export const deviceApi = DeviceApi 
