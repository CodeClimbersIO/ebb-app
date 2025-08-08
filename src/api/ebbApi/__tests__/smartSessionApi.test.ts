import { hasSmartSessionCooldown, SmartSessionApi } from '../smartSessionApi'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { DateTime } from 'luxon'
import { MonitorApi } from '../../monitorApi/monitorApi'
import { ActivityState } from '../../../db/monitor/activityStateRepo'

// Mock global localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
}

// Set up global localStorage mock
Object.defineProperty(global, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
})

// Mock the MonitorApi
vi.mock('../../monitorApi/monitorApi', () => {
  return {
    MonitorApi: {
      getActivityStatesByTimePeriod: vi.fn(),
    }
  }
})

const now = DateTime.now()
const start = now.minus({ minutes: 10 })
const end = now

// Mock a recent session from 30 minutes ago
const mockSession = {
  id: 'test-session',
  start: start.toISO(),
  end: end.toISO(),
  objective: 'Test objective',
  type: 'manual' as const
}

describe('SmartSessionApi', () => {
  const mockActivityStates = [
    {
      id: 15650,
      state: 'ACTIVE' as const,
      app_switches: 0,
      start_time: now.minus({ minutes: 60 }).toISO(),
      end_time: now.minus({ minutes: 30 }).toISO(),
      created_at: now.minus({ minutes: 60 }).toFormat('yyyy-MM-dd HH:mm:ss'),
      tags_json: [
        {
          tag_id: '5ba10e13-d342-4262-a391-9b9aa95332cd',
          name: 'creating'
        }
      ]
    } as ActivityState,
    
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    // Set up the default mock behavior
    vi.mocked(MonitorApi.getActivityStatesByTimePeriod).mockResolvedValue(mockActivityStates)
  })

  describe('hasSmartSessionCooldown', () => {
    it('should return undefined when no recent session and no cooldown', async () => {
      // Mock no stored lastSessionCheck
      mockLocalStorage.getItem.mockReturnValue(null)

      const result = await hasSmartSessionCooldown()
      expect(result).toBeFalsy()
    })

    it('should return undefined when cooldown conditions are not met', async () => {
      // Mock stored lastSessionCheck from 20 minutes ago
      const twentyMinutesAgo = now.minus({ minutes: 20 }).toISO()
      mockLocalStorage.getItem.mockReturnValue(twentyMinutesAgo)

      const result = await hasSmartSessionCooldown(mockSession)
      expect(result).toBeFalsy()
    })
    
    it('should handle no local storage item', async () => {
      mockLocalStorage.getItem.mockReturnValue(null)
      const result = await hasSmartSessionCooldown(mockSession)
      expect(result).toBeFalsy()
    })
    
    it('should return true when cooldown conditions are met', async () => {
      // Mock stored lastSessionCheck from 20 minutes ago
      const thirtyFiveMinutesAgo = now.minus({ minutes: 35 }).toISO()
      mockLocalStorage.getItem.mockReturnValue(thirtyFiveMinutesAgo)
      const mockOldSession = {
        id: 'test-session',
        start: now.minus({ minutes: 120 }).toISO(),
        end: now.minus({ minutes: 90 }).toISO(),
        objective: 'Test objective',
        type: 'manual' as const
      }

      const result = await hasSmartSessionCooldown(mockOldSession)
      expect(result).toBe(true)
    })
    
    it('should return undefined when cooldown conditions are met but last session check is set', async () => {
      const thirtyFiveMinutesAgo = now.minus({ minutes: 25 }).toISO()
      mockLocalStorage.getItem.mockReturnValue(thirtyFiveMinutesAgo)
      const result = await hasSmartSessionCooldown(mockSession)
      expect(result).toBeFalsy()
    })
    
    it('should return true when cooldown conditions are met and last session check is not set', async () => {
      mockLocalStorage.getItem.mockReturnValue(null)
      const mockOldSession = {
        id: 'test-session',
        start: now.minus({ minutes: 120 }).toISO(),
        end: now.minus({ minutes: 90 }).toISO(),
        objective: 'Test objective',
        type: 'manual' as const
      }
      const result = await hasSmartSessionCooldown(mockOldSession)
      expect(result).toBe(true)
    })
  })

  describe('isCreatingFromTimePeriod', () => {
    it('should return true when creating tags are 75% of all tags', async () => {
      // Mock activity states where 3 out of 4 tags are "creating" (75%)
      // Make sure activity states cover the full 10 minute duration
      const mockActivityStatesFor75Percent = [
        {
          id: 15650,
          state: 'ACTIVE' as const,
          app_switches: 0,
          start_time: start.toISO(),
          end_time: end.toISO(), // Full 10 minutes of activity
          created_at: start.toFormat('yyyy-MM-dd HH:mm:ss'),
          tags_json: [
            { tag_id: '1', name: 'creating' },
            { tag_id: '2', name: 'creating' },
            { tag_id: '3', name: 'creating' },
            { tag_id: '4', name: 'consuming' }
          ]
        }
      ] as ActivityState[]

      vi.mocked(MonitorApi.getActivityStatesByTimePeriod).mockResolvedValue(mockActivityStatesFor75Percent)

      const result = await SmartSessionApi.isCreatingFromTimePeriod(start, end)
      expect(result).toBe(true)
    })

    it('should return false when creating tags are less than 75% of all tags', async () => {
      // Mock activity states where only 2 out of 4 tags are "creating" (50%)
      // Make sure activity states cover the full 10 minute duration
      const mockActivityStatesFor50Percent = [
        {
          id: 15651,
          state: 'ACTIVE' as const,
          app_switches: 0,
          start_time: start.toISO(),
          end_time: end.toISO(), // Full 10 minutes of activity
          created_at: start.toFormat('yyyy-MM-dd HH:mm:ss'),
          tags_json: [
            { tag_id: '1', name: 'creating' },
            { tag_id: '2', name: 'creating' },
            { tag_id: '3', name: 'consuming' },
            { tag_id: '4', name: 'consuming' }
          ]
        }
      ] as ActivityState[]

      vi.mocked(MonitorApi.getActivityStatesByTimePeriod).mockResolvedValue(mockActivityStatesFor50Percent)

      const result = await SmartSessionApi.isCreatingFromTimePeriod(start, end)
      expect(result).toBe(false)
    })

    it('should return false when activity states duration is less than the time period', async () => {
      // Mock activity states that only cover 5 minutes when the time period is 10 minutes
      const mockActivityStatesShortDuration = [
        {
          id: 15652,
          state: 'ACTIVE' as const,
          app_switches: 0,
          start_time: now.minus({ minutes: 8 }).toISO(),
          end_time: now.minus({ minutes: 3 }).toISO(), // Only 5 minutes of activity
          created_at: now.minus({ minutes: 8 }).toFormat('yyyy-MM-dd HH:mm:ss'),
          tags_json: [
            { tag_id: '1', name: 'creating' },
            { tag_id: '2', name: 'creating' },
            { tag_id: '3', name: 'creating' },
            { tag_id: '4', name: 'creating' }
          ]
        }
      ] as ActivityState[]

      vi.mocked(MonitorApi.getActivityStatesByTimePeriod).mockResolvedValue(mockActivityStatesShortDuration)

      const result = await SmartSessionApi.isCreatingFromTimePeriod(start, end)
      expect(result).toBe(false)
    })

    it('should return true when both conditions are met: 75% creating tags and sufficient duration', async () => {
      // Mock activity states with 75% creating tags AND full duration coverage
      const mockActivityStatesBothConditions = [
        {
          id: 15653,
          state: 'ACTIVE' as const,
          app_switches: 0,
          start_time: start.toISO(),
          end_time: end.toISO(), // Full 10 minutes of activity
          created_at: start.toFormat('yyyy-MM-dd HH:mm:ss'),
          tags_json: [
            { tag_id: '1', name: 'creating' },
            { tag_id: '2', name: 'creating' },
            { tag_id: '3', name: 'creating' },
            { tag_id: '4', name: 'consuming' }
          ]
        }
      ] as ActivityState[]

      vi.mocked(MonitorApi.getActivityStatesByTimePeriod).mockResolvedValue(mockActivityStatesBothConditions)

      const result = await SmartSessionApi.isCreatingFromTimePeriod(start, end)
      expect(result).toBe(true)
    })
  })

  describe('doomscrollDetectionForTimePeriod', () => {
    it('should return true when consuming tags are 75% of all tags', async () => {
      // Mock activity states where 3 out of 4 tags are "consuming" (75%)
      const mockActivityStatesFor75PercentConsuming = [
        {
          id: 15654,
          state: 'ACTIVE' as const,
          app_switches: 0,
          start_time: start.toISO(),
          end_time: end.toISO(),
          created_at: start.toFormat('yyyy-MM-dd HH:mm:ss'),
          tags_json: [
            { tag_id: '1', name: 'consuming' },
            { tag_id: '2', name: 'consuming' },
            { tag_id: '3', name: 'consuming' },
            { tag_id: '4', name: 'creating' }
          ]
        }
      ] as ActivityState[]

      vi.mocked(MonitorApi.getActivityStatesByTimePeriod).mockResolvedValue(mockActivityStatesFor75PercentConsuming)

      const result = await SmartSessionApi.doomscrollDetectionForTimePeriod(start, end)
      expect(result).toBe(true)
    })

    it('should return false when consuming tags are less than 75% of all tags', async () => {
      // Mock activity states where only 2 out of 4 tags are "consuming" (50%)
      const mockActivityStatesFor50PercentConsuming = [
        {
          id: 15655,
          state: 'ACTIVE' as const,
          app_switches: 0,
          start_time: start.toISO(),
          end_time: end.toISO(),
          created_at: start.toFormat('yyyy-MM-dd HH:mm:ss'),
          tags_json: [
            { tag_id: '1', name: 'consuming' },
            { tag_id: '2', name: 'consuming' },
            { tag_id: '3', name: 'creating' },
            { tag_id: '4', name: 'creating' }
          ]
        }
      ] as ActivityState[]

      vi.mocked(MonitorApi.getActivityStatesByTimePeriod).mockResolvedValue(mockActivityStatesFor50PercentConsuming)

      const result = await SmartSessionApi.doomscrollDetectionForTimePeriod(start, end)
      expect(result).toBe(false)
    })

    it('should return true when exactly 75% of tags are consuming', async () => {
      // Mock activity states where exactly 3 out of 4 tags are "consuming" (exactly 75%)
      const mockActivityStatesForExact75Percent = [
        {
          id: 15656,
          state: 'ACTIVE' as const,
          app_switches: 0,
          start_time: start.toISO(),
          end_time: end.toISO(),
          created_at: start.toFormat('yyyy-MM-dd HH:mm:ss'),
          tags_json: [
            { tag_id: '1', name: 'consuming' },
            { tag_id: '2', name: 'consuming' },
            { tag_id: '3', name: 'consuming' },
            { tag_id: '4', name: 'neutral' }
          ]
        }
      ] as ActivityState[]

      vi.mocked(MonitorApi.getActivityStatesByTimePeriod).mockResolvedValue(mockActivityStatesForExact75Percent)

      const result = await SmartSessionApi.doomscrollDetectionForTimePeriod(start, end)
      expect(result).toBe(true)
    })

    it('should return false when no tags are present', async () => {
      // Mock activity states with no tags
      const mockActivityStatesNoTags = [
        {
          id: 15657,
          state: 'ACTIVE' as const,
          app_switches: 0,
          start_time: start.toISO(),
          end_time: end.toISO(),
          created_at: start.toFormat('yyyy-MM-dd HH:mm:ss'),
          tags_json: []
        }
      ] as ActivityState[]

      vi.mocked(MonitorApi.getActivityStatesByTimePeriod).mockResolvedValue(mockActivityStatesNoTags)

      const result = await SmartSessionApi.doomscrollDetectionForTimePeriod(start, end)
      expect(result).toBe(false)
    })
  })
})
