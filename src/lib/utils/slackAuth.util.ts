import { slackApi } from '@/api/ebbApi/slackApi'
import { logAndToastError } from '@/lib/utils/ebbError.util'
import { getEnv, isDev } from '@/lib/utils/environment.util'
import { invoke } from '@tauri-apps/api/core'

export const initiateSlackOAuth = async () => {
  try {
    // Determine redirect type based on environment
    const redirectType = getEnv()
    
    const result = await slackApi.initiateOAuth(redirectType)
    if (result?.authUrl) {
      // Open Slack OAuth in external browser using the established pattern
      if (isDev()) {
        window.location.href = result.authUrl
      } else {
        await invoke('plugin:shell|open', { path: result.authUrl })
      }
    } else {
      throw new Error('Failed to get Slack auth URL')
    }
  } catch (error) {
    logAndToastError('Failed to initiate Slack connection', error)
    throw error
  }
}
