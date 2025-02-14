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
const getTagIdByRating = (rating: ActivityRating, tags: Tag[]): Tag | undefined => {
  const tag = tags.find(tag => {
    if (rating > 3 && tag.name === 'creating') {
      return tag
    } else if (rating < 3 && tag.name === 'consuming') {
      return tag
    } else {
      return tag
    }
  })
  
  return tag
}

export const setAppDefaultTag = async (appTagId: string, rating: ActivityRating, tags: Tag[]) => {
  // convert value or rating to tag id
  const tag = getTagIdByRating(rating, tags)
  if (!tag) return
  await AppRepo.setAppDefaultTag(appTagId, tag.id)
}


// group activity states by hour and create time blocks. activity states are already sorted by time (ascending)
export const createTimeBlockFromActivityState = (activityStates: ActivityState[]): TimeBlock[] => {
  const hours = new Set<number>()
  // fill set with hours form 0 to 23
  for (let hour = 0; hour < 24; hour++) {
    hours.add(hour)
  }
  const timeBlocks: TimeBlock[] = []
  // for each hour, create a time block
  for (const hour of hours) {
    const timeBlock: TimeBlock = {
      startTime: `${hour}:00`,
      endTime: `${hour + 1}:00`,
      tags: {},
    }
    timeBlocks.push(timeBlock)
  }

  // for each activity state, add it to the time block
  for (const activityState of activityStates) {
    const startTime = DateTime.fromISO(activityState.start_time)
    // get hour of start time
    const startTimeHour = startTime.hour
    // get timeblock for that hour
    const timeBlock = timeBlocks[startTimeHour]
    // determine if tag exists in time block. If not, add it
    activityState.tags_json?.forEach(tag => {
      const existingTag = timeBlock.tags[tag.name]
      if (!existingTag) {
        timeBlock.tags[tag.name] = {
          tag_id: tag.tag_id,
          name: tag.name,
          duration: 0.5,
        }
      }
      // add duration to existing tag
      timeBlock.tags[tag.name].duration += 0.5
    })
  }

  return timeBlocks

}

export const getTimeCreatingByHour = async (start: DateTime, end: DateTime): Promise<GraphableTimeByHourBlock[]> => {
  const tags = await TagRepo.getTagsByType('default')
  const activityStatesDB = await getActivityStatesByTagsAndTimePeriod(tags.map(tag => tag.id), start, end)
  console.log('activityStatesDB', activityStatesDB)
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
    const creating = timeBlock.tags['creating']?.duration || 0
    const consuming = timeBlock.tags['consuming']?.duration || 0
    // const idle = timeBlock.tags['idle']?.duration || 0 // add back when we have something to show for idle data
    // const neutral = timeBlock.tags['neutral']?.duration || 0

    const isCurrentHour = startHour.hour === currentHour
    const totalHourTime = isCurrentHour ? currentMinute : 60
    const offline = totalHourTime - creating - consuming
    return {
      time,
      timeRange,
      xAxisLabel,
      creating,
      consuming,
      offline,
    }
  })
  return graphableTimeByHourBlocks // only show 6 AM to midnight
  // return mockData
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
          category_tag: app.tags.find(tag => tag.tag_type === 'category'),
          default_tag: app.tags.find(tag => tag.tag_type === 'default'),
          icon: '',
          rating: getRatingFromTag(app.tags.find(tag => tag.tag_type === 'default')),
        }
      }
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
