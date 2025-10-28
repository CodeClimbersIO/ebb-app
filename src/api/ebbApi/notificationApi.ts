import { NotificationRepo, Notification, CreateNotificationSchema } from '@/db/ebb/notificationRepo'
import { License } from './licenseApi'
import { DateTime } from 'luxon'

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

type NotificationSentId = 'trial_expiring_3_days' | 'trial_expired' | 'paid_expiring_3_days' | 'paid_expired'

export interface LicenseExpirationNotificationConfig {
  sentId: NotificationSentId
  content: string
  subType: 'warning' | 'info'
}

/**
 * Determines which license expiration notification to show based on license data
 * @param license - The user's license
 * @param currentDate - The current date (for testing purposes)
 * @returns NotificationConfig if a notification should be shown, null otherwise
 */
const getLicenseExpirationNotification = (
  license: License,
  currentDate: DateTime = DateTime.now()
): LicenseExpirationNotificationConfig | null => {
  const expirationDate = DateTime.fromJSDate(license.expirationDate)
  const daysUntilExpiration = expirationDate.diff(currentDate, 'days').days

  // No notifications for perpetual licenses
  if (license.licenseType === 'perpetual') {
    return null
  }

  // License has expired
  if (daysUntilExpiration <= 0) {
    if (license.licenseType === 'free_trial') {
      return {
        sentId: 'trial_expired',
        content: 'Your free trial has ended. Upgrade to Ebb Pro to continue.',
        subType: 'warning',
      }
    } else if (license.licenseType === 'subscription') {
      return {
        sentId: 'paid_expired',
        content: 'Your subscription has expired. Renew to restore your pro features.',
        subType: 'warning',
      }
    }
  }

  // License expires in 3 days or less (but not yet expired)
  if (daysUntilExpiration <= 3 && daysUntilExpiration > 0) {
    if (license.licenseType === 'free_trial') {
      return {
        sentId: 'trial_expiring_3_days',
        content: 'Your free trial ends in less than 3 days on ' + expirationDate.toFormat('MMM d, yyyy') + '. Upgrade to keep your pro features.',
        subType: 'info',
      }
    } else if (license.licenseType === 'subscription') {
      return {
        sentId: 'paid_expiring_3_days',
        content: 'Your subscription expires in less than 3 days on ' + expirationDate.toFormat('MMM d, yyyy') + '. Renew to keep your access.',
        subType: 'info',
      }
    }
  }

  // No notification needed (more than 3 days until expiration)
  return null
}

export const NotificationApi = {
  getLatestActiveNotifications,
  createAppNotification,
  updateAppNotificationStatus,
  getNotificationBySentId,
  getLicenseExpirationNotification,
}

// Re-export types that components/hooks need
export type { CreateNotificationSchema } from '@/db/ebb/notificationRepo'
