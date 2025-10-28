import { useEffect } from 'react'
import { useLicenseWithDevices } from '@/api/hooks/useLicense'
import { useAuth } from '@/hooks/useAuth'
import { NotificationApi } from '@/api/ebbApi/notificationApi'
import { toSqlBool } from '@/lib/utils/sql.util'
import { useCreateNotification, useGetNotificationBySentId } from '@/api/hooks/useNotifications'

/**
 * Hook that automatically creates license expiration notifications
 * - Shows notification 3 days before expiration
 * - Shows notification when license has expired
 * - Different messages for trial vs paid licenses
 * - Prevents duplicate notifications by checking sentId
 */
export const useLicenseExpirationNotification = () => {
  const { user } = useAuth()
  const { data: licenseData, isLoading: isLicenseLoading } = useLicenseWithDevices(user?.id || null)
  const createNotification = useCreateNotification()

  const notificationConfig = licenseData?.license
    ? NotificationApi.getLicenseExpirationNotification(licenseData.license)
    : null

  const { data: existingNotification, isLoading: isNotificationLoading } = useGetNotificationBySentId(
    notificationConfig?.sentId
  )

  useEffect(() => {
    if (isLicenseLoading || isNotificationLoading) return
    if (!notificationConfig) return
    if (existingNotification) return

    // Create notification
    createNotification.mutate({
      content: notificationConfig.content,
      notification_sub_type: notificationConfig.subType,
      notification_sent_id: notificationConfig.sentId,
      read: toSqlBool(false),
      dismissed: toSqlBool(false),
      notification_type: 'app',
    })
  }, [isLicenseLoading, isNotificationLoading, notificationConfig?.sentId, existingNotification])
}
