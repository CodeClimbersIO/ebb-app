import { describe, it, expect, vi } from 'vitest'
import { FlowPeriodApi } from '../flowPeriodApi'
import { ActivityState, ActivityStateDb, ActivityStateType } from '../../../db/activityState'
import { FlowPeriod, FlowPeriodDb } from '../../../db/flowPeriod'
import { DateTime } from 'luxon'
import { assertDateTimeEqual } from '../../../lib/utils/test.util'

describe('FlowPeriodApi', () => {
  describe('getActivityScoreForActivityStates', () => {
    it('should return [0, 0] for empty array', () => {
      const result = FlowPeriodApi.getActivityScoreForActivityStates([])
      expect(result).toEqual([0, 0])
    })

    it('should count only active states', () => {
      const states: ActivityState[] = [
        { state: ActivityStateType.Active, app_switches: 1 } as ActivityState,
        { state: ActivityStateType.Inactive, app_switches: 1 } as ActivityState,
        { state: ActivityStateType.Active, app_switches: 1 } as ActivityState,
      ]
      const result = FlowPeriodApi.getActivityScoreForActivityStates(states)
      expect(result).toEqual([0, 2])
    })

    it('counts 1 point for each minute after 2 minutes', () => {
      const states: ActivityState[] = [
        { state: ActivityStateType.Active, app_switches: 1 } as ActivityState,
        { state: ActivityStateType.Active, app_switches: 1 } as ActivityState,
        { state: ActivityStateType.Active, app_switches: 1 } as ActivityState,
        { state: ActivityStateType.Active, app_switches: 1 } as ActivityState,
        { state: ActivityStateType.Active, app_switches: 1 } as ActivityState,
        { state: ActivityStateType.Active, app_switches: 1 } as ActivityState,
      ]
      const result = FlowPeriodApi.getActivityScoreForActivityStates(states)
      expect(result).toEqual([1, 6])
    })

    it('should cap at 5', () => {
      const states: ActivityState[] = Array(20).fill(null).map(() => ({
        state: ActivityStateType.Active,
        app_switches: 1
      } as ActivityState))
      const result = FlowPeriodApi.getActivityScoreForActivityStates(states)
      expect(result).toEqual([5, 20])
    })


  })

  describe('getAppSwitchScoreForActivityStates', () => {
    it('should return [0, 0] for empty array', () => {
      const result = FlowPeriodApi.getAppSwitchScoreForActivityStates([])
      expect(result).toEqual([0, 0])
    })

    it('should return score 1.0 for average switches <= 4', () => {
      const states: ActivityState[] = [
        { state: ActivityStateType.Active, app_switches: 2 } as ActivityState,
        { state: ActivityStateType.Active, app_switches: 4 } as ActivityState,
      ]
      const result = FlowPeriodApi.getAppSwitchScoreForActivityStates(states)
      expect(result).toEqual([1.0, 6.0])
    })

    it('should return score 0.5 for average switches between 4 and 8', () => {
      const states: ActivityState[] = [
        { state: ActivityStateType.Active, app_switches: 4 } as ActivityState,
        { state: ActivityStateType.Active, app_switches: 8 } as ActivityState,
      ]
      const result = FlowPeriodApi.getAppSwitchScoreForActivityStates(states)
      expect(result).toEqual([0.5, 12.0])
    })

    it('should return score 0.0 for average switches > 8', () => {
      const states: ActivityState[] = [
        { state: ActivityStateType.Active, app_switches: 8 } as ActivityState,
        { state: ActivityStateType.Active, app_switches: 12 } as ActivityState,
      ]
      const result = FlowPeriodApi.getAppSwitchScoreForActivityStates(states)
      expect(result).toEqual([0.0, 20.0])
    })
  })

  describe('getFlowStreakScoreForPeriod', () => {
    it('should return 0 for empty array', () => {
      const [result] = FlowPeriodApi.getFlowStreakScoreForPeriod([])
      expect(result).toEqual(0)
    })

    it('should return 1 for array with one score > 5', () => {
      const [result] = FlowPeriodApi.getFlowStreakScoreForPeriod([{ score: 6 } as FlowPeriod])
      expect(result).toEqual(1)
    })

    it('should return 0 for array with one score <= 5', () => {
      const [result] = FlowPeriodApi.getFlowStreakScoreForPeriod([{ score: 4 } as FlowPeriod])
      expect(result).toEqual(0)
    })

    it('should return 2 for array with two scores > 5', () => {
      const [result] = FlowPeriodApi.getFlowStreakScoreForPeriod([{ score: 6 } as FlowPeriod, { score: 7 } as FlowPeriod])
      expect(result).toEqual(2)
    })

    it('should return 0 for array with one score <= 5', () => {
      const [result] = FlowPeriodApi.getFlowStreakScoreForPeriod([{ score: 4 } as FlowPeriod, { score: 7 } as FlowPeriod])
      expect(result).toEqual(0)
    })

    it('should return 3 for array with 3 scores > 5, one score <= 5, and one score > 5', () => {
      const [result] = FlowPeriodApi.getFlowStreakScoreForPeriod([{ score: 6 } as FlowPeriod, { score: 7 } as FlowPeriod, { score: 8 } as FlowPeriod, { score: 4 } as FlowPeriod, { score: 7 } as FlowPeriod, { score: 8 } as FlowPeriod])
      expect(result).toEqual(3)
    })

    it('should return 4 for array with 5 scores > 5', () => {
      const [result] = FlowPeriodApi.getFlowStreakScoreForPeriod([{ score: 6 } as FlowPeriod, { score: 7 } as FlowPeriod, { score: 8 } as FlowPeriod, { score: 9 } as FlowPeriod, { score: 10 } as FlowPeriod])
      expect(result).toEqual(4)
    })
  })

  describe('getNextActivityFlowPeriod', async () => {
    const INTERVAL_MS = 2 * 60 * 1000 // 2 minutes
    it('should start from last activity end time, if new end time would be within 5 seconds of now', async () => {
      const startTime = DateTime.now().minus({seconds: 242}) // 4 minutes 2 seconds ago
      const endTime = DateTime.now().minus({seconds: 121}) // 2 minutes 1 second ago
      const flowPeriod = {
        id: 1,
        start_time: startTime.toISO(),
        end_time: endTime.toISO(),
        score: 0,
        details: JSON.stringify({
          app_switches: 0,
          active_time: 0,
        }),
        created_at: DateTime.now().toISO(),
      } as FlowPeriod

      const result = await FlowPeriodApi.getNextFlowPeriod(flowPeriod, INTERVAL_MS)
      expect(() => assertDateTimeEqual(result.start, endTime)).not.toThrow()
      expect(() => assertDateTimeEqual(result.end, endTime.plus({milliseconds: INTERVAL_MS}))).not.toThrow()
    })

    it('should start from now minus the interval time (i.e 10 minutes ago), if the new end time would be outside of 5 seconds of now', async () => {
      const startTime = DateTime.now().minus({seconds: 250}) // 4 minutes 10 seconds ago
      const endTime = DateTime.now().minus({seconds: 131}) // 2 minutes 11 seconds ago
      const flowPeriod = {
        id: 1,
        start_time: startTime.toISO(),
        end_time: endTime.toISO(),
        score: 0,
        details: JSON.stringify({
          app_switches: 0,
          active_time: 0,
        }),
        created_at: DateTime.now().toISO(),
      } as FlowPeriod

      const result = await FlowPeriodApi.getNextFlowPeriod(flowPeriod, INTERVAL_MS)

      expect(() => assertDateTimeEqual(result.start, DateTime.now().minus({milliseconds: INTERVAL_MS}))).not.toThrow()
      expect(() => assertDateTimeEqual(result.end, DateTime.now())).not.toThrow()
    })

    it('should start from now minus the interval time (i.e 10 minutes ago), if there is no last activity', async () => {
      const result = await FlowPeriodApi.getNextFlowPeriod(undefined, INTERVAL_MS)
      expect(() => assertDateTimeEqual(result.start, DateTime.now().minus({milliseconds: INTERVAL_MS}), 10)).not.toThrow()
      expect(() => assertDateTimeEqual(result.end, DateTime.now(), 10)).not.toThrow()
    })
  })

  describe('getFlowPeriodScoreForPeriod', () => {
    it('should return flow score of 6 when there are full active states, no switching, and no flow streak', async () => {
      const mockActivityStates: ActivityState[] = Array(20).fill(null).map(() => ({
        state: ActivityStateType.Active,
        app_switches: 1
      } as ActivityState))

      const mockFlowPeriods: FlowPeriod[] = Array(5).fill(null).map(() => ({
        score: 3,
        details: JSON.stringify({
          app_switches: 0,
          active_time: 0,
        }),
        created_at: DateTime.now().toISO(),
      } as FlowPeriod))
      
      const getActivityStatesSpy = vi.spyOn(ActivityStateDb, 'getActivityStatesBetween')
        .mockResolvedValue(mockActivityStates)
      
      const getFlowPeriodsSpy = vi.spyOn(FlowPeriodDb, 'getFlowPeriodsBetween')
        .mockResolvedValue(mockFlowPeriods)

      const lastFlowPeriod = {
        start: DateTime.now().minus({seconds: 120}),
        end: DateTime.now(),
      }
      const sessionPeriod = {
        start: DateTime.now().minus({seconds: 120}),
        end: DateTime.now(),
      }
      const result = await FlowPeriodApi.getFlowPeriodScoreForPeriod(lastFlowPeriod, sessionPeriod)

      expect(getActivityStatesSpy).toHaveBeenCalled()
      expect(getFlowPeriodsSpy).toHaveBeenCalled()
      expect(result.activityScore.score).toEqual(5)
      expect(result.appSwitchScore.score).toEqual(1)
      expect(result.flowStreakScore.score).toEqual(0)
      expect(result.totalScore).toEqual(6)

      // Clean up
      vi.restoreAllMocks()
    })

    it('should return flow score of 10 when there are full active states, no switching, and a flow streak', async () => {
      const mockActivityStates: ActivityState[] = Array(20).fill(null).map(() => ({
        state: ActivityStateType.Active,
        app_switches: 1
      } as ActivityState))

      const mockFlowPeriods: FlowPeriod[] = Array(5).fill(null).map(() => ({
        score: 6,
        details: JSON.stringify({
          app_switches: 0,
          active_time: 0,
        }),
        created_at: DateTime.now().toISO(),
      } as FlowPeriod))
      
      const getActivityStatesSpy = vi.spyOn(ActivityStateDb, 'getActivityStatesBetween')
        .mockResolvedValue(mockActivityStates)
      
      const getFlowPeriodsSpy = vi.spyOn(FlowPeriodDb, 'getFlowPeriodsBetween')
          .mockResolvedValue(mockFlowPeriods)

      const lastFlowPeriod = {
        start: DateTime.now().minus({seconds: 120}),
        end: DateTime.now(),
      }
      const sessionPeriod = {
        start: DateTime.now().minus({seconds: 120}),
        end: DateTime.now(),
      }
      const result = await FlowPeriodApi.getFlowPeriodScoreForPeriod(lastFlowPeriod, sessionPeriod)

      expect(getActivityStatesSpy).toHaveBeenCalled()
      expect(getFlowPeriodsSpy).toHaveBeenCalled()
      expect(result.activityScore.score).toEqual(5)
      expect(result.appSwitchScore.score).toEqual(1)
      expect(result.flowStreakScore.score).toEqual(4)
      expect(result.totalScore).toEqual(10)

      // Clean up
      vi.restoreAllMocks()
    })
  })
}) 

