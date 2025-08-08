import { deviceRepo } from '@/db/supabase/deviceRepo'
import { DeviceProfileApi } from './deviceProfileApi'

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

// Core device functions
const getCurrentDeviceId = async (): Promise<string> => {
  const deviceId = await DeviceProfileApi.getDeviceId()
  return deviceId
}

const cleanupHostname = (name: string): string => {
  return name
    .replace(/\.local$/, '')
    .replace(/-/g, ' ')
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
    const { hostname } = await import('@tauri-apps/plugin-os')
    const rawHostname = await hostname()
    const deviceName = rawHostname ? cleanupHostname(rawHostname) : 'Unknown Device'
    await upsertDevice(userId, deviceId, deviceName)
  }

  return {
    devices: existingDevices,
    maxDevices,
    isDeviceLimitReached: false,
  }

}

export const DeviceApi = {
  getCurrentDeviceId,
  cleanupHostname,
  upsertDevice,
  getUserDevices,
  logoutDevice,
  registerDevice,
  deviceExists,
}
