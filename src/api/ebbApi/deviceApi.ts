import { invoke } from '@tauri-apps/api/core'
import { error as logError } from '@tauri-apps/plugin-log'
import { deviceRepo } from '@/db/supabase/deviceRepo'

const getMacAddress = async (): Promise<string> => {
  try {
    const macAddress = await invoke<string>('get_mac_address')
    return macAddress
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    logError(`MAC Address Error: ${errorMessage}`)
    throw new Error(`Device registration requires MAC address access: ${errorMessage}`)
  }
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
  return deviceRepo.getUserDevices(userId, filter)
}

const logoutDevice = async (userId: string, deviceId: string) => {
  const currentDeviceId = await getMacAddress()
  if (deviceId === currentDeviceId) throw new Error('Cannot logout current device')

  return deviceRepo.deleteDevice(userId, deviceId)
}


export const deviceApi = {
  getMacAddress,
  cleanupHostname,
  upsertDevice,
  getUserDevices,
  logoutDevice,
}
