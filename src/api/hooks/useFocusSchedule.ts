import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FocusScheduleApi , RecurrenceSettings } from '../ebbApi/focusScheduleApi'
import { logAndToastError } from '@/lib/utils/ebbError.util'

export const useFocusSchedules = () => {
  return useQuery({
    queryKey: ['focusSchedules'],
    queryFn: () => FocusScheduleApi.getFocusSchedules(),
  })
}

export const useFocusSchedulesWithWorkflow = () => {
  return useQuery({
    queryKey: ['focusSchedulesWithWorkflow'],
    queryFn: () => FocusScheduleApi.getFocusSchedulesWithWorkflow(),
  })
}

export const useFocusScheduleById = (id: string) => {
  return useQuery({
    queryKey: ['focusSchedule', id],
    queryFn: () => FocusScheduleApi.getFocusScheduleById(id),
    enabled: !!id,
  })
}

export const useCreateFocusSchedule = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({
      workflowId,
      scheduledTime,
      recurrence,
      label,
    }: {
      workflowId: string
      scheduledTime: Date
      recurrence: RecurrenceSettings
      label?: string
    }) => {
      return FocusScheduleApi.createFocusSchedule(workflowId, scheduledTime, recurrence, label)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['focusSchedules'] })
      queryClient.invalidateQueries({ queryKey: ['focusSchedulesWithWorkflow'] })
    },
    onError: (error) => {
      logAndToastError('Failed to create focus schedule', error)
    },
  })
}

export const useUpdateFocusSchedule = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string
      updates: Partial<{
        workflowId: string
        scheduledTime: Date
        recurrence: RecurrenceSettings
        label?: string
      }>
    }) => {
      return FocusScheduleApi.updateFocusSchedule(id, updates)
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['focusSchedules'] })
      queryClient.invalidateQueries({ queryKey: ['focusSchedulesWithWorkflow'] })
      queryClient.invalidateQueries({ queryKey: ['focusSchedule', id] })
    },
    onError: (error) => {
      logAndToastError('Failed to update focus schedule', error)
    },
  })
}

export const useDeleteFocusSchedule = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => {
      return FocusScheduleApi.deleteFocusSchedule(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['focusSchedules'] })
      queryClient.invalidateQueries({ queryKey: ['focusSchedulesWithWorkflow'] })
    },
    onError: (error) => {
      logAndToastError('Failed to delete focus schedule', error)
    },
  })
}
