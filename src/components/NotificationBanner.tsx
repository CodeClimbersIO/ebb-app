import * as React from 'react'
import { useNotifications } from '@/hooks/useNotifications'
import { useEffect } from 'react'

export const NotificationBanner: React.FC = () => {
  const { activeNotification, markAsRead, dismiss } = useNotifications()

  useEffect(() => {
    if (activeNotification?.id) {
      markAsRead(activeNotification.id)
    }
  }, [activeNotification?.id, markAsRead])


  if (!activeNotification) {
    return null
  }

  return (
    <div className="w-full bg-indigo-600 text-white flex items-center justify-between px-4 py-2 shadow-md">
      <span className="font-medium">{activeNotification.notification_sent_id}</span>
      <button 
        className="ml-4 p-1 rounded hover:bg-indigo-700 transition-colors" 
        aria-label="Close notification"
        onClick={() => activeNotification.id && dismiss(activeNotification.id)}
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6 6L14 14M14 6L6 14" stroke="white" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </button>
    </div>
  )
} 
