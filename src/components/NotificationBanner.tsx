import * as React from 'react'
import { useGetActiveNotification, useUpdateNotificationStatus } from '@/api/hooks/useNotifications'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'

interface NotificationAction {
  label: string
  action: () => void
}

export const NotificationBanner: React.FC = () => {
  const { data: activeNotification } = useGetActiveNotification()
  const { mutate: markAsRead } = useUpdateNotificationStatus()
  const { mutate: dismiss } = useUpdateNotificationStatus()
  const navigate = useNavigate()

  // Action mapping based on notification_sent_id
  const getNotificationAction = (notificationSentId: string | null | undefined): NotificationAction | null => {
    if (!notificationSentId) return null

    const actionMap: Record<string, NotificationAction> = {
      'focus_schedule_feature_intro': {
        label: 'Try It',
        action: () => {
          navigate('/focus-schedule')
          if (activeNotification?.id) {
            dismiss({ id: activeNotification.id, options: { dismissed: true } })
          }
        }
      }
    }

    return actionMap[notificationSentId] || null
  }

  const notificationAction = getNotificationAction(activeNotification?.notification_sent_id)

  useEffect(() => {
    if (activeNotification?.id && !activeNotification.read) {
      markAsRead({ id: activeNotification.id, options: { read: true } })
    }
  }, [activeNotification?.id, markAsRead])

  if (!activeNotification) {
    return null
  }

  return (
    <div className="w-full bg-primary text-white flex items-center justify-between px-4 py-2 shadow-md">
      <span className="font-medium">{activeNotification.content}</span>
      <div className="flex items-center gap-2">
        {notificationAction && (
          <Button
            variant="outline"
            size="sm"
            className="border-white/30 text-white hover:bg-white/10 hover:text-white"
            onClick={notificationAction.action}
          >
            {notificationAction.label}
          </Button>
        )}
        <button 
          className="p-1 rounded hover:bg-primary/80 transition-colors" 
          aria-label="Close notification"
          onClick={() => activeNotification.id && dismiss({ id: activeNotification.id, options: { dismissed: true } })}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 6L14 14M14 6L6 14" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
      </div>
    </div>
  )
} 
