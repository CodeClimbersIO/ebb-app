import { DateTime } from 'luxon'
import { Tag, TagRepo, TagType } from '../../db/monitor/tagRepo'
import { ActivityState, ActivityStateRepo } from '../../db/monitor/activityStateRepo'


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


export const getTagsByType = async (type: TagType): Promise<Tag[]> => {
  const tags = await TagRepo.getTagsByType(type)
  return tags
}

export const getActivityStatesByTagsAndTimePeriod = async (tagIds: string[], start: DateTime, end: DateTime) => {
    const activityStates = await ActivityStateRepo.getActivityStatesByTagsAndTimePeriod(tagIds, start, end)
  return activityStates
}


const mockHourlyData = (): GraphableTimeByHourBlock[] => {
  const data = []
  const currentHour = DateTime.now().hour

  // Always show structure from 6 AM to midnight
  for (let hour = 6; hour < 24; hour++) {
    const time = `${hour}:00`
    const displayTime = DateTime.now().set({ hour, minute: 0 }).toFormat('h:mm a')
    const nextHour = DateTime.now().set({ hour: hour + 1, minute: 0 }).toFormat('h:mm a')
    const timeRange = `${displayTime} - ${nextHour}`

    const showLabel = [6, 10, 14, 18, 22].includes(hour)
    const xAxisLabel = showLabel ? DateTime.now().set({ hour }).toFormat('h a') : ''

    // Only generate data for hours up to current hour
    let creating = 0
    let consuming = 0
    let offline = 0

    if (hour <= currentHour) {
      creating = Math.floor(Math.random() * 40)
      consuming = Math.floor(Math.random() * (60 - creating))
      offline = 60 - creating - consuming
    }

    data.push({
      time,
      timeRange,
      xAxisLabel,
      creating,
      consuming,
      offline,
    })
  }
  return data
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
  const activityStates: ActivityState[] = activityStatesDB.map(state => ({
    ...state,
    tags_json: state.tags ? JSON.parse(state.tags) : []
  }))
  const timeBlocks = createTimeBlockFromActivityState(activityStates)
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
    const offline = 60 - creating - consuming
    return {
      time,
      timeRange,
      xAxisLabel,
      creating,
      consuming,
      offline,
    }
  })
  console.log(graphableTimeByHourBlocks)
  const mockData = mockHourlyData()
  console.log(mockData)
  return graphableTimeByHourBlocks.slice(6) // only show 6 AM to midnight
  // return mockData
}


export const MonitorApi = {
  getTimeCreatingByHour,
}
