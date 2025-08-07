import { FocusScheduleApi, FocusScheduleWithWorkflow } from './focusScheduleApi'
import { FocusSchedule } from '@/db/ebb/focusScheduleRepo'
import { DateTime } from 'luxon'

export type ScheduledSessionAction = 
  | { type: 'none' }
  | { type: 'reminder', schedule: ScheduledSessionInfo }
  | { type: 'start', schedule: ScheduledSessionInfo }

export interface ScheduledSessionInfo {
  id: string
  label?: string
  workflowId: string
  workflowName?: string
  scheduledTime: DateTime
  originalScheduleTime: DateTime
}

// Track which sessions we've already reminded about to prevent spam
const remindersSent = new Set<string>()
const startNotificationsSent = new Set<string>()

// Helper function to calculate next occurrence for weekly recurring sessions
const getNextOccurrenceForWeeklySchedule = (schedule: FocusSchedule, now: DateTime): DateTime | null => {
  if (!schedule.recurrence || schedule.recurrence.type !== 'weekly' || !schedule.recurrence.daysOfWeek) {
    return null
  }

  const originalTime = DateTime.fromISO(schedule.scheduled_time)
  const todayStart = now.startOf('day')
  
  // Check each day of the week that this schedule should occur
  for (let i = 0; i < 7; i++) {
    const checkDate = todayStart.plus({ days: i })
    const dayOfWeek = checkDate.weekday === 7 ? 0 : checkDate.weekday // Luxon uses 1-7 (Mon-Sun), we use 0-6 (Sun-Sat)
    
    if (schedule.recurrence.daysOfWeek.includes(dayOfWeek)) {
      // Create the scheduled time for this day
      const scheduledTime = checkDate.set({
        hour: originalTime.hour,
        minute: originalTime.minute,
        second: originalTime.second,
        millisecond: originalTime.millisecond
      })
      
      // If this occurrence is in the future, return it
      if (scheduledTime > now) {
        return scheduledTime
      }
    }
  }
  
  // If no occurrence found in the next 7 days, check the following week
  const nextWeekStart = todayStart.plus({ weeks: 1 })
  for (let i = 0; i < 7; i++) {
    const checkDate = nextWeekStart.plus({ days: i })
    const dayOfWeek = checkDate.weekday === 7 ? 0 : checkDate.weekday
    
    if (schedule.recurrence.daysOfWeek.includes(dayOfWeek)) {
      const scheduledTime = checkDate.set({
        hour: originalTime.hour,
        minute: originalTime.minute,
        second: originalTime.second,
        millisecond: originalTime.millisecond
      })
      
      return scheduledTime
    }
  }
  
  return null
}

// Helper function to calculate next occurrence for daily recurring sessions
const getNextOccurrenceForDailySchedule = (schedule: FocusSchedule, now: DateTime): DateTime | null => {
  if (!schedule.recurrence || schedule.recurrence.type !== 'daily') {
    return null
  }

  const originalTime = DateTime.fromISO(schedule.scheduled_time)
  const todayScheduled = now.startOf('day').set({
    hour: originalTime.hour,
    minute: originalTime.minute,
    second: originalTime.second,
    millisecond: originalTime.millisecond
  })

  // If today's scheduled time hasn't passed yet, return it
  if (todayScheduled > now) {
    return todayScheduled
  }

  // Otherwise return tomorrow's scheduled time
  return todayScheduled.plus({ days: 1 })
}

// Helper function to get next occurrence for any schedule
const getNextOccurrence = (schedule: FocusSchedule, now: DateTime): DateTime | null => {
  if (!schedule.recurrence || schedule.recurrence.type === 'none') {
    // One-time schedule - check if it's in the future
    const scheduledTime = DateTime.fromISO(schedule.scheduled_time)
    return scheduledTime > now ? scheduledTime : null
  }

  if (schedule.recurrence.type === 'daily') {
    return getNextOccurrenceForDailySchedule(schedule, now)
  }

  if (schedule.recurrence.type === 'weekly') {
    return getNextOccurrenceForWeeklySchedule(schedule, now)
  }

  return null
}

// Generate a unique key for tracking reminders and notifications
const generateSessionKey = (scheduleId: string, scheduledTime: DateTime): string => {
  return `${scheduleId}-${scheduledTime.toISO()}`
}

// Check if we should show a reminder or start a session
export const checkScheduledSessionStatus = async (): Promise<ScheduledSessionAction> => {
  try {
    const schedules = await FocusScheduleApi.getFocusSchedulesWithWorkflow()
    const now = DateTime.now()
    
    // Check each active schedule
    for (const schedule of schedules) {
      const nextOccurrence = getNextOccurrence(schedule, now)
      
      if (!nextOccurrence) continue
      
      const minutesUntilSession = nextOccurrence.diff(now, 'minutes').minutes
      const sessionKey = generateSessionKey(schedule.id, nextOccurrence)
      
      // If the session should start now (within 2 minutes of scheduled time)
      if (minutesUntilSession <= 2 && minutesUntilSession >= -2) {
        if (!startNotificationsSent.has(sessionKey)) {
          startNotificationsSent.add(sessionKey)
          
          return {
            type: 'start',
            schedule: {
              id: schedule.id,
              label: schedule.label,
              workflowId: schedule.workflow_id,
              workflowName: (schedule as FocusScheduleWithWorkflow).workflow_name,
              scheduledTime: nextOccurrence,
              originalScheduleTime: DateTime.fromISO(schedule.scheduled_time)
            }
          }
        }
      }
      
      // If the session is in 15 minutes (14-16 minutes to allow for polling interval)
      else if (minutesUntilSession >= 14 && minutesUntilSession <= 16) {
        if (!remindersSent.has(sessionKey)) {
          remindersSent.add(sessionKey)
          
          return {
            type: 'reminder',
            schedule: {
              id: schedule.id,
              label: schedule.label,
              workflowId: schedule.workflow_id,
              workflowName: (schedule as FocusScheduleWithWorkflow).workflow_name,
              scheduledTime: nextOccurrence,
              originalScheduleTime: DateTime.fromISO(schedule.scheduled_time)
            }
          }
        }
      }
    }
    
    return { type: 'none' }
  } catch (error) {
    console.error('Failed to check scheduled session status:', error)
    return { type: 'none' }
  }
}

// Clean up old reminder/notification tracking (call this periodically)
export const cleanupOldSessionTracking = (): void => {
  const oneDayAgo = DateTime.now().minus({ days: 1 })
  
  // Remove tracking for sessions that were more than a day ago
  for (const sessionKey of remindersSent) {
    const scheduledTimeStr = sessionKey.split('-').slice(1).join('-')
    try {
      const scheduledTime = DateTime.fromISO(scheduledTimeStr)
      if (scheduledTime < oneDayAgo) {
        remindersSent.delete(sessionKey)
      }
    } catch {
      // If we can't parse the time, remove the key
      remindersSent.delete(sessionKey)
    }
  }
  
  for (const sessionKey of startNotificationsSent) {
    const scheduledTimeStr = sessionKey.split('-').slice(1).join('-')
    try {
      const scheduledTime = DateTime.fromISO(scheduledTimeStr)
      if (scheduledTime < oneDayAgo) {
        startNotificationsSent.delete(sessionKey)
      }
    } catch {
      startNotificationsSent.delete(sessionKey)
    }
  }
}

export const ScheduledSessionExecutionApi = {
  checkScheduledSessionStatus,
  cleanupOldSessionTracking,
}
