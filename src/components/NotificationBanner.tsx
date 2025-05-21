import * as React from 'react'
import { useGetActiveNotification, useUpdateNotificationStatus } from '@/hooks/useNotifications'
import { useEffect } from 'react'

export const NotificationBanner: React.FC = () => {
  const { data: activeNotification } = useGetActiveNotification()
  const { mutate: markAsRead } = useUpdateNotificationStatus()
  const { mutate: dismiss } = useUpdateNotificationStatus()

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
      <button 
        className="ml-4 p-1 rounded hover:bg-primary/80 transition-colors" 
        aria-label="Close notification"
        onClick={() => activeNotification.id && dismiss({ id: activeNotification.id, options: { dismissed: true } })}
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6 6L14 14M14 6L6 14" stroke="white" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </button>
    </div>
  )
} 
