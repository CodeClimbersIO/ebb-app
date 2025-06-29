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

const updateDeviceProfilePreferences = async (deviceId: string, preferences: DevicePreference): Promise<void> => {
  return DeviceProfileRepo.updateDeviceProfilePreferences(deviceId, preferences)
}

const getDeviceProfile = async (deviceId: string): Promise<DeviceProfile> => {
  const repoProfile = await DeviceProfileRepo.getDeviceProfile(deviceId)
  let deviceProfile = {
    ...repoProfile,
    preferences_json: JSON.parse(repoProfile.preferences)
  }
  if(!deviceProfile.preferences_json?.smart_focus_settings?.workflow_id) { // set smart focus workflow id if not set
    const latestWorkflow = await WorkflowRepo.getLatestWorkflow()
    if(latestWorkflow) {
      await DeviceProfileRepo.updateDeviceProfilePreferences(deviceId, {
        ...deviceProfile.preferences_json,
        smart_focus_settings: {
          enabled: true,
          trigger_duration_minutes: DEFAULT_SMART_FOCUS_SETTINGS.trigger_duration_minutes,
          workflow_id: latestWorkflow.id
        }
      } as DevicePreference)
      deviceProfile = {
        ...repoProfile,
        preferences_json: {
          ...deviceProfile.preferences_json,
          smart_focus_settings: {
            enabled: true,
            trigger_duration_minutes: DEFAULT_SMART_FOCUS_SETTINGS.trigger_duration_minutes,
            workflow_id: latestWorkflow.id,
          }
        },
      }
    }
  }
  return deviceProfile
}


const getDeviceId = async (): Promise<string> => {
  return DeviceProfileRepo.getDeviceId()
}

export const DeviceProfileApi = {
  getDeviceProfile,
  updateDeviceProfilePreferences,
  getDeviceId
}
