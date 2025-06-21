import { useMutation, useQueryClient } from '@tanstack/react-query'
import { platformApiRequest } from '../platformRequest'
import { logAndToastError } from '@/lib/utils/ebbError.util'
import { DateTime } from 'luxon'
import { MonitorApi } from '../monitorApi/monitorApi'

// --- Backend types ---
export interface ActivityUpdate {
  tag_name: string
  duration_minutes: number
  date: string // YYYY-MM-DD format
}

export interface ActivityUpdateResponse {
  user_id: string
  date: string
  tag_name: string
  duration_minutes: number
}

const activityKeys = {
  all: ['activity'] as const,
  rollups: () => [...activityKeys.all, 'rollups'] as const,
}

const updateActivity = async (update: ActivityUpdate) => {
  const data = await platformApiRequest({
    url: '/api/rollup/update',
    method: 'POST',
    body: update,
  })
  return data as ActivityUpdateResponse
}

type ApiErrorType = {
  error?: string;
  message?: string;
  data?: {
    error?: string;
    message?: string;
  };
};

export function useUpdateActivity() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: updateActivity,
    onSuccess: () => {
      // Invalidate any activity-related queries when an update succeeds
      queryClient.invalidateQueries({ queryKey: activityKeys.all })
    },
    onError: (error: ApiErrorType) => {
      logAndToastError('Failed to update activity time', error)
    },
  })
}

const hasSyncedRollupFromStart = () => {
  const hasSynced = localStorage.getItem('hasSyncedRollupFromStart')
  return hasSynced === 'true'
}

const setHasSyncedRollupFromStart = () => {
  localStorage.setItem('hasSyncedRollupFromStart', 'true')
}

const syncRollup = async (updateActivity: (update: ActivityUpdate) => Promise<ActivityUpdateResponse>,date?: DateTime) => {

  const startDate = date ? date.toUTC().startOf('day') : DateTime.now().toUTC().startOf('day')
  const endDate = date ? date.toUTC().endOf('day') : DateTime.now().toUTC().endOf('day')
  const timeBlocksToday = await MonitorApi.getTimeCreatingByDay(startDate, endDate)
            
  const totalTimeCreating = timeBlocksToday.reduce((acc, block) => acc + block.creating, 0)
  if (totalTimeCreating > 0) {
    const syncDate = startDate.toUTC().toFormat('yyyy-MM-dd')
    updateActivity({
      tag_name: 'creating',
      duration_minutes: totalTimeCreating,
      date: syncDate
    })
  }
}

const syncRollupFromStart = async (updateActivity: (update: ActivityUpdate) => Promise<ActivityUpdateResponse>) => {
  for (let i = 0; i < 90; i++) {
    const date = DateTime.now().minus({ days: i })
    await syncRollup(updateActivity, date)
  }
  setHasSyncedRollupFromStart()
}

export const useUpdateRollupForUser = () => {
  
  const updateRollupForUser = async () => {
    if (!hasSyncedRollupFromStart()) {
      syncRollupFromStart(updateActivity)
    } else {
      syncRollup(updateActivity)
    }
  }

  return {
    updateRollupForUser
  }
}
