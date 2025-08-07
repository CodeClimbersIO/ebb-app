import { DateTime } from 'luxon'
import { MonitorApi } from '../monitorApi/monitorApi'
import { FlowSessionApi } from './flowSessionApi'
import { DeviceProfileApi } from './deviceProfileApi'
import { FlowSession } from '../../db/ebb/flowSessionRepo'
import { WorkflowApi } from './workflowApi'

const isCreatingFromTimePeriod = async (start: DateTime, end: DateTime): Promise<boolean> => {
  const activityStates = await MonitorApi.getActivityStatesByTimePeriod(start, end)
  const tags = activityStates.map(state => state.tags_json).flat()
  
  // 75% of tags must be creating
  const creatingCount = tags.filter(tag => tag?.name === 'creating').length

  const totalDuration = activityStates.reduce((acc, state) => {
    const startTime = DateTime.fromISO(state.start_time)
    const endTime = DateTime.fromISO(state.end_time)
    return acc + endTime.diff(startTime).toMillis()
  }, 0)
  if (totalDuration < end.diff(start).toMillis()) {
    return false
  }

  const totalCount = tags.length
  const percentage = creatingCount / totalCount
  return percentage >= 0.75
}

const doomscrollDetectionForTimePeriod = async (start: DateTime, end: DateTime): Promise<boolean> => {
  const activityStates = await MonitorApi.getActivityStatesByTimePeriod(start, end)
  const tags = activityStates.map(state => state.tags_json).flat()
  const doomscrollCount = tags.filter(tag => tag?.name === 'consuming').length

  const totalDuration = activityStates.reduce((acc, state) => {
    const startTime = DateTime.fromISO(state.start_time)
    const endTime = DateTime.fromISO(state.end_time)
    return acc + endTime.diff(startTime).toMillis()
  }, 0)
  if (totalDuration < end.diff(start).toMillis()) {
    return false
  }
  
  const totalCount = tags.length
  const percentage = doomscrollCount / totalCount
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
  return timeSinceLastSession > 30 && timeSinceLastSessionCheck > 30
}

type SmartSessionType = 'doomscroll' | 'smart' | 'none'

export const SmartSessionApi = {
  setLastSessionCheck: () => {
    const time = DateTime.now().toISO()
    localStorage.setItem('lastSessionCheck', time)
    return time
  },
  checkShouldSuggestSmartSession: async (deviceId: string): Promise<SmartSessionType> => {
    const inProgressSession = await FlowSessionApi.getInProgressFlowSession()
    if (inProgressSession) {
      return 'none'
    }

    const mostRecentSession = await FlowSessionApi.getMostRecentFlowSession()
    const hasCooldown = hasSmartSessionCooldown(mostRecentSession)
    if (!hasCooldown) {
      return 'none'
    }
    const deviceProfile = await DeviceProfileApi.getDeviceProfile(deviceId)
    const smartFocusSettings = deviceProfile.preferences_json?.smart_focus_settings

    if (!smartFocusSettings || !smartFocusSettings.enabled) {
      return 'none'
    }

    const doomscrollDuration = smartFocusSettings.doomscroll_duration_minutes || 30

    const doomscroll = await doomscrollDetectionForTimePeriod(DateTime.now().toUTC().minus({ minutes: doomscrollDuration }), DateTime.now().toUTC())
    if (doomscroll) {
      return 'doomscroll'
    }

    const triggerDuration = smartFocusSettings.trigger_duration_minutes || 10
    
    const isCreating = await isCreatingFromTimePeriod(DateTime.now().toUTC().minus({ minutes: triggerDuration }), DateTime.now().toUTC())
    if (!isCreating) {
      return 'none'
    }


    return 'smart'
  },
  startSmartSession: async () => {
    const newSession = await FlowSessionApi.startFlowSession('Smart Flow', 'smart')
    
    return newSession
  },
  startSmartSessionWithWorkflow: async (workflowId: string) => {
    const workflow = await WorkflowApi.getWorkflowById(workflowId)
    if (!workflow) {
      throw new Error(`Workflow with ID ${workflowId} not found`)
    }
    
    const newSession = await FlowSessionApi.startFlowSession(workflow.name, 'manual', workflow)
    
    return newSession
  },
  isCreatingFromTimePeriod,
  doomscrollDetectionForTimePeriod,
}
