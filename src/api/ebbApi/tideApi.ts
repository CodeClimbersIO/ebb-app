import { QueryResult } from '@tauri-apps/plugin-sql'
import {
  Tide,
  TideTemplate,
  TideRepo,
  TideSchema,
  TideTemplateSchema,
  TideWithTemplate
} from '@/db/ebb/tideRepo'
import { GraphableTimeByHourBlock, MonitorApi } from '@/api/monitorApi/monitorApi'
import { DateTime } from 'luxon'

export type { Tide, TideTemplate, TideWithTemplate }

export interface TideProgress {
  current: number
  goal: number
  isCompleted: boolean
  progressPercentage: number
  overflowAmount?: number
}

export interface TideProgressData {
  tide?: Tide
  progress: TideProgress
}
export interface TideOverview {
  daily: TideProgressData
  weekly: TideProgressData
}

// Tide Template API Functions

const updateTideTemplate = async (
  id: string,
  updates: Partial<TideTemplateSchema>
): Promise<QueryResult> => {
  const updatedTemplate = {
    ...updates,
    updated_at: new Date().toISOString(),
  }
  return TideRepo.updateTideTemplate(id, updatedTemplate)
}

export interface TemplateEdit {
  id: string
  goal_amount: number
  metrics_type: string
  days_of_week: number[]
  tide_frequency: string
}

const updateTideTemplates = async (editedTemplates: TemplateEdit[]): Promise<void> => {
  const updatePromises = []
  const activeTides = await getActiveTides()

  // Update all templates
  for (const editedTemplate of editedTemplates) {
    updatePromises.push(
      updateTideTemplate(editedTemplate.id, {
        goal_amount: editedTemplate.goal_amount,
        day_of_week: editedTemplate.days_of_week.length > 0
          ? editedTemplate.days_of_week.join(',')
          : undefined
      })
    )

    // Update any active tides using this template
    const activeTidesForTemplate = activeTides.filter(tide =>
      tide.tide_template_id === editedTemplate.id
    )

    for (const activeTide of activeTidesForTemplate) { // update any tides that are currently active
      updatePromises.push(
        updateTide(activeTide.id, {
          goal_amount: editedTemplate.goal_amount
        })
      )
    }
  }

  await Promise.all(updatePromises)
}

const getTideTemplates = async (): Promise<TideTemplate[]> => {
  return TideRepo.getAllTideTemplates()
}

// Tide API Functions

const updateTide = async (
  id: string,
  updates: Partial<TideSchema>
): Promise<QueryResult> => {
  const updatedTide = {
    ...updates,
    updated_at: new Date().toISOString(),
  }
  return TideRepo.updateTide(id, updatedTide)
}

const getActiveTides = async (): Promise<Tide[]> => {
  return TideRepo.getActiveTides()
}

// Business Logic Functions

const getTideProgress = async (type = 'daily', date = new Date()): Promise<TideProgressData> => {

  const evaluationTime = date.toISOString()
  console.log('getTideProgress', type, evaluationTime)
  const activeTides = await TideRepo.getActiveTidesForPeriod(evaluationTime)
  // Find today's daily tide for the specific metrics type
  const tide = activeTides.find(tide =>
    tide.tide_frequency === type
  )

  if(!tide) {
    let time: GraphableTimeByHourBlock[] = []
    if(type === 'daily') {
      time = await MonitorApi.getTimeCreatingByDay(DateTime.fromISO(evaluationTime).startOf('day'), DateTime.fromISO(evaluationTime).endOf('day'))
    } else if(type === 'weekly') {
      time = await MonitorApi.getTimeCreatingByWeek(DateTime.fromISO(evaluationTime).startOf('week'), DateTime.fromISO(evaluationTime).endOf('week'))
    }
    const current = time.reduce((acc, curr) => acc + curr.creating, 0)
    return { // no tide for the date
      tide: undefined,
      progress: {
        current: current,
        goal: 0,
        isCompleted: false,
        progressPercentage: 0,
        overflowAmount: undefined
      }
    }
  }

  const progress: TideProgress = {
    current: tide?.actual_amount || 0,
    goal: tide?.goal_amount || 0,
    isCompleted: !!tide?.completed_at,
    progressPercentage: Math.min((tide?.actual_amount / tide?.goal_amount) * 100, 100),
    overflowAmount: tide?.actual_amount > tide?.goal_amount
      ? tide?.actual_amount - tide?.goal_amount
      : undefined
  }

  return {
    tide,
    progress
  }
}

const getTideOverview = async (date = new Date()): Promise<TideOverview> => {
  const [daily, weekly] = await Promise.all([
    getTideProgress('daily', date),
    getTideProgress('weekly', date)
  ])

  return {
    daily,
    weekly
  }
}

const formatTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = Math.round(minutes % 60)

  if (hours === 0) return `${remainingMinutes}m`
  if (remainingMinutes === 0) return `${hours}h`
  return `${hours}h ${remainingMinutes}m`
}

const calculateDaysBetween = (startDate: string, endDate: string): number => {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const diffTime = Math.abs(end.getTime() - start.getTime())
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

const isWithinTimeRange = (checkTime: string, startTime: string, endTime?: string): boolean => {
  const check = new Date(checkTime)
  const start = new Date(startTime)

  if (!endTime) return check >= start // No end time means indefinite

  const end = new Date(endTime)
  return check >= start && check <= end
}

export const TideApi = {
  // Template operations
  updateTideTemplate,
  updateTideTemplates,
  getTideTemplates,

  // Tide operations
  updateTide,
  getActiveTides,

  // Business logic
  getTideOverview,

  // Utilities
  formatTime,
  calculateDaysBetween,
  isWithinTimeRange,
}
