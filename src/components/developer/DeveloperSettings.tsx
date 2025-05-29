import { isDev } from '../../lib/utils/environment.util'
import { ResetAppData } from './ResetAppData'
import NotificationManager from '../../lib/notificationManager'
import { Button } from '../ui/button'
const notificationManager = NotificationManager.getInstance()
export function DeveloperSettings() {
  const handleTestNotification = (type: 'session-start' | 'session-end' | 'session-warning' | 'blocked-app', difficulty: 'easy' | 'medium' | 'hard') => {
    notificationManager.show({
      type,
      difficulty
    })
    notificationManager.show({
      type,
      difficulty
    })
    notificationManager.show({
      type,
      difficulty
    })
  }
  return (
    isDev() && (
      <div className="mt-12 border-t pt-6">
        <h2 className="text-xl font-semibold mb-4">Developer Options</h2>
        <ResetAppData />
        <div className="border rounded-md p-4 mb-6">
          <h3 className="text-lg font-medium  mb-2">Test Notifications</h3>
          <div className="flex space-x-4 flex-wrap">
            <Button onClick={() => handleTestNotification('session-start', 'easy')}>
            Test Session Start
            </Button>
            <Button onClick={() => handleTestNotification('session-end', 'easy')}>
            Test Session End
            </Button>
            <Button onClick={() => handleTestNotification('session-warning', 'easy')}>
            Test Session Warning
            </Button>
            <Button onClick={() => handleTestNotification('blocked-app', 'easy')}>
            Test Blocked App
            </Button>
          </div>
        </div>
        
      </div>
    )
  )
}
