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

const getTideProgress = async (type = 'daily', {date = new Date(), isBadgeRequest = false}: {date?: Date, isBadgeRequest?: boolean}): Promise<TideProgressData> => {
  const evaluationTime = date.toISOString()
  
  const activeTides = await TideRepo.getActiveTidesForPeriod(evaluationTime)
  // Find today's daily tide for the specific metrics type
  const tide = activeTides.find(tide =>
    tide.tide_frequency === type
  )

  if(!tide) {
    if(isBadgeRequest) { // if we don't have a tide and it's for a badge, don't make the api call and return 0
      return {
        tide: undefined,
        progress: {
          current: 0,
          goal: 0,
          isCompleted: false,
          progressPercentage: 0,
          overflowAmount: undefined
        }
      }
    }
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
  const startTime = Date.now()
  
  const [daily, weekly] = await Promise.all([
    getTideProgress('daily', {date, isBadgeRequest: false}),
    getTideProgress('weekly', {date, isBadgeRequest: false})
  ])

  const totalTime = Date.now() - startTime
  console.log('🌊 TideOverview:', `${totalTime}ms`)

  return {
    daily,
    weekly
  }
}

export interface DailyTideHistory {
  date: string // ISO date
  dayOfWeek: number // 0-6
  progress: TideProgress
}

export interface WeeklyTideHistory {
  weekStart: string // ISO date of week start (Sunday)
  weekEnd: string // ISO date of week end (Saturday)
  weekNumber: number // Week number in month (1-5)
  progress: TideProgress
}

const getWeeklyDailyHistory = async (date = new Date()): Promise<DailyTideHistory[]> => {
  const dateTime = DateTime.fromJSDate(date)
  const startOfWeek = dateTime.startOf('week') // Sunday

  const history: DailyTideHistory[] = []

  // Get daily tide template to know which days have goals
  const templates = await TideRepo.getAllTideTemplates()
  const dailyTemplate = templates.find(t => t.tide_frequency === 'daily')

  if (!dailyTemplate) {
    return []
  }

  // Parse days of week from template (comma-separated: "0,1,2,3,4,5,6")
  const activeDays = dailyTemplate.day_of_week
    ? dailyTemplate.day_of_week.split(',').map(Number)
    : [1, 2, 3, 4, 5] // Default to weekdays

  // Iterate through each day of the week
  for (let i = 0; i < 7; i++) {
    const currentDay = startOfWeek.plus({ days: i })
    // Luxon weekday is 1-7 (Mon-Sun), convert to 0-6 (Sun-Sat)
    const dayOfWeek = currentDay.weekday === 7 ? 0 : currentDay.weekday

    // Skip if this day doesn't have a goal
    if (!activeDays.includes(dayOfWeek)) {
      continue
    }

    const progress = await getTideProgress('daily', {date: currentDay.toJSDate(), isBadgeRequest: true})

    history.push({
      date: currentDay.toISODate() || '',
      dayOfWeek,
      progress: progress.progress
    })
  }

  return history
}

const getMonthlyWeeklyHistory = async (date = new Date()): Promise<WeeklyTideHistory[]> => {
  const dateTime = DateTime.fromJSDate(date)
  const startOfMonth = dateTime.startOf('month')
  const endOfMonth = dateTime.endOf('month')

  const history: WeeklyTideHistory[] = []

  // Start from the first Sunday of or before the month
  let currentWeekStart = startOfMonth.startOf('week') // Sunday

  let weekNumber = 1

  // Iterate through each week that overlaps with the current month
  while (currentWeekStart <= endOfMonth) {
    const weekEnd = currentWeekStart.plus({ days: 6 }) // Saturday

    // Only include weeks that have at least one day in the current month
    if (weekEnd >= startOfMonth && currentWeekStart <= endOfMonth) {
      const progress = await getTideProgress('weekly', {date: currentWeekStart.toJSDate(), isBadgeRequest: true})

      history.push({
        weekStart: currentWeekStart.toISODate() || '',
        weekEnd: weekEnd.toISODate() || '',
        weekNumber,
        progress: progress.progress
      })

      weekNumber++
    }

    // Move to next week
    currentWeekStart = currentWeekStart.plus({ weeks: 1 })
  }

  return history
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
  getWeeklyDailyHistory,
  getMonthlyWeeklyHistory,

  // Utilities
  formatTime,
  calculateDaysBetween,
  isWithinTimeRange,
}
