import { EbbStatus } from '@/api/hooks/useProfile'
import { FlowSessionApi } from '@/api/ebbApi/flowSessionApi'
import { MonitorApi } from '@/api/monitorApi/monitorApi'
import { DateTime } from 'luxon'
import { Activity } from '../db/monitor/activityRepo'

/**
 * Used to update the online status of the user in the supabase user_profile table
 * Starts a "worker" to monitor the status of the user and update the profile accordingly
 * Online: User's app is open and connected to the internet
 * Flowing: User is online and in a Flow Session
 * Active: User is online and has activity within the last 5 minutes
 * Offline: User's app is closed and not connected to the internet
 */

const isActive = (activity?: Activity) => {
  const lastActivity = activity && DateTime.fromISO(activity.timestamp)
  const diff = lastActivity && DateTime.now().diff(lastActivity).as('minutes')
  const activeWithin5Min = lastActivity && diff && diff < 5
  return activeWithin5Min
}

export const calculateCurrentStatus = async (): Promise<EbbStatus> => {
  const flow = await FlowSessionApi.getInProgressFlowSession()
  if(flow) {
    return 'flowing'
  }
  const activity = await MonitorApi.getLatestActivity()
  if(isActive(activity)) {
    return 'active'
  }

  return 'online'
}
