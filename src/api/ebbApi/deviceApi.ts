import { invoke } from '@tauri-apps/api/core'
import supabase from '@/lib/integrations/supabase'
import { error as logError } from '@tauri-apps/plugin-log'

const getDeviceId = async (): Promise<string> => {
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
  const upsertData = {
    user_id: userId,
    device_id: deviceId,
    device_name: deviceName
  }

  const { error: upsertError } = await supabase
    .from('active_devices')
    .upsert(upsertData, { onConflict: 'user_id,device_id' })

  if (upsertError) {
    logError(`[DeviceReg] Error upserting device: ${JSON.stringify(upsertError, null, 2)}`)
  }
}

export const deviceApi = {
  getDeviceId,
  cleanupHostname,
  upsertDevice
}
