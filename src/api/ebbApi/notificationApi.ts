import { NotificationRepo, Notification, CreateNotificationSchema } from '@/db/ebb/notificationRepo'

const getLatestActiveNotifications = async (): Promise<Notification> => {
  const [notification] = await NotificationRepo.getAppNotifications({ dismissed: false, read: false })
  return notification
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

export const NotificationApi = {
  getLatestActiveNotifications,
  createAppNotification,
  updateAppNotificationStatus,
}
