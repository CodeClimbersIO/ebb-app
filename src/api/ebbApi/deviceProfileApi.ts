import { invoke } from '@tauri-apps/api/core'
import { logAndToastError } from '@/lib/utils/ebbError.util'
import { WorkflowRepo } from '../../db/ebb/workflowRepo'
import { DevicePreference, DeviceProfileDb, DeviceProfileRepo, SmartFocusSettings } from '../../db/ebb/deviceProfileRepo'


const DEFAULT_SMART_FOCUS_SETTINGS: SmartFocusSettings = {
  enabled: false,
  trigger_duration_minutes: 10,
  workflow_id: null
}

export type DeviceProfile = DeviceProfileDb & {
  preferences_json: DevicePreference
}

// Smart Focus Settings
const getSmartFocusSettings = async (): Promise<SmartFocusSettings> => {
  try {
    const settings = await invoke<SmartFocusSettings | null>('get_smart_focus_settings')
    if(!settings?.workflow_id) { // set smart focus workflow id if not set
      const latestWorkflow = await WorkflowRepo.getLatestWorkflow()
      if(latestWorkflow) {
        await updateSmartFocusSettings({
          enabled: true,
          trigger_duration_minutes: DEFAULT_SMART_FOCUS_SETTINGS.trigger_duration_minutes,
          workflow_id: latestWorkflow.id
        })
      }
    }
    return settings || DEFAULT_SMART_FOCUS_SETTINGS
  } catch (error) {
    logAndToastError(`Failed to get smart focus settings: ${error}`, error)
    return DEFAULT_SMART_FOCUS_SETTINGS
  }
}

const updateSmartFocusSettings = async (settings: SmartFocusSettings): Promise<void> => {
  try {
    await invoke('update_smart_focus_settings', { settings })
  } catch (error) {
    logAndToastError(`Failed to update smart focus settings: ${error}`, error)
    throw error
  }
}


const getDeviceProfile = async (deviceId: string): Promise<DeviceProfile> => {
  const deviceProfile = await DeviceProfileRepo.getDeviceProfile(deviceId)
  return {
    ...deviceProfile,
    preferences_json: JSON.parse(deviceProfile.preferences)
  }
}

const updateDeviceProfilePreferences = async (deviceId: string, preferences: DevicePreference): Promise<void> => {
  return DeviceProfileRepo.updateDeviceProfilePreferences(deviceId, preferences)
}

const getDeviceId = async (): Promise<string> => {
  return DeviceProfileRepo.getDeviceId()
}

export const DeviceProfileApi = {
  // Smart Focus
  getSmartFocusSettings,
  updateSmartFocusSettings,
  // Idle Sensitivity
  getDeviceProfile,
  updateDeviceProfilePreferences,
  getDeviceId
}
