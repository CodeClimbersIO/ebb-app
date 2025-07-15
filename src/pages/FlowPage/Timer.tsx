import { invoke } from '@tauri-apps/api/core'
import { Loader2 } from 'lucide-react'
import { Duration, DateTime } from 'luxon'
import { useState, useEffect } from 'react'
import { FlowSession } from '@/db/ebb/flowSessionRepo'
import { useFlowTimer } from '@/lib/stores/flowTimer'
import { logAndToastError } from '@/lib/utils/ebbError.util'
import { Button } from '@/components/ui/button'

const getDurationFormatFromSeconds = (seconds: number) => {
  const duration = Duration.fromMillis(seconds * 1000)
  const format = duration.as('minutes') >= 60 ? 'hh:mm:ss' : 'mm:ss'
  return duration.toFormat(format)
}

const MAX_SESSION_DURATION = 8 * 60 * 60

export const Timer = ({ flowSession }: { flowSession: FlowSession | null }) => {
  const { totalDuration } = useFlowTimer()
  const [time, setTime] = useState<string>('00:00')
  const [isAddingTime, setIsAddingTime] = useState(false)
  const [cooldown, setCooldown] = useState(false)
  const [hasShownWarning, setHasShownWarning] = useState(false)

  const handleAddTime = async () => {
    if (!flowSession || !flowSession.duration || isAddingTime || cooldown) return

    try {
      setIsAddingTime(true)
      setCooldown(true)

      await useFlowTimer.getState().addToTimer(15 * 60)

      setHasShownWarning(false) // keep

      // flowSession.duration = newTotalDurationInSeconds
    } catch (error) {
      logAndToastError(`Failed to extend session duration: ${error}`, error)
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

      const totalDurationAsSeconds = totalDuration?.as('seconds') || 0

      if (totalDurationAsSeconds > 0) {
        const remaining = totalDurationAsSeconds - diff
        if (remaining <= 0) {
          window.dispatchEvent(new CustomEvent('flowSessionComplete'))
          return
        }

        if (remaining <= 60 && !hasShownWarning) {
          invoke('show_notification', {
            notificationType: 'session-warning',
          })
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
  }, [flowSession, hasShownWarning, totalDuration])

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
