import { QueryResult } from '@tauri-apps/plugin-sql'
import { 
  FocusSchedule, 
  FocusScheduleRepo, 
  CreateFocusSchedule, 
  RecurrenceSettings 
} from '@/db/ebb/focusScheduleRepo'
import { WorkflowApi } from './workflowApi'

export type FocusScheduleWithWorkflow = FocusSchedule & {
  workflow_name?: string
}

const createFocusSchedule = async (
  workflowId: string,
  scheduledTime: Date,
  recurrence: RecurrenceSettings,
  label?: string,
): Promise<string> => {
  const workflow = await WorkflowApi.getWorkflowById(workflowId)
  if (!workflow) throw new Error('Workflow not found')

  const focusSchedule: CreateFocusSchedule = {
    id: crypto.randomUUID(),
    label,
    scheduled_time: scheduledTime.toISOString(),
    workflow_id: workflowId,
    recurrence_settings: JSON.stringify(recurrence),
    is_active: 1,
  }
  
  await FocusScheduleRepo.createFocusSchedule(focusSchedule)
  return focusSchedule.id
}

const updateFocusSchedule = async (
  id: string,
  updates: Partial<{
    workflowId: string
    scheduledTime: Date
    recurrence: RecurrenceSettings
    label?: string
  }>
): Promise<QueryResult> => {
  const updateData: Partial<CreateFocusSchedule> = {}
  
  if (updates.label !== undefined) updateData.label = updates.label
  if (updates.workflowId) updateData.workflow_id = updates.workflowId
  if (updates.scheduledTime) updateData.scheduled_time = updates.scheduledTime.toISOString()
  if (updates.recurrence) updateData.recurrence_settings = JSON.stringify(updates.recurrence)
  
  return FocusScheduleRepo.updateFocusSchedule(id, updateData)
}

const getFocusSchedules = async (): Promise<FocusSchedule[]> => {
  return FocusScheduleRepo.getFocusSchedules()
}

const getFocusSchedulesWithWorkflow = async (): Promise<FocusScheduleWithWorkflow[]> => {
  return FocusScheduleRepo.getFocusSchedulesWithWorkflow()
}

const getFocusScheduleById = async (id: string): Promise<FocusSchedule | undefined> => {
  return FocusScheduleRepo.getFocusScheduleById(id)
}

const deleteFocusSchedule = async (id: string): Promise<QueryResult> => {
  return FocusScheduleRepo.deleteFocusSchedule(id)
}

const formatScheduleDisplay = (schedule: FocusSchedule): string => {
  if (!schedule.recurrence || schedule.recurrence.type === 'none') {
    const date = new Date(schedule.scheduled_time)
    return `${date.toLocaleDateString()} at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
  }
  
  if (schedule.recurrence.type === 'daily') {
    const time = new Date(schedule.scheduled_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    return `Daily at ${time}`
  }
  
  if (schedule.recurrence.type === 'weekly' && schedule.recurrence.daysOfWeek) {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const days = schedule.recurrence.daysOfWeek
      .map(dayIndex => dayNames[dayIndex])
      .sort((a, b) => {
        const dayOrder = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
        return dayOrder.indexOf(a) - dayOrder.indexOf(b)
      })
    
    const time = new Date(schedule.scheduled_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    
    if (days.length === 1) {
      return `${days[0]} at ${time}`
    } else if (days.length === 2) {
      return `${days[0]} and ${days[1]} at ${time}`
    } else if (days.length > 2) {
      const lastDay = days.pop()
      return `${days.join(', ')}, and ${lastDay} at ${time}`
    }
  }
  
  return 'Invalid schedule'
}

export const FocusScheduleApi = {
  createFocusSchedule,
  updateFocusSchedule,
  getFocusSchedules,
  getFocusSchedulesWithWorkflow,
  getFocusScheduleById,
  deleteFocusSchedule,
  formatScheduleDisplay,
}

// Re-export types that components/hooks need
export type { RecurrenceSettings } from '@/db/ebb/focusScheduleRepo'
