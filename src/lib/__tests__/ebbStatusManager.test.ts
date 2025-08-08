import { describe, it, vi, expect } from 'vitest'

import { calculateCurrentStatus } from '../ebbStatusManager'
import { FlowSessionApi } from '@/api/ebbApi/flowSessionApi'
import { MonitorApi } from '@/api/monitorApi/monitorApi'
import { ActivityType } from '../../db/monitor/activityRepo'
import { DateTime, Settings } from 'luxon'

Settings.defaultZone = 'UTC'

describe('ebbStatusManager', () => {
  describe('calculateCurrentStatus', () => {
    it('should return flowing if the user is in a flow session', async () => {
      vi.spyOn(FlowSessionApi, 'getInProgressFlowSession').mockResolvedValue({
        id: '1',
        objective: 'test',
        start: new Date().toISOString(),
        end: new Date().toISOString(),
        self_score: 1,
        type: 'manual',
      })
      const status = await calculateCurrentStatus()
      expect(status).toBe('flowing')
    })
    it('should return flowing instead of active even if the user has activity within the last 5 minutes', async () => {
      vi.spyOn(MonitorApi, 'getLatestActivity').mockResolvedValue({
        activity_type: ActivityType.Window,
        app_window_title: 'test',
        created_at: new Date().toISOString(),
        timestamp: new Date().toISOString(),
        bundle_id: 'test',
      })
      const status = await calculateCurrentStatus()
      expect(status).toBe('flowing')
    })
    it('should return active if the user has activity within the last 5 minutes and not in flow session', async () => {
      vi.spyOn(FlowSessionApi, 'getInProgressFlowSession').mockResolvedValue(undefined)
      vi.spyOn(MonitorApi, 'getLatestActivity').mockResolvedValue({
        activity_type: ActivityType.Window,
        app_window_title: 'test',
        created_at: new Date().toISOString(),
        timestamp: new Date().toISOString(),
        bundle_id: 'test',
      })
      const status = await calculateCurrentStatus()
      expect(status).toBe('active')
    })

    it('should return online if not in session and no activity or activity is older than 5 minutes', async () => {
      vi.spyOn(FlowSessionApi, 'getInProgressFlowSession').mockResolvedValue(undefined)
      vi.spyOn(MonitorApi, 'getLatestActivity').mockResolvedValue({
        activity_type: ActivityType.Window,
        app_window_title: 'test',
        created_at: DateTime.now().minus({ minutes: 6 }).toISO(),
        timestamp: DateTime.now().minus({ minutes: 6 }).toISO(),
        bundle_id: 'test',
      })
      const status = await calculateCurrentStatus()
      expect(status).toBe('online')
    })
  })
})
