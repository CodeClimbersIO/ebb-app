import { DateTime } from 'luxon'
import { Tag, TagRepo, TagType } from '../../db/monitor/tagRepo'
import { ActivityState, ActivityStateRepo } from '../../db/monitor/activityStateRepo'
import { ActivityRating } from '@/lib/app-directory/apps-types'
import { App, AppDb, AppRepo, AppTagJoined } from '../../db/monitor/appRepo'
import { Activity, ActivityRepo } from '../../db/monitor/activityRepo'
import { ActivityStateTagRepo } from '../../db/monitor/activityStateTagRepo'


// during this time block, tags had the following duration
export interface TimeBlock {
  startTime: string // "2025-02-08T06:00:00Z"
  endTime: string // "2025-02-08T07:00:00Z"
  tags: {
    [key: string]: {
      tag_id: string
      name: string
      duration: number // in minutes
    }
  }
}

export interface GraphableTimeByHourBlock {
  consuming: number 
  neutral: number // in minutes
  creating: number // in minutes
  idle: number // in minutes -- time when user is idle but computer is on
  offline: number // in minutes -- remaining time when computer is off or app not running
  time: string // "6:00"
  timeRange: string // "6:00 AM - 7:00 AM"
  xAxisLabel: string // "6 AM"
}

export type AppsWithTime = AppDb & {
  duration: number // in minutes
  rating: ActivityRating
  category_tag?: AppTagJoined
  default_tag?: AppTagJoined
}

export const getTagsByType = async (type: TagType): Promise<Tag[]> => {
  const tags = await TagRepo.getTagsByType(type)
  return tags
}

const getActivityStatesByTagsAndTimePeriod = async (tagIds: string[], start: DateTime, end: DateTime) => {
  const activityStates = await ActivityStateRepo.getActivityStatesByTagsAndTimePeriod(tagIds, start, end)
  return activityStates
}


export const getActivityStatesWithApps = async (start: DateTime, end: DateTime) => {
  const activityStates = await ActivityStateRepo.getActivityStatesWithApps(start, end)
  return activityStates
}


const getRatingFromTag = (tag: AppTagJoined | undefined): ActivityRating => {
  if (!tag) return 3
  if (tag.tag_name === 'creating') {
    return tag.weight === 1 ? 5 : 4
  } else if (tag.tag_name === 'consuming') {
    return tag.weight === 1 ? 1 : 2
  }
  return 3
}

// do the opposite of getRatingFromTag
const getTagIdByRating = (rating: ActivityRating, tags: Tag[]): [Tag, number] | [undefined, undefined] => {
  for (const tag of tags) {
    if (rating > 3 && tag.name === 'creating') {
      const weight = rating === 5 ? 1 : 0.5
      return [tag, weight]
    } else if (rating < 3 && tag.name === 'consuming') {
      const weight = rating === 1 ? 1 : 0.5
      return [tag, weight]
    } else if (rating === 3 && tag.name === 'neutral') {
      return [tag, 1]
    }
  }
  return [undefined, undefined]
}

export const setAppDefaultTag = async (appTagId: string, rating: ActivityRating, tags: Tag[]) => {
  // convert value or rating to tag id
  const [tag, weight] = getTagIdByRating(rating, tags)
  if (!tag || !weight) return
  await AppRepo.setAppTag(appTagId, tag.id, weight)
  await ActivityStateTagRepo.updateActivityStateTagById(appTagId, tag.id)
}

export const updateAppRating = async (appTagId: string, rating: ActivityRating) => {
  const tags = await getTagsByType('default')
  await setAppDefaultTag(appTagId, rating, tags)
}


// group activity states by hour and create time blocks. activity states are already sorted by time (ascending)
export const createTimeBlockFromActivityState = (activityStates: ActivityState[]): TimeBlock[] => {
  // Initialize time blocks for each hour
  const timeBlocks: TimeBlock[] = Array.from({ length: 24 }, (_, i) => ({
    startTime: `${i}:00`,
    endTime: `${i + 1}:00`,
    tags: {}
  }))

  // for each activity state, add it to the time block
  for (const activityState of activityStates) {
    const startTime = DateTime.fromISO(activityState.start_time)
    const endTime = DateTime.fromISO(activityState.end_time)
    const duration = endTime.diff(startTime, 'minutes').minutes
    
    // get hour of start time
    const startTimeHour = startTime.hour
    // get timeblock for that hour
    const timeBlock = timeBlocks[startTimeHour]
    
    // If there are multiple tags, split the duration among them
    const tags = activityState.tags_json || []
    if (tags.length > 0) {
      const durationPerTag = duration / tags.length
      
      tags.forEach(tag => {
        if (!timeBlock.tags[tag.name]) {
          timeBlock.tags[tag.name] = {
            tag_id: tag.tag_id,
            name: tag.name,
            duration: 0
          }
        }
        timeBlock.tags[tag.name].duration += durationPerTag
      })
    }
  }

  return timeBlocks
}

// Shared aggregation function
function aggregateTimeBlocks(
  activityStates: ActivityState[],
  unit: 'hour' | 'day' | 'week',
  start?: DateTime,
  end?: DateTime
): GraphableTimeByHourBlock[] {
  const buckets: Record<string, { creating: number, consuming: number, neutral: number, idle: number }> = {}

  // Pre-populate buckets for all hours, days, or weeks in the range
  if (unit === 'hour' && start && end) {
    let current = start.startOf('day')
    while (current <= end.startOf('day')) {
      for (let h = 0; h < 24; h++) {
        const dt = current.set({ hour: h })
        const key = dt.toFormat('yyyy-MM-dd-HH')
        if (!buckets[key]) {
          buckets[key] = { creating: 0, consuming: 0, neutral: 0, idle: 0 }
        }
      }
      current = current.plus({ days: 1 })
    }
  } else if (unit === 'day' && start && end) {
    let current = start.startOf('day')
    while (current <= end.startOf('day')) {
      const key = current.toISODate()!
      if (!buckets[key]) {
        buckets[key] = { creating: 0, consuming: 0, neutral: 0, idle: 0 }
      }
      current = current.plus({ days: 1 })
    }
  } else if (unit === 'week' && start && end) {
    let current = start.startOf('week')
    const today = DateTime.local().endOf('day')
    while (current <= end.startOf('week') && current <= today) {
      const key = current.toFormat('kkkk-WW')
      if (!buckets[key]) {
        buckets[key] = { creating: 0, consuming: 0, neutral: 0, idle: 0 }
      }
      current = current.plus({ weeks: 1 })
    }
  }

  for (const state of activityStates) {
    const dt = DateTime.fromISO(state.start_time)
    const key = unit === 'hour'
      ? dt.toFormat('yyyy-MM-dd-HH')
      : unit === 'day'
        ? dt.toISODate()!
        : dt.toFormat('kkkk-WW')
    if (!buckets[key]) {
      buckets[key] = { creating: 0, consuming: 0, neutral: 0, idle: 0 }
    }
    const tags = state.tags_json || []
    const duration = DateTime.fromISO(state.end_time).diff(dt, 'minutes').minutes
    if (tags.length > 0) {
      const durationPerTag = duration / tags.length
      tags.forEach(tag => {
        if (tag.name === 'creating' || tag.name === 'consuming' || tag.name === 'neutral' || tag.name === 'idle') {
          buckets[key][tag.name] += durationPerTag
        }
      })
    }
  }

  return Object.entries(buckets)
    .filter(([key]) => {
      if (unit !== 'week') return true
      // Only include weeks that have started and are not in the future
      const dt = DateTime.fromFormat(key, 'kkkk-WW')
      return dt <= DateTime.local().endOf('day')
    })
    .map(([key, vals]) => {
      let dt: DateTime
      let time, timeRange, xAxisLabel, offline
      
      // Check if this is a noise period: less than 2 minutes of idle AND no other activity
      const hasOtherActivity = vals.creating > 0 || vals.consuming > 0 || vals.neutral > 0
      const isNoiseIdlePeriod = !hasOtherActivity
      
      if (unit === 'hour') {
        dt = DateTime.fromFormat(key, 'yyyy-MM-dd-HH')
        time = dt.toFormat('h:mm a')
        timeRange = `${dt.toFormat('h:mm a')} - ${dt.plus({ hours: 1 }).toFormat('h:mm a')}`
        xAxisLabel = [6, 10, 14, 18, 22].includes(dt.hour) ? dt.toFormat('h a') : ''
        
        if (isNoiseIdlePeriod) {
          // Set all activity to 0 and offline to full hour
          offline = 60
        } else {
          offline = Math.max(0, 60 - (vals.creating + vals.consuming + vals.neutral + vals.idle))
        }
      } else if (unit === 'day') {
        dt = DateTime.fromISO(key)
        time = dt.toFormat('ccc')
        timeRange = dt.toFormat('cccc, LLL dd')
        xAxisLabel = dt.toFormat('ccc')
        offline = Math.max(0, 24 * 60 - (vals.creating + vals.consuming + vals.neutral + vals.idle))
      } else {
        dt = DateTime.fromFormat(key, 'kkkk-WW')
        time = `Week ${dt.weekNumber}`
        timeRange = `Week of ${dt.startOf('week').toFormat('LLL dd')}`
        xAxisLabel = dt.startOf('week').toFormat('LLL d')
        offline = Math.max(0, 7 * 24 * 60 - (vals.creating + vals.consuming + vals.neutral + vals.idle))
      }

      return {
        creating: isNoiseIdlePeriod ? 0 : Math.round(vals.creating),
        consuming: isNoiseIdlePeriod ? 0 : Math.round(vals.consuming),
        neutral: isNoiseIdlePeriod ? 0 : Math.round(vals.neutral),
        idle: isNoiseIdlePeriod ? 0 : Math.round(vals.idle),
        offline: Math.round(offline),
        time,
        timeRange,
        xAxisLabel,
      }
    })
}

const getActivityStatesByTimePeriod = async (start: DateTime, end: DateTime): Promise<ActivityState[]> => {
  const tags = await TagRepo.getTagsByType('default')
  const activityStatesDB = await getActivityStatesByTagsAndTimePeriod(tags.map(tag => tag.id), start, end)
  const activityStates: ActivityState[] = activityStatesDB.map(state => ({
    ...state,
    tags_json: state.tags ? JSON.parse(state.tags) : []
  }))
  return activityStates
}

const getActivityStateDuration = (activityState: ActivityState): number => {
  return DateTime.fromISO(activityState.end_time).diff(DateTime.fromISO(activityState.start_time), 'minutes').minutes
}

// Temporary until we get type working in `getTimeCreatingByTimePeriod`
const getTimeByCategoryFromSummary = (appUsage: AppsWithTime[] ) => {
  // Derive category totals from appUsage
  const categoryTotals: Record<string, { tag: Tag, total: number }> = {}
  // For the chart, aggregate creating/neutral/consuming per category
  const categoryChart: Record<string, {
    tag: Tag,
    creating: number,
    neutral: number,
    consuming: number,
    idle: number,
    offline: number,
    total: number,
  }> = {}

  appUsage.forEach(app => {
    const cat = app.category_tag || { tag_id: 'others', tag_name: 'others' }
  
    // ---- Totals (for list & stacked bar) ----
    if (!categoryTotals[cat.tag_id]) {
      categoryTotals[cat.tag_id] = {
        tag: {
          id: cat.tag_id,
          name: cat.tag_name,
          tag_type: 'category',
          is_default: false,
          is_blocked: false,
          created_at: '',
          updated_at: '',
          parent_tag_id: null,
        },
        total: 0,
      }
    }
    categoryTotals[cat.tag_id].total += app.duration
  
    // ---- Chart breakdown ----
    if (!categoryChart[cat.tag_id]) {
      categoryChart[cat.tag_id] = {
        tag: categoryTotals[cat.tag_id].tag,
        creating: 0,
        neutral: 0,
        consuming: 0,
        idle: 0,
        offline: 0,
        total: 0,
      }
    }
    // Determine activity bucket based on app rating
    if (app.rating >= 4) {
      categoryChart[cat.tag_id].creating += app.duration
    } else if (app.rating <= 2) {
      categoryChart[cat.tag_id].consuming += app.duration
    } else {
      categoryChart[cat.tag_id].neutral += app.duration
    }
    categoryChart[cat.tag_id].total += app.duration
  })

  const categoriesArr = Object.values(categoryTotals).sort((a, b) => b.total - a.total)
  const totalTime = categoriesArr.reduce((a, b) => a + b.total, 0)
  
  // Color map so we use same color everywhere
  const colorMap: Record<string, string> = {}
    
  const topThree = categoriesArr.slice(0, 3)

  return {
    categoriesArr,
    categoryTotalTime: totalTime,
    colorMap,
    topThree
  }
}

const getTimeCreatingByTimePeriod = async (start: DateTime, end: DateTime) => {
  const activity_states = await getActivityStatesByTimePeriod(start, end)
  const timeCreating = activity_states.reduce((acc, activity_state) => {
    const duration = getActivityStateDuration(activity_state)
    if(activity_state.tags_json?.some(tag => tag.name === 'creating')) {
      return acc + duration
    }
    return acc
  }, 0)
  return timeCreating
}

export const getTimeCreatingByHour = async (start: DateTime, end: DateTime): Promise<GraphableTimeByHourBlock[]> => {
  const tags = await TagRepo.getTagsByType('default')
  const activityStatesDB = await getActivityStatesByTagsAndTimePeriod(tags.map(tag => tag.id), start, end)
  const activityStates: ActivityState[] = activityStatesDB.map(state => ({
    ...state,
    tags_json: state.tags ? JSON.parse(state.tags) : []
  }))
  return aggregateTimeBlocks(activityStates, 'hour', start, end)
}

export const getTimeCreatingByDay = async (start: DateTime, end: DateTime): Promise<GraphableTimeByHourBlock[]> => {
  const tags = await TagRepo.getTagsByType('default')
  const activityStatesDB = await getActivityStatesByTagsAndTimePeriod(tags.map(tag => tag.id), start, end)
  const activityStates: ActivityState[] = activityStatesDB.map(state => ({
    ...state,
    tags_json: state.tags ? JSON.parse(state.tags) : []
  }))
  
  const result = aggregateTimeBlocks(activityStates, 'day', start, end)
  return result
}

export const getTimeCreatingByWeek = async (start: DateTime, end: DateTime): Promise<GraphableTimeByHourBlock[]> => {
  const tags = await TagRepo.getTagsByType('default')
  const activityStatesDB = await getActivityStatesByTagsAndTimePeriod(tags.map(tag => tag.id), start, end)
  const activityStates: ActivityState[] = activityStatesDB.map(state => ({
    ...state,
    tags_json: state.tags ? JSON.parse(state.tags) : []
  }))
  
  const result = aggregateTimeBlocks(activityStates, 'week', start, end)
  return result
}

export const getTopAppsByPeriod = async (start: DateTime, end: DateTime): Promise<AppsWithTime[]> => {
  const activityStatesDB = await getActivityStatesWithApps(start, end)
  const activityStates: ActivityState[] = activityStatesDB.map(state => ({
    ...state,
    apps_json: state.apps ? JSON.parse(state.apps) : []
  }))
  
  const appsWithTime: Record<string, AppsWithTime> = {}
  for (const activityState of activityStates) {
    if (!activityState.apps_json) continue
    const appsUsed = activityState.apps_json.length // so the total time always adds up to .5 minutes between all apps used for the activity state
    for (const app of activityState.apps_json ) {
      if (!appsWithTime[app.id]) {
        appsWithTime[app.id] = {
          ...app,
          duration: 0,
          category_tag: app.tags?.find(tag => tag.tag_type === 'category'),
          default_tag: app.tags?.find(tag => tag.tag_type === 'default'),
          rating: getRatingFromTag(app.tags?.find(tag => tag.tag_type === 'default')),
        }
      }
      const duration = getActivityStateDuration(activityState)
      appsWithTime[app.id].duration += duration / appsUsed
    }
  }

  const sortedApps = Object.values(appsWithTime).sort((a, b) => b.duration - a.duration)
  return sortedApps
}

export const getApps = async (): Promise<App[]> => {
  const appsRaw = await AppRepo.getApps()
  const apps = appsRaw.map(app => {
    const tags: AppTagJoined[] = app.tags_json ? JSON.parse(app.tags_json) : []
    return {
      ...app,
      tags,
      category_tag: tags.find(tag => tag.tag_type === 'category'),
      default_tag: tags.find(tag => tag.tag_type === 'default'),
    }
  })
  return apps
}

export const createApp = async (externalId: string, isBrowser: boolean, name = ''): Promise<string> => {
  const id = await AppRepo.createApp(externalId, isBrowser, name)
  return id
}

const getLatestActivity = async (): Promise<Activity | undefined> => {
  const activity = await ActivityRepo.getLatestActivity()
  return activity
}


export const MonitorApi = {
  getApps,
  getTagsByType,
  getTimeCreatingByHour,
  getTimeCreatingByDay,
  getTimeCreatingByWeek,
  getTopAppsByPeriod,
  setAppDefaultTag,
  updateAppRating,
  createApp,
  getLatestActivity,
  getActivityStatesByTimePeriod,
  getTimeCreatingByTimePeriod,
  getActivityStatesWithApps,
  getTimeByCategoryFromSummary,
}

// Re-export types that components/hooks need
export type { Tag } from '../../db/monitor/tagRepo'
export type { App } from '../../db/monitor/appRepo'
