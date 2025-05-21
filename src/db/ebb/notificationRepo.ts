import { toSqlBool, insert, update } from '../../lib/utils/sql.util'
import { getEbbDb } from './ebbDb'

export interface NotificationSchema {
  id: string
  user_id?: string
  notification_type: 'app'
  notification_sub_type: 'warning'
  notification_sent_id: string
  read: number
  dismissed: number
  notification_sent_at: string
  created_at: string
  updated_at: string
}

export type CreateNotificationSchema = Omit<NotificationSchema, 'id' | 'created_at' | 'updated_at' | 'notification_sent_at'>

export type Notification = NotificationSchema

const getAppNotifications = async (
  options: { dismissed?: boolean; read?: boolean } = {}
): Promise<Notification[]> => {
  const ebbDb = await getEbbDb()
  let query = 'SELECT * FROM user_notification WHERE notification_type = \'app\''
  const params: unknown[] = []
  const dismissedVal = toSqlBool(options.dismissed)
  if (dismissedVal !== undefined) {
    query += ' AND dismissed = ?'
    params.push(dismissedVal)
  }
  const readVal = toSqlBool(options.read)
  if (readVal !== undefined) {
    query += ' AND read = ?'
    params.push(readVal)
  }
  query += ' ORDER BY notification_sent_at DESC'
  return ebbDb.select<Notification[]>(query, params)
}

const createNotification = async (notification: CreateNotificationSchema): Promise<void> => {
  const ebbDb = await getEbbDb()
  const record = {
    ...notification,
    notification_type: 'app',
    read: notification.read ? 1 : 0,
    dismissed: notification.dismissed ? 1 : 0,
  }
  await insert(ebbDb, 'user_notification', record)
}

/**
 * Update the read and/or dismissed status of a notification by id.
 * At least one of read or dismissed must be provided.
 */
const updateNotificationStatus = async (
  id: string,
  options: { read?: boolean; dismissed?: boolean }
): Promise<void> => {
  if (options.read === undefined && options.dismissed === undefined) {
    throw new Error('At least one of read or dismissed must be provided')
  }
  const ebbDb = await getEbbDb()
  const record: Record<string, unknown> = {}
  record.read = toSqlBool(options.read)
  record.dismissed = toSqlBool(options.dismissed)
  await update(ebbDb, 'user_notification', record, id)
}

export const NotificationRepo = {
  getAppNotifications,
  createNotification,
  updateNotificationStatus,
}
