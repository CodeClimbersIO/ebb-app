import { isDev } from '../../lib/utils/environment.util'
import { ResetAppData } from './ResetAppData'
// import NotificationManager from '../../lib/notificationManager'
import { Button } from '../ui/button'
import { invoke } from '@tauri-apps/api/core'
import { info } from '@tauri-apps/plugin-log'
import { useState } from 'react'
import { slackApi, SlackStatusResponse } from '../../api/ebbApi/slackApi'
// const notificationManager = NotificationManager.getInstance()
export function DeveloperSettings() {
  const [slackStatus, setSlackStatus] = useState<SlackStatusResponse['data'] | undefined>()
  const [loading, setLoading] = useState(false)

  const handleTestNotification = (type: 'smart-start-suggestion' |  'session-start' | 'session-end' | 'session-warning' | 'blocked-app', difficulty: 'easy' | 'medium' | 'hard') => {
    info(`show_notification ${difficulty} ${type}`)
    let payload = {}
    if(type === 'session-end') {
      payload = {
        title: 'Session Completed',
        description: 'You created for 51 minutes!',
      }
    }
    invoke('show_notification', { notificationType: type, payload: JSON.stringify(payload) })
  }

  const initiateSlackOAuth = async () => {
    setLoading(true)
    try {
      const result = await slackApi.initiateOAuth()
      console.log('OAuth result:', result)
      
      if (result?.authUrl) {
        window.location.href = result.authUrl
      } else {
        console.error('Failed to get Slack auth URL: No authUrl in response')
      }
    } catch (error) {
      console.error('Failed to initiate Slack OAuth:', error)
    } finally {
      setLoading(false)
    }
  }

  const getSlackStatus = async () => {
    setLoading(true)
    try {
      const result = await slackApi.getStatus()
      console.log('Full result:', result)
      setSlackStatus(result)
    } catch (error) {
      console.error('Failed to get Slack status:', error)
    } finally {
      setLoading(false)
    }
  }

  const disconnectSlack = async () => {
    if (!confirm('Disconnect Slack integration?')) return

    setLoading(true)
    try {
      const result = await slackApi.disconnect()
      
      if (result.success) {
        setSlackStatus(undefined)
        console.log('Slack disconnected successfully')
      }
    } catch (error) {
      console.error('Failed to disconnect Slack:', error)
    } finally {
      setLoading(false)
    }
  }

  const testFocusSession = async (action: 'start' | 'end') => {
    try {
      const sessionId = 'test-session-' + Date.now()
      let result
      
      if (action === 'start') {
        result = await slackApi.startFocusSession(25)
        console.log('Focus session started:', result)
      } else {
        result = await slackApi.endFocusSession(sessionId)
        console.log('Focus session ended:', result)
      }
    } catch (error) {
      console.error(`Failed to ${action} focus session:`, error)
    }
  }

  const testCustomStatus = async () => {
    try {
      const result = await slackApi.setCustomStatus(
        'Testing Ebb Integration', 
        ':test_tube:', 
        Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
      )
      console.log('Custom status set:', result)
    } catch (error) {
      console.error('Failed to set custom status:', error)
    }
  }

  const testClearStatus = async () => {
    try {
      const result = await slackApi.clearStatus()
      console.log('Status cleared:', result)
    } catch (error) {
      console.error('Failed to clear status:', error)
    }
  }

  const testDND = async (action: 'enable' | 'disable') => {
    try {
      const result = await slackApi.controlDND(action, action === 'enable' ? 30 : undefined)
      console.log(`DND ${action}d:`, result)
    } catch (error) {
      console.error(`Failed to ${action} DND:`, error)
    }
  }

  const testGetDND = async () => {
    try {
      const result = await slackApi.getDNDInfo()
      console.log('DND info:', result)
    } catch (error) {
      console.error('Failed to get DND info:', error)
    }
  }
  return (
    isDev() && (
      <div className="mt-12 border-t pt-6">
        <h2 className="text-xl font-semibold mb-4">Developer Options</h2>
        <ResetAppData />
        <div className="border rounded-md p-4 mb-6">
          <h3 className="text-lg font-medium  mb-2">Test Notifications</h3>
          <div className="flex space-x-4 flex-wrap gap-2">
            <Button onClick={() => handleTestNotification('session-start', 'easy')}>
            Test Session Start
            </Button>
            <Button onClick={() => handleTestNotification('smart-start-suggestion', 'easy')}> 
            Test Smart Session Start
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

        <div className="border rounded-md p-4 mb-6">
          <h3 className="text-lg font-medium mb-2">Test Slack Integration</h3>
          
          <div className="mb-4">
            <h4 className="text-md font-medium mb-2">Connection</h4>
            <div className="flex space-x-2 flex-wrap gap-2">
              <Button onClick={initiateSlackOAuth} disabled={loading}>
                {loading ? 'Loading...' : 'Test OAuth Flow'}
              </Button>
              <Button onClick={getSlackStatus} disabled={loading}>
                Check Status
              </Button>
              {slackStatus?.connected && (
                <Button onClick={disconnectSlack} disabled={loading} variant="destructive">
                  Disconnect
                </Button>
              )}
            </div>
          </div>

          {slackStatus?.connected && (
            <>
              <div className="mb-4">
                <h4 className="text-md font-medium mb-2">Focus Sessions</h4>
                <div className="flex space-x-2 flex-wrap gap-2">
                  <Button onClick={() => testFocusSession('start')} disabled={loading}>
                    Start Focus Session
                  </Button>
                  <Button onClick={() => testFocusSession('end')} disabled={loading}>
                    End Focus Session
                  </Button>
                </div>
              </div>

              <div className="mb-4">
                <h4 className="text-md font-medium mb-2">Status Control</h4>
                <div className="flex space-x-2 flex-wrap gap-2">
                  <Button onClick={testCustomStatus} disabled={loading}>
                    Set Test Status
                  </Button>
                  <Button onClick={testClearStatus} disabled={loading}>
                    Clear Status
                  </Button>
                </div>
              </div>

              <div className="mb-4">
                <h4 className="text-md font-medium mb-2">Do Not Disturb</h4>
                <div className="flex space-x-2 flex-wrap gap-2">
                  <Button onClick={() => testDND('enable')} disabled={loading}>
                    Enable DND (30min)
                  </Button>
                  <Button onClick={() => testDND('disable')} disabled={loading}>
                    Disable DND
                  </Button>
                  <Button onClick={testGetDND} disabled={loading}>
                    Get DND Info
                  </Button>
                </div>
              </div>
            </>
          )}

          {slackStatus && (
            <div className="mt-4 p-3 border rounded">
              <pre className="text-sm">{JSON.stringify(slackStatus, null, 2)}</pre>
            </div>
          )}
        </div>
        
      </div>
    )
  )
}
