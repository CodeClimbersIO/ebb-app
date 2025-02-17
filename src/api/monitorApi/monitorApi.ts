import { DateTime } from 'luxon'
import { Tag, TagRepo, TagType } from '../../db/monitor/tagRepo'
import { ActivityState, ActivityStateRepo, App, AppTag } from '../../db/monitor/activityStateRepo'
import { ActivityRating } from '../../lib/app-directory/apps-types'
import { AppRepo } from '../../db/monitor/appRepo'


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
  consuming: number // in minutes
  creating: number // in minutes
  offline: number // in minutes -- remaining in the hour
  time: string // "6:00"
  timeRange: string // "6:00 AM - 7:00 AM"
  xAxisLabel: string // "6 AM"
}

export type AppsWithTime = App & {
  duration: number // in minutes
  rating: ActivityRating
  category_tag?: AppTag
  default_tag?: AppTag
  icon?: string
}

export const getTagsByType = async (type: TagType): Promise<Tag[]> => {
  const tags = await TagRepo.getTagsByType(type)
  return tags
}

export const getActivityStatesByTagsAndTimePeriod = async (tagIds: string[], start: DateTime, end: DateTime) => {
  const activityStates = await ActivityStateRepo.getActivityStatesByTagsAndTimePeriod(tagIds, start, end)
  return activityStates
}


export const getActivityStatesWithApps = async (start: DateTime, end: DateTime) => {
  const activityStates = await ActivityStateRepo.getActivityStatesWithApps(start, end)
  return activityStates
}


const getRatingFromTag = (tag: AppTag | undefined): ActivityRating => {
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

export const getTimeCreatingByHour = async (start: DateTime, end: DateTime): Promise<GraphableTimeByHourBlock[]> => {
  const tags = await TagRepo.getTagsByType('default')
  const activityStatesDB = await getActivityStatesByTagsAndTimePeriod(tags.map(tag => tag.id), start, end)
  const activityStates: ActivityState[] = activityStatesDB.map(state => ({
    ...state,
    tags_json: state.tags ? JSON.parse(state.tags) : []
  }))
  const timeBlocks = createTimeBlockFromActivityState(activityStates)
  const currentHour = DateTime.now().hour
  const currentMinute = DateTime.now().minute

  // convert time blocks to graphable time by hour block
  const graphableTimeByHourBlocks = timeBlocks.map(timeBlock => {
    const startHour = DateTime.now().set({ hour: parseInt(timeBlock.startTime.split(':')[0]) }).startOf('hour')
    const endHour = DateTime.now().set({ hour: parseInt(timeBlock.endTime.split(':')[0]) }).startOf('hour')
    const time = startHour.toFormat('h:mm a')
    const timeRange = `${startHour.toFormat('h:mm a')} - ${endHour.toFormat('h:mm a')}`
    const showLabel = [6, 10, 14, 18, 22].includes(startHour.hour)
    const xAxisLabel = showLabel ? startHour.toFormat('h a') : ''

    // Scale values based on whether it's the current hour
    const isCurrentHour = startHour.hour === currentHour

    // Get raw values
    const creating = Math.round((timeBlock.tags['creating']?.duration || 0))
    const consuming = Math.round((timeBlock.tags['consuming']?.duration || 0))
    const neutral = Math.round((timeBlock.tags['neutral']?.duration || 0))
    const offline = isCurrentHour 
      ? Math.max(0, currentMinute - (creating + consuming + neutral))
      : Math.max(0, 60 - (creating + consuming + neutral))

    return {
      time,
      timeRange,
      xAxisLabel,
      creating,
      consuming,
      neutral,
      offline
    }
  })

  return graphableTimeByHourBlocks
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
    console.log('appsUsed', appsUsed)
    for (const app of activityState.apps_json ) {
      if (!appsWithTime[app.id]) {
        appsWithTime[app.id] = {
          ...app,
          duration: 0,
          category_tag: app.tags.find(tag => tag.tag_type === 'category'),
          default_tag: app.tags.find(tag => tag.tag_type === 'default'),
          icon: '',
          rating: getRatingFromTag(app.tags.find(tag => tag.tag_type === 'default')),
        }
      }
      console.log('app.id', app.id)
      console.log('time', 0.5 / appsUsed)
      appsWithTime[app.id].duration += 0.5 / appsUsed
    }
  }

  const sortedApps = Object.values(appsWithTime).sort((a, b) => b.duration - a.duration)
  return sortedApps
}


export const MonitorApi = {
  getTagsByType,
  getTimeCreatingByHour,
  getTopAppsByPeriod,
  setAppDefaultTag,
}
