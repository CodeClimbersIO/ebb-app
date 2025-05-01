import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { FlowSession } from '@/db/ebb/flowSessionRepo'
import { DateTime, Duration } from 'luxon'
import { FlowSessionApi } from '../api/ebbApi/flowSessionApi'
import type { Difficulty } from '@/components/difficulty-selector/types'
import { Loader2 } from 'lucide-react'
import { invoke } from '@tauri-apps/api/core'
import NotificationManager from '@/lib/notificationManager'
import { listen } from '@tauri-apps/api/event'
import { useRustEvents } from '@/hooks/useRustEvents'
import { useFlowTimer } from '../lib/stores/flowTimer'
import { stopFlowTimer } from '../lib/tray'
import { DifficultyButton } from '@/components/DifficultyButton'
import { MusicPlayer } from '@/components/MusicPlayer'
import { logAndToastError } from '@/lib/utils/logAndToastError'

const getDurationFormatFromSeconds = (seconds: number) => {
  const duration = Duration.fromMillis(seconds * 1000)
  const format = duration.as('minutes') >= 60 ? 'hh:mm:ss' : 'mm:ss'
  return duration.toFormat(format)
}

const MAX_SESSION_DURATION = 8 * 60 * 60

const Timer = ({ flowSession }: { flowSession: FlowSession | null }) => {
  const [time, setTime] = useState<string>('00:00')
  const [isAddingTime, setIsAddingTime] = useState(false)
  const [cooldown, setCooldown] = useState(false)
  const [hasShownWarning, setHasShownWarning] = useState(false)

  const handleAddTime = async () => {
    if (!flowSession || !flowSession.duration || isAddingTime || cooldown) return

    try {
      setIsAddingTime(true)
      setCooldown(true)

      const additionalSeconds = 15 * 60
      const newTotalDurationInSeconds = flowSession.duration + additionalSeconds

      await FlowSessionApi.updateFlowSessionDuration(flowSession.id, newTotalDurationInSeconds)

      const newTotalDurationForStore = Duration.fromObject({ seconds: newTotalDurationInSeconds })
      useFlowTimer.getState().setTotalDuration(newTotalDurationForStore)

      setHasShownWarning(false)

      flowSession.duration = newTotalDurationInSeconds
    } catch (error) {
      logAndToastError(`Failed to extend session duration: ${error}`)
    } finally {
      setIsAddingTime(false)
      setTimeout(() => {
        setCooldown(false)
      }, 1000)
    }
  }

  useEffect(() => {
    if (!flowSession) return

    const updateTimer = () => {
      const now = DateTime.now()
      const nowAsSeconds = now.toSeconds()
      const startTime = DateTime.fromISO(flowSession.start).toSeconds()
      const diff = nowAsSeconds - startTime

      if (!flowSession.duration && diff >= MAX_SESSION_DURATION) {
        window.dispatchEvent(new CustomEvent('flowSessionComplete'))
        return
      }

      if (flowSession.duration) {
        const remaining = (flowSession.duration) - diff
        if (remaining <= 0) {
          window.dispatchEvent(new CustomEvent('flowSessionComplete'))
          return
        }

        if (remaining <= 60 && !hasShownWarning) {
          NotificationManager.getInstance().show({ type: 'session-warning' })
          setHasShownWarning(true)
        }

        const duration = getDurationFormatFromSeconds(remaining)
        setTime(duration)
      } else {
        const duration = getDurationFormatFromSeconds(diff)
        setTime(duration)
      }
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
  }, [flowSession, hasShownWarning])

  useEffect(() => {
    const setupListener = async () => {
      const unlisten = await listen<{ action: string, minutes: number }>('add-time-event', (event) => {
        if (event.payload.action === 'add-time') {
          handleAddTime()
        }
      })

      return unlisten
    }

    const unlistenPromise = setupListener()

    return () => {
      unlistenPromise.then(unlisten => unlisten())
    }
  }, [handleAddTime])

  return (
    <>
      <div className="text-sm text-muted-foreground mb-2">{flowSession?.objective}</div>
      <div className="text-6xl font-bold mb-2 font-mono tracking-tight">
        {time}
      </div>
      {flowSession?.duration && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleAddTime}
          className="mt-2"
          disabled={isAddingTime || cooldown}
        >
          {isAddingTime ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Adding time...
            </>
          ) : cooldown ? (
            'Adding...'
          ) : (
            'Add 15 min'
          )}
        </Button>
      )}
    </>
  )
}

export const FlowPage = () => {
  useRustEvents()
  const navigate = useNavigate()
  const [flowSession, setFlowSession] = useState<FlowSession | null>(null)
  const [isEndingSession, setIsEndingSession] = useState(false)
  const [difficulty, setDifficulty] = useState<Difficulty>()

  useEffect(() => {
    NotificationManager.getInstance().show({
      type: 'session-start'
    })
  }, [])

  const handleEndSession = useCallback(async (isAutoCompletion = false) => {
    if (isEndingSession && !isAutoCompletion) return

    setIsEndingSession(true)

    await invoke('stop_blocking')
    await stopFlowTimer()
    if (flowSession) {
      await FlowSessionApi.endFlowSession(flowSession.id)
    }

    navigate('/flow-recap', {
      state: {
        sessionId: flowSession?.id,
        startTime: flowSession?.start,
        endTime: new Date().toISOString(),
        timeInFlow: '00:00',
        idleTime: '0h 0m',
        objective: flowSession?.objective
      }
    })
  }, [flowSession, isEndingSession, navigate])

  useEffect(() => {
    const init = async () => {
      const session = await FlowSessionApi.getInProgressFlowSession()
      if (!session) {
        navigate('/start-flow')
        return
      }
      setFlowSession(session)
      const state = window.history.state?.usr
      setDifficulty(state?.difficulty || 'medium')
    }
    init()
  }, [navigate])

  useEffect(() => {
    const handleSessionComplete = async () => {
      await stopFlowTimer()
      handleEndSession(true)
    }
    window.addEventListener('flowSessionComplete', handleSessionComplete)

    return () => {
      window.removeEventListener('flowSessionComplete', handleSessionComplete)
    }
  }, [handleEndSession])

  const hasMusic = window.history.state?.usr?.hasMusic ?? true
  const initialPlaylistId = window.history.state?.usr?.selectedPlaylist

  return (
    <div className="flex flex-col h-screen">
      <div className="flex justify-end p-4">
        <DifficultyButton
          variant="destructive"
          onAction={() => handleEndSession(false)}
          isLoading={isEndingSession}
          loadingText="Ending..."
          actionText="End Early"
          difficulty={difficulty}
        />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center">
        <Timer flowSession={flowSession} />
      </div>

      {hasMusic && (
        <div className="p-8">
          <MusicPlayer initialPlaylistId={initialPlaylistId} />
        </div>
      )}
    </div>
  )
}
