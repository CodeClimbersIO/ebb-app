import { NotificationRepo, Notification, CreateNotificationSchema } from '@/db/ebb/notificationRepo'

const getLatestActiveNotifications = async (): Promise<Notification | null> => {
  const [notification] = await NotificationRepo.getAppNotifications({ dismissed: false })
  return notification || null
}

const createAppNotification = async (notification: CreateNotificationSchema) => {
  return NotificationRepo.createNotification({
    ...notification,
  })
}

const updateAppNotificationStatus = async (
  id: string,
  options: { read?: boolean; dismissed?: boolean }
): Promise<void> => {
  return NotificationRepo.updateNotificationStatus(id, options)
}

const getNotificationBySentId = async (sentId: string): Promise<Notification | null> => {
  const notifications = await NotificationRepo.getNotificationBySentId(sentId)
  const [notification] = notifications
  return notification || null
}

export const NotificationApi = {
  getLatestActiveNotifications,
  createAppNotification,
  updateAppNotificationStatus,
  getNotificationBySentId,
}

// Re-export types that components/hooks need
export type { CreateNotificationSchema } from '@/db/ebb/notificationRepo'
