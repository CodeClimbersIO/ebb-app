import { DateTime } from 'luxon'
import { MonitorApi } from '../monitorApi/monitorApi'
import { FlowSessionApi } from './flowSessionApi'
import { DeviceProfileApi } from './deviceProfileApi'
import { FlowSession } from '../../db/ebb/flowSessionRepo'

const isCreatingFromTimePeriod = async (start: DateTime, end: DateTime): Promise<boolean> => {
  const activityStates = await MonitorApi.getActivityStatesByTimePeriod(start, end)
  const tags = activityStates.map(state => state.tags_json).flat()
  
  // 75% of tags must be creating
  const creatingCount = tags.filter(tag => tag?.name === 'creating').length

  const totalCount = tags.length
  const percentage = creatingCount / totalCount
  return percentage >= 0.75
}

const getLastSessionCheck = () => {
  const time = localStorage.getItem('lastSessionCheck')
  return time ? DateTime.fromISO(time) : null
}

export const hasSmartSessionCooldown = (mostRecentSession?: FlowSession)=>{
  const now = DateTime.now()
  if(!mostRecentSession || !mostRecentSession.end) return
  const lastSessionEnd = DateTime.fromISO(mostRecentSession.end)
  const timeSinceLastSession = now.diff(lastSessionEnd, 'minutes').minutes

  const lastSessionCheck = getLastSessionCheck()
  const timeSinceLastSessionCheck = lastSessionCheck ? now.diff(lastSessionCheck, 'minutes').minutes : 1000
  return timeSinceLastSession > 60 && timeSinceLastSessionCheck > 30
}

export const SmartSessionApi = {
  setLastSessionCheck: () => {
    const time = DateTime.now().toISO()
    localStorage.setItem('lastSessionCheck', time)
    return time
  },
  checkShouldSuggestSmartSession: async (deviceId: string) => {
    const inProgressSession = await FlowSessionApi.getInProgressFlowSession()
    if (inProgressSession) {
      return
    }

    const mostRecentSession = await FlowSessionApi.getMostRecentFlowSession()
    const hasCooldown = hasSmartSessionCooldown(mostRecentSession)
    if (!hasCooldown) {
      return
    }
    const deviceProfile = await DeviceProfileApi.getDeviceProfile(deviceId)
    const smartFocusSettings = deviceProfile.preferences_json?.smart_focus_settings

    if (!smartFocusSettings || !smartFocusSettings.enabled) {
      return
    }

    const triggerDuration = smartFocusSettings.trigger_duration_minutes || 10
    const isCreating = await isCreatingFromTimePeriod(DateTime.now().toUTC().minus({ minutes: triggerDuration }), DateTime.now().toUTC())
    if (!isCreating) {
      return
    }

    return true
  },
  startSmartSession: async () => {
    const newSession = await FlowSessionApi.startFlowSession('Smart Flow', 'smart')
    
    return newSession
  },
}
