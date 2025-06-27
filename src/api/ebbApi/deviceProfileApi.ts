import { invoke } from '@tauri-apps/api/core'
import { logAndToastError } from '@/lib/utils/ebbError.util'
import { WorkflowRepo } from '../../db/ebb/workflowRepo'

export interface SmartFocusSettings {
  enabled: boolean
  trigger_duration_minutes: number // 10, 15, 20, 25, 30 (increments of 5)
  workflow_id: string | null
}

const DEFAULT_SMART_FOCUS_SETTINGS: SmartFocusSettings = {
  enabled: false,
  trigger_duration_minutes: 10,
  workflow_id: null
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

// Idle Sensitivity (moved from SettingsPage for consistency)
const getIdleSensitivity = async (): Promise<number> => {
  try {
    return await invoke<number>('get_idle_sensitivity')
  } catch (error) {
    logAndToastError(`Failed to get idle sensitivity: ${error}`, error)
    return 60 // Default fallback
  }
}

const setIdleSensitivity = async (sensitivity: number): Promise<void> => {
  try {
    await invoke('set_idle_sensitivity', { sensitivity })
  } catch (error) {
    logAndToastError(`Failed to set idle sensitivity: ${error}`, error)
    throw error
  }
}

const getDeviceId = async (): Promise<string> => {
  try {
    return await invoke<string>('get_device_id')
  } catch (error) {
    logAndToastError(`Failed to get device id: ${error}`, error)
    return ''
  }
}

export const DeviceProfileApi = {
  // Smart Focus
  getSmartFocusSettings,
  updateSmartFocusSettings,
  // Idle Sensitivity
  getIdleSensitivity,
  setIdleSensitivity,
  getDeviceId
}
