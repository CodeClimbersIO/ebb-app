import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { logAndToastError } from '@/lib/utils/ebbError.util'
import { deviceRepo } from '@/db/supabase/deviceRepo'
import { hostname } from '@tauri-apps/plugin-os'
import { DeviceProfileApi } from '../ebbApi/deviceProfileApi'

export interface Device {
  device_id: string
  device_name: string
  created_at: Date
}

export interface DeviceInfo {
  devices: Device[]
  maxDevices: number
  isDeviceLimitReached: boolean
}

export const defaultDeviceInfo: DeviceInfo = {
  devices: [],
  maxDevices: 1,
  isDeviceLimitReached: false,
}

const deviceKeys = {
  all: ['devices'] as const,
  currentId: () => [...deviceKeys.all, 'currentId'] as const,
  userDevices: (userId: string, filter?: { active?: boolean }) => 
    [...deviceKeys.all, 'user', userId, filter] as const,
  registration: (userId: string, maxDevices: number) => 
    [...deviceKeys.all, 'registration', userId, maxDevices] as const,
}

const cleanupHostname = (name: string): string => {
  return name
    .replace(/\.local$/, '')
    .replace(/-/g, ' ')
}

// Core device functions
const getCurrentDeviceId = async (): Promise<string> => {
  const deviceId = await DeviceProfileApi.getDeviceId()
  return deviceId
}

const upsertDevice = async (
  userId: string,
  deviceId: string,
  deviceName: string
) => {
  return deviceRepo.upsertDevice(userId, deviceId, deviceName)
}

const getUserDevices = async (userId: string, filter: { active?: boolean } = {}) => {
  const response = await deviceRepo.getUserDevices(userId, filter)
  if (response.error) throw response.error
  return response.data || []
}

const logoutDevice = async (userId: string, deviceId: string) => {
  const currentDeviceId = await getCurrentDeviceId()
  if (deviceId === currentDeviceId) throw new Error('Cannot logout current device')

  return deviceRepo.deleteDevice(userId, deviceId)
}

const deviceExists = (devices: Device[], currentDeviceId: string): boolean => {
  return devices.some((device) => device.device_id === currentDeviceId)
}

const registerDevice = async (userId: string, maxDevices: number): Promise<DeviceInfo> => {
  try {
    const existingDevices = await getUserDevices(userId)
    const deviceCount = existingDevices?.length || 0

    if (deviceCount > maxDevices) {
      return {
        devices: existingDevices,
        maxDevices,
        isDeviceLimitReached: true,
      }
    }

    const deviceId = await getCurrentDeviceId()
    const exists = deviceExists(existingDevices, deviceId)
    if (!exists) {
      const rawHostname = await hostname()
      const deviceName = rawHostname ? cleanupHostname(rawHostname) : 'Unknown Device'
      await upsertDevice(userId, deviceId, deviceName)
    }

    return {
      devices: existingDevices,
      maxDevices,
      isDeviceLimitReached: false,
    }
  } catch (error) {
    logAndToastError(`[DeviceRegister] Error fetching devices: ${JSON.stringify(error, null, 2)}`, error)
    throw new Error('Failed to fetch devices')
  }
}

// React Query hooks
export function useGetCurrentDeviceId() {
  return useQuery({
    queryKey: deviceKeys.currentId(),
    queryFn: getCurrentDeviceId,
    staleTime: 5 * 60 * 1000, // 5 minutes - device ID doesn't change often
  })
}

export function useGetUserDevices(userId: string, filter: { active?: boolean } = {}) {
  return useQuery({
    queryKey: deviceKeys.userDevices(userId, filter),
    queryFn: () => getUserDevices(userId, filter),
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
    }) => upsertDevice(userId, deviceId, deviceName),
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
      logoutDevice(userId, deviceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: deviceKeys.all })
    },
    onError: (error) => {
      logAndToastError('Failed to logout device', error)
    },
  })
}

export function useRegisterDevice(userId: string, maxDevices: number) {
  return useQuery({
    queryKey: deviceKeys.registration(userId, maxDevices),
    queryFn: () => registerDevice(userId, maxDevices),
    enabled: !!userId && maxDevices > 0,
  })
}

// Export the utility functions for backwards compatibility
export const deviceApi = {
  getCurrentDeviceId,
  cleanupHostname,
  upsertDevice,
  getUserDevices,
  logoutDevice,
  registerDevice,
} 
