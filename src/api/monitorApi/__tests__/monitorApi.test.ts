import { describe, it, expect, vi, beforeEach } from 'vitest'
import { DateTime, Settings } from 'luxon'

Settings.defaultZone = 'UTC'

// Mock before importing the module that uses it!
vi.mock('../../../db/monitor/tagRepo', () => ({
  TagRepo: {
    getTagsByType: vi.fn().mockResolvedValue([
      { id: '1', name: 'creating' },
      { id: '2', name: 'consuming' },
      { id: '3', name: 'neutral' },
    ]),
  },
}))
vi.mock('../../../db/monitor/activityStateRepo', () => ({
  ActivityStateRepo: {
    getActivityStatesByTagsAndTimePeriod: vi.fn(),
  },
}))

import { ActivityStateRepo } from '../../../db/monitor/activityStateRepo'
import { getTimeCreatingByHour, getTimeCreatingByDay, createTimeBlockFromActivityState } from '../monitorApi'
import { mockActivityStates } from './activityState.mock'

function makeActivityState({ start, end, tags }: { start: string, end: string, tags: { tag_id: string, name: string }[] }) {
  return {
    start_time: start,
    end_time: end,
    tags: JSON.stringify(tags),
    tags_json: tags,
  }
}

const mockActivityStatesByTagsAndTimePeriod = vi.fn()
ActivityStateRepo.getActivityStatesByTagsAndTimePeriod = mockActivityStatesByTagsAndTimePeriod 

describe('createTimeBlockFromActivityState', () => {
  it('should create time blocks from activity states', () => {
    const activityStates = mockActivityStates()
    const timeBlocks = createTimeBlockFromActivityState(activityStates)
    expect(timeBlocks).toHaveLength(24)
  })

  it('10 am should have the 4 tags, creating, consuming, creating, consuming with the correct duration', () => {
    const activityStates = mockActivityStates()
    const timeBlocks = createTimeBlockFromActivityState(activityStates)
    
    expect(Object.keys(timeBlocks[17].tags).length).toBe(4)
    expect(timeBlocks[17].tags['creating'].name).toBeDefined()
    expect(timeBlocks[17].tags['consuming'].name).toBeDefined()
    expect(timeBlocks[17].tags['neutral'].name).toBeDefined()
    expect(timeBlocks[17].tags['idle'].name).toBeDefined()
    expect(timeBlocks[17].tags['creating'].duration).toBeCloseTo(45, 1)
    expect(timeBlocks[17].tags['consuming'].duration).toBeCloseTo(3, 1)
    expect(timeBlocks[17].tags['neutral'].duration).toBeCloseTo(1, 1)
    expect(timeBlocks[17].tags['idle'].duration).toBeCloseTo(8, 1)
  })

  it('9 am should have no tags', () => {
    const activityStates = mockActivityStates()
    const timeBlocks = createTimeBlockFromActivityState(activityStates)
    expect(Object.keys(timeBlocks[9].tags).length).toBe(0)
  })
})

describe('Time Aggregation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('aggregates by hour and includes all 24 hours', async () => {
    const today = DateTime.local().startOf('day')
    const activityStates = [
      makeActivityState({
        start: today.set({ hour: 2, minute: 0 }).toISO(),
        end: today.set({ hour: 2, minute: 30 }).toISO(),
        tags: [{ tag_id: '1', name: 'creating' }],
      }),
    ]
    mockActivityStatesByTagsAndTimePeriod.mockResolvedValueOnce(activityStates)
    const result = await getTimeCreatingByHour(today, today.endOf('day'))
    expect(result.length).toBe(24)
    expect(result[2].creating).toBeGreaterThan(0)
    for (let i = 0; i < 24; i++) {
      if (i !== 2) {
        expect(result[i].creating).toBe(0)
        expect(result[i].consuming).toBe(0)
        expect(result[i].neutral).toBe(0)
        expect(result[i].idle).toBe(0)
      }
    }
  })

  it('aggregates by day and includes all days in range', async () => {
    const start = DateTime.local().startOf('week')
    const end = start.plus({ days: 6 })
    const activityStates = [
      makeActivityState({
        start: start.plus({ days: 1, hour: 10 }).toISO(),
        end: start.plus({ days: 1, hour: 11 }).toISO(),
        tags: [{ tag_id: '1', name: 'creating' }],
      }),
      makeActivityState({
        start: start.plus({ days: 3, hour: 15 }).toISO(),
        end: start.plus({ days: 3, hour: 16 }).toISO(),
        tags: [{ tag_id: '2', name: 'consuming' }],
      }),
    ]
    mockActivityStatesByTagsAndTimePeriod.mockResolvedValueOnce(activityStates)
    const result = await getTimeCreatingByDay(start, end)
    expect(result.length).toBe(7)
    expect(result[1].creating).toBeGreaterThan(0)
    expect(result[3].consuming).toBeGreaterThan(0)
    for (let i = 0; i < 7; i++) {
      if (i !== 1 && i !== 3) {
        expect(result[i].creating).toBe(0)
        expect(result[i].consuming).toBe(0)
        expect(result[i].neutral).toBe(0)
        expect(result[i].idle).toBe(0)
      }
    }
  })

  it('handles no activity (all zeros)', async () => {
    const today = DateTime.local().startOf('day')
    mockActivityStatesByTagsAndTimePeriod.mockResolvedValueOnce([])
    const result = await getTimeCreatingByHour(today, today.endOf('day'))
    expect(result.length).toBe(24)
    for (let i = 0; i < 24; i++) {
      expect(result[i].creating).toBe(0)
      expect(result[i].consuming).toBe(0)
      expect(result[i].neutral).toBe(0)
      expect(result[i].idle).toBe(0)
    }
  })

  it('handles multiple tags in one activity', async () => {
    const today = DateTime.local().startOf('day')
    const activityStates = [
      makeActivityState({
        start: today.set({ hour: 5 }).toISO(),
        end: today.set({ hour: 6 }).toISO(),
        tags: [
          { tag_id: '1', name: 'creating' },
          { tag_id: '2', name: 'consuming' },
        ],
      }),
    ]
    mockActivityStatesByTagsAndTimePeriod.mockResolvedValueOnce(activityStates)
    const result = await getTimeCreatingByHour(today, today.endOf('day'))
    expect(result[5].creating).toBeGreaterThan(0)
    expect(result[5].consuming).toBeGreaterThan(0)
  })

  it('does not skip empty days or hours (regression)', async () => {
    const start = DateTime.local().startOf('week')
    const end = start.plus({ days: 6 })
    const activityStates = [
      makeActivityState({
        start: start.plus({ days: 5, hour: 12 }).toISO(),
        end: start.plus({ days: 5, hour: 13 }).toISO(),
        tags: [{ tag_id: '1', name: 'creating' }],
      }),
    ]
    mockActivityStatesByTagsAndTimePeriod.mockResolvedValueOnce(activityStates)
    const result = await getTimeCreatingByDay(start, end)
    expect(result.length).toBe(7)
    for (let i = 0; i < 7; i++) {
      if (i !== 5) {
        expect(result[i].creating).toBe(0)
        expect(result[i].consuming).toBe(0)
        expect(result[i].neutral).toBe(0)
        expect(result[i].idle).toBe(0)
      }
    }
  })

  it('filters out noise: periods with less than 2 minutes idle and no other activity', async () => {
    const today = DateTime.local().startOf('day')
    const activityStates = [
      // Noise period: 1 minute idle, no other activity
      makeActivityState({
        start: today.set({ hour: 6, minute: 0 }).toISO(),
        end: today.set({ hour: 6, minute: 1 }).toISO(),
        tags: [{ tag_id: '4', name: 'idle' }],
      }),
      // Valid period: 3 minutes idle (above threshold)
      makeActivityState({
        start: today.set({ hour: 8, minute: 0 }).toISO(),
        end: today.set({ hour: 8, minute: 3 }).toISO(),
        tags: [{ tag_id: '4', name: 'idle' }],
      }),
      // Valid period: 1 minute idle but has other activity
      makeActivityState({
        start: today.set({ hour: 10, minute: 0 }).toISO(),
        end: today.set({ hour: 10, minute: 1 }).toISO(),
        tags: [{ tag_id: '4', name: 'idle' }],
      }),
      makeActivityState({
        start: today.set({ hour: 10, minute: 1 }).toISO(),
        end: today.set({ hour: 10, minute: 31 }).toISO(),
        tags: [{ tag_id: '1', name: 'creating' }],
      }),
    ]
    mockActivityStatesByTagsAndTimePeriod.mockResolvedValueOnce(activityStates)
    const result = await getTimeCreatingByHour(today, today.endOf('day'))
    
    // Hour 6: Should be filtered out as noise (1 min idle, no other activity)
    expect(result[6].idle).toBe(0)
    expect(result[6].creating).toBe(0)
    expect(result[6].consuming).toBe(0)
    expect(result[6].neutral).toBe(0)
    expect(result[6].offline).toBe(60) // Full hour offline
    
    // Hour 8: Should preserve 3 minutes idle (above threshold)
    expect(result[8].idle).toBe(0)
    expect(result[8].offline).toBe(60) // 60 - 3
    
    // Hour 10: Should preserve 1 minute idle because there's other activity
    expect(result[10].idle).toBe(1)
    expect(result[10].creating).toBe(30)
    expect(result[10].offline).toBe(29) // 60 - 1 - 30
  })
})
