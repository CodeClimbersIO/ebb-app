import { QueryResult } from '@tauri-apps/plugin-sql'
import {
  Tide,
  TideTemplate,
  TideRepo,
  TideSchema,
  TideTemplateSchema,
  TideWithTemplate
} from '@/db/ebb/tideRepo'
import { MonitorApi } from '@/api/monitorApi/monitorApi'
import { DateTime } from 'luxon'

export type { Tide, TideTemplate, TideWithTemplate }

export interface TideProgress {
  current: number
  goal: number
  isCompleted: boolean
  progressPercentage: number
  overflowAmount?: number
}

export interface DailyTideData {
  tide?: Tide
  progress: TideProgress
}

export interface WeeklyTideData {
  tides: Tide[]
  progress: TideProgress
}

export interface TideOverview {
  daily: DailyTideData
  weekly: WeeklyTideData
}

// Tide Template API Functions

const createTideTemplate = async (
  metricsType: string,
  tideFrequency: string,
  goalAmount: number,
  firstTide: string,
  dayOfWeek?: string
): Promise<string> => {
  const template: TideTemplateSchema = {
    id: self.crypto.randomUUID(),
    metrics_type: metricsType,
    tide_frequency: tideFrequency,
    first_tide: firstTide,
    day_of_week: dayOfWeek,
    goal_amount: goalAmount,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  await TideRepo.createTideTemplate(template)
  return template.id
}

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

const getTideTemplates = async (): Promise<TideTemplate[]> => {
  return TideRepo.getAllTideTemplates()
}

const getTideTemplateById = async (id: string): Promise<TideTemplate | undefined> => {
  return TideRepo.getTideTemplateById(id)
}

// Tide API Functions

const createTide = async (
  start: string,
  end: string | undefined,
  metricsType: string,
  tideFrequency: string,
  goalAmount: number,
  tideTemplateId: string
): Promise<string> => {
  const tide: TideSchema = {
    id: self.crypto.randomUUID(),
    start,
    end,
    metrics_type: metricsType,
    tide_frequency: tideFrequency,
    goal_amount: goalAmount,
    actual_amount: 0,
    tide_template_id: tideTemplateId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  await TideRepo.createTide(tide)
  return tide.id
}

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

const getTideById = async (id: string): Promise<Tide | undefined> => {
  return TideRepo.getTideById(id)
}

const getActiveTides = async (): Promise<Tide[]> => {
  return TideRepo.getActiveTides()
}

const completeTide = async (id: string): Promise<QueryResult> => {
  return TideRepo.completeTide(id)
}

const updateTideProgress = async (id: string, actualAmount: number): Promise<QueryResult> => {
  return TideRepo.updateTideProgress(id, actualAmount)
}

// Business Logic Functions

const getCurrentDailyTide = async (metricsType = 'creating'): Promise<DailyTideData> => {
  const today = new Date()
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)

  const evaluationTime = new Date().toISOString()
  const activeTides = await TideRepo.getActiveTidesForPeriod(evaluationTime)

  // Find today's daily tide for the specific metrics type
  const dailyTide = activeTides.find(tide =>
    tide.tide_frequency === 'daily' &&
    tide.metrics_type === metricsType &&
    new Date(tide.start) >= startOfDay &&
    new Date(tide.start) < endOfDay
  )

  // If there's no tide, we still want to get today's activity time
  // For now, we'll return 0 but this could be enhanced to query actual activity data
  const actualTimeToday = dailyTide ? dailyTide.actual_amount : await getTodaysActivityTime(metricsType)

  const progress: TideProgress = dailyTide ? {
    current: dailyTide.actual_amount,
    goal: dailyTide.goal_amount,
    isCompleted: !!dailyTide.completed_at,
    progressPercentage: Math.min((dailyTide.actual_amount / dailyTide.goal_amount) * 100, 100),
    overflowAmount: dailyTide.actual_amount > dailyTide.goal_amount
      ? dailyTide.actual_amount - dailyTide.goal_amount
      : undefined
  } : {
    current: actualTimeToday,
    goal: 0,
    isCompleted: false,
    progressPercentage: 0
  }

  return {
    tide: dailyTide,
    progress
  }
}

const getCurrentWeeklyTide = async (metricsType = 'creating'): Promise<WeeklyTideData> => {
  const today = new Date()
  const startOfWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay())
  const endOfWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay() + 7)

  const evaluationTime = new Date().toISOString()
  const activeTides = await TideRepo.getActiveTidesForPeriod(evaluationTime)

  // Find this week's weekly tide for the specific metrics type
  const weeklyTides = activeTides.filter(tide =>
    tide.tide_frequency === 'weekly' &&
    tide.metrics_type === metricsType &&
    new Date(tide.start) >= startOfWeek &&
    new Date(tide.start) < endOfWeek
  )

  // Calculate combined progress for weekly tides
  const totalCurrent = weeklyTides.reduce((sum, tide) => sum + tide.actual_amount, 0)
  const totalGoal = weeklyTides.reduce((sum, tide) => sum + tide.goal_amount, 0)
  const allCompleted = weeklyTides.length > 0 && weeklyTides.every(tide => tide.completed_at)

  const progress: TideProgress = {
    current: totalCurrent,
    goal: totalGoal,
    isCompleted: allCompleted,
    progressPercentage: totalGoal > 0 ? Math.min((totalCurrent / totalGoal) * 100, 100) : 0,
    overflowAmount: totalCurrent > totalGoal ? totalCurrent - totalGoal : undefined
  }

  return {
    tides: weeklyTides,
    progress
  }
}

const getTideOverview = async (metricsType = 'creating'): Promise<TideOverview> => {
  const [daily, weekly] = await Promise.all([
    getCurrentDailyTide(metricsType),
    getCurrentWeeklyTide(metricsType)
  ])

  return {
    daily,
    weekly
  }
}

const getRecentTides = async (limit = 10): Promise<Tide[]> => {
  return TideRepo.getRecentTides(limit)
}

const getTidesWithTemplates = async (limit = 10): Promise<TideWithTemplate[]> => {
  return TideRepo.getTidesWithTemplates(limit)
}

// Helper Functions

const getTodaysActivityTime = async (metricsType: string): Promise<number> => {
  try {
    const today = DateTime.now()
    const start = today.startOf('day')
    const end = today.endOf('day')

    const chartData = await MonitorApi.getTimeCreatingByHour(start, end)

    if (metricsType === 'creating') {
      return chartData.reduce((acc, curr) => acc + curr.creating, 0)
    } else if (metricsType === 'neutral') {
      return chartData.reduce((acc, curr) => acc + curr.neutral, 0)
    } else if (metricsType === 'consuming') {
      return chartData.reduce((acc, curr) => acc + curr.consuming, 0)
    }

    return 0
  } catch (error) {
    console.error(`Error getting today's activity time for ${metricsType}:`, error)
    return 0
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
  createTideTemplate,
  updateTideTemplate,
  getTideTemplates,
  getTideTemplateById,

  // Tide operations
  createTide,
  updateTide,
  getTideById,
  getActiveTides,
  completeTide,
  updateTideProgress,

  // Business logic
  getCurrentDailyTide,
  getCurrentWeeklyTide,
  getTideOverview,
  getRecentTides,
  getTidesWithTemplates,

  // Utilities
  formatTime,
  calculateDaysBetween,
  isWithinTimeRange,
}
