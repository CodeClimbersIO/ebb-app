import { getEbbDb } from './ebbDb'

export interface SmartFocusSettings {
  enabled: boolean
  trigger_duration_minutes: number // 10, 15, 20, 25, 30 (increments of 5)
  workflow_id: string | null
}

export interface DevicePreference {
  idle_sensitivity: number
  smart_focus_settings: SmartFocusSettings
}

export interface DeviceProfileDb {
  id: string
  user_id: string
  device_id: string
  preferences: string
  created_at: string
  updated_at: string
}

interface Device {
  id: string
  created_at: string
  updated_at: string
}

const getDeviceId = async (): Promise<string> => {
  const ebbDb = await getEbbDb()
  const [device] = await ebbDb.select<Device[]>('SELECT * FROM device')
  return device.id
}

const getDeviceProfile = async (deviceId: string): Promise<DeviceProfileDb> => {
  const ebbDb = await getEbbDb()
  const [deviceProfile] = await ebbDb.select<DeviceProfileDb[]>(
    'SELECT * FROM device_profile WHERE device_id = ?',
    [deviceId]
  )
  return deviceProfile
}

const updateDeviceProfilePreferences = async (deviceId: string, preferences: DevicePreference): Promise<void> => {
  const ebbDb = await getEbbDb()
  await ebbDb.execute(
    'UPDATE device_profile SET preferences = ? WHERE device_id = ?',
    [preferences, deviceId]
  )
}

export const DeviceProfileRepo = {
  getDeviceId,
  getDeviceProfile,
  updateDeviceProfilePreferences,
}
