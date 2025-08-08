import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { NotificationApi, CreateNotificationSchema } from '@/api/ebbApi/notificationApi'
import { logAndToastError } from '@/lib/utils/ebbError.util'

const notificationKeys = {
  all: ['notifications'] as const,
  active: () => [...notificationKeys.all, 'active'] as const,
  bySentId: (sentId: string) => [...notificationKeys.all, 'bySentId', sentId] as const,
}

const fetchActiveNotifications = async () => {
  const notification = await NotificationApi.getLatestActiveNotifications()
  return notification
}

const getNotificationBySentId = async (sentId: string) => {
  return NotificationApi.getNotificationBySentId(sentId)
}

export function useGetActiveNotification() {
  return useQuery({
    queryKey: notificationKeys.active(),
    queryFn: fetchActiveNotifications,
  })
}

export function useGetNotificationBySentId(sentId?: string) {
  return useQuery({
    queryKey: notificationKeys.bySentId(sentId || ''),
    queryFn: () => getNotificationBySentId(sentId || ''),
    enabled: !!sentId,
  })
}

export function useCreateNotification() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (notification: CreateNotificationSchema) => 
      NotificationApi.createAppNotification(notification),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all })
    },
    onError: (error) => {
      console.error('Failed to create notification', error)
      logAndToastError('Failed to create notification', error)
    },
  })
}

export function useUpdateNotificationStatus() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, options }: { id: string; options: { read?: boolean; dismissed?: boolean } }) =>
      NotificationApi.updateAppNotificationStatus(id, options),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all })
    },
    onError: (error) => {
      console.error(error)
      logAndToastError('Failed to update notification status', error)
    },
  })
} 
