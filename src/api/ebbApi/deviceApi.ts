import { logAndToastError } from '@/lib/utils/ebbError.util'
import { deviceRepo } from '@/db/supabase/deviceRepo'
import { hostname } from '@tauri-apps/plugin-os'
import { invoke } from '@tauri-apps/api/core'


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

const cleanupHostname = (name: string): string => {
  return name
    .replace(/\.local$/, '')
    .replace(/-/g, ' ')
}


// gets the device id from local storage  
const getCurrentDeviceId = async (): Promise<string> => {
  const deviceId = await invoke<string>('get_device_id')
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
  return deviceRepo.getUserDevices(userId, filter)
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

  const { data: existingDevices, error: deviceError } = await getUserDevices(userId)
  
  if (deviceError) {
    logAndToastError(`[DeviceRegister] Error fetching devices: ${JSON.stringify(deviceError, null, 2)}`, deviceError)
    throw new Error('Failed to fetch devices')
  }

  const deviceCount = existingDevices?.length || 0

  if (deviceCount > maxDevices) {
    return {
      devices: existingDevices,
      maxDevices,
      isDeviceLimitReached: true,
    }
  }

  const deviceId = await getCurrentDeviceId()
  const exists =  deviceExists(existingDevices, deviceId)
  if(!exists) {
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

export const deviceApi = {
  getCurrentDeviceId,
  cleanupHostname,
  upsertDevice,
  getUserDevices,
  logoutDevice,
  registerDevice,
}
