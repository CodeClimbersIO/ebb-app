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

export const useUpdateRollupForUser = () => {
  const { mutate: updateActivity } = useUpdateActivity()
  const updateRollupForUser = async () => {
    const timeBlocksToday = await MonitorApi.getTimeCreatingByDay(DateTime.now().startOf('day'), DateTime.now().endOf('day'))
            
    const totalCreatingTimeToday = timeBlocksToday.reduce((acc, block) => acc + block.creating, 0)
    
    if (totalCreatingTimeToday > 0) {
      const todayDate = DateTime.now().toFormat('yyyy-MM-dd')
      updateActivity({
        tag_name: 'creating',
        duration_minutes: totalCreatingTimeToday,
        date: todayDate
      })
    }
  }

  return {
    updateRollupForUser
  }
}
