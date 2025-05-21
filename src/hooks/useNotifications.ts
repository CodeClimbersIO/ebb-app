import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { NotificationApi } from '@/api/ebbApi/notificationApi'
import { logAndToastError } from '@/lib/utils/logAndToastError'

const notificationKeys = {
  all: ['notifications'] as const,
  active: () => [...notificationKeys.all, 'active'] as const,
}

const fetchActiveNotifications = async () => {
  return NotificationApi.getLatestActiveNotifications()
}

const updateNotificationStatus = async ({
  id,
  options,
}: {
  id: string
  options: { read?: boolean; dismissed?: boolean }
}) => {
  return NotificationApi.updateAppNotificationStatus(id, options)
}

export function useNotifications() {
  const queryClient = useQueryClient()

  const activeNotificationsQuery = useQuery({
    queryKey: notificationKeys.active(),
    queryFn: fetchActiveNotifications,
  })

  const updateStatusMutation = useMutation({
    mutationFn: updateNotificationStatus,
    onSuccess: () => {
      // Invalidate and refetch active notifications
      queryClient.invalidateQueries({ queryKey: notificationKeys.active() })
    },
    onError: (error) => {
      logAndToastError('Failed to update notification status', error)
    },
  })

  return {
    activeNotification: activeNotificationsQuery.data,
    isLoading: activeNotificationsQuery.isLoading,
    error: activeNotificationsQuery.error,
    markAsRead: (id: string) => updateStatusMutation.mutate({ id, options: { read: true } }),
    dismiss: (id: string) => updateStatusMutation.mutate({ id, options: { dismissed: true } }),
  }
} 
