import { DateTime } from 'luxon'
import { MonitorApi } from '../monitorApi/monitorApi'
import { FlowSessionApi } from './flowSessionApi'

const isCreatingFromTimePeriod = async (start: DateTime, end: DateTime): Promise<boolean> => {
  const activityStates = await MonitorApi.getTimeCreatingByTimePeriod(start, end)
  const tags = activityStates.map(state => state.tags_json).flat()
  
  // 75% of tags must be creating
  const creatingCount = tags.filter(tag => tag?.name === 'creating').length

  const totalCount = tags.length
  const percentage = creatingCount / totalCount
  return percentage >= 0.75
}

export const SmartSessionApi = {
  startSmartSession: async () => {
    const inProgressSession = await FlowSessionApi.getInProgressFlowSession()
    if (inProgressSession) {
      return inProgressSession
    }

    const mostRecentSession = await FlowSessionApi.getMostRecentFlowSession()
    // allow for a cooldown period between sessions of 30 minutes
    const timeSinceLastSession = DateTime.fromISO(mostRecentSession?.start || '').diffNow('minutes').minutes
    if (mostRecentSession && timeSinceLastSession > -30) {
      return
    }

    const isCreating = await isCreatingFromTimePeriod(DateTime.now().toUTC().minus({ minutes: 10 }), DateTime.now().toUTC())
    if (!isCreating) {
      return
    }

    const newSession = await FlowSessionApi.startFlowSession('Smart Flow')
    
    return newSession
  },
}
