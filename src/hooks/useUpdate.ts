import { check } from '@tauri-apps/plugin-updater'
import { relaunch } from '@tauri-apps/plugin-process'
import { info } from '@tauri-apps/plugin-log'
import { FlowSessionApi } from '../api/ebbApi/flowSessionApi'
import { isDev } from '../lib/utils/environment'
import { logAndToastError } from '../lib/utils/logAndToastError'

let consecutiveErrorCount = 0

const checkForUpdate = async () => {
  try {
    const update = await check()
    consecutiveErrorCount = 0

    return update
  } catch (error) {
    consecutiveErrorCount++
    // Only log error after 5 consecutive failures
    if (consecutiveErrorCount >= 5) {
      if(error instanceof Error && error.message.includes('read-only filesystem error (os error 30)')) {
        logAndToastError('Failed to install update', 'Make sure your app has been installed to the applications folder. If you continue to have trouble, reach out to paul@ebb.cool')
      } else {
        logAndToastError('Failed to check for updates', 'Unknown error')
        throw error
      }
    }
    return null
  }
}
export const checkAndUpdate = async () => {
  const flowSession = await FlowSessionApi.getInProgressFlowSession()
  if (flowSession) return // don't update if flow is in progress
  const update = await checkForUpdate()
  if (update) {
    info(
      `found update ${update.version} from ${update.date} with notes ${update.body}`
    )
    let downloaded = 0
    let contentLength = 0
    await update.downloadAndInstall((event) => {
      switch (event.event) {
      case 'Started':
        contentLength = event.data.contentLength ?? 0
        info(`started downloading ${event.data.contentLength} bytes`)
        break
      case 'Progress':
        downloaded += event.data.chunkLength
        info(`downloaded ${downloaded} from ${contentLength}`)
        break
      case 'Finished':
        info('download finished')
        break
      }
    })

    info('update installed')
    await relaunch()
  }
}

export const useUpdate = () => {
  const beginCheckForUpdates = () => {
    if (isDev()) return
    
    checkAndUpdate()
    const interval = setInterval(checkAndUpdate, 60 * 1000)
    return () => clearInterval(interval)
  }
  return {
    beginCheckForUpdates,
  }
}
