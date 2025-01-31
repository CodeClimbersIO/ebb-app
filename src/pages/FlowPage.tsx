import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { FlowSession } from '../db/flowSession'
import { DateTime, Duration } from 'luxon'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { FlowSessionApi } from '../api/ebbApi/flowSessionApi'
import {
  Card,
  CardContent,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Music } from 'lucide-react'

interface FlowData {
  flowScore: number
  appSwitches: number
  topActivity: string
  timestamp: string
}

const getDurationFormatFromSeconds = (seconds: number) => {
  const duration = Duration.fromMillis(seconds * 1000)
  const format = duration.as('minutes') >= 60 ? 'hh:mm:ss' : 'mm:ss'
  return duration.toFormat(format)
}

export const FlowPage = () => {
  const navigate = useNavigate()
  const [time, setTime] = useState<string>('00:00')
  const [flowSession, setFlowSession] = useState<FlowSession | null>(null)
  const [flowData, setFlowData] = useState<FlowData | null>(null)
  const [showEndDialog, setShowEndDialog] = useState(false)

  useEffect(() => {
    const init = async () => {
      const flowSession = await FlowSessionApi.getInProgressFlowSession()
      if (!flowSession) {
        navigate('/start-flow')
      }
      setFlowSession(flowSession)
    }
    init()
  }, [])

  useEffect(() => {
    if (!flowSession) return

    const updateTimer = () => {
      const now = DateTime.now()
      const nowAsSeconds = now.toSeconds()
      const startTime = DateTime.fromISO(flowSession.start).toSeconds()

      const diff = nowAsSeconds - startTime

      // If duration is set (in minutes), do countdown
      if (flowSession.duration) {
        const remaining = (flowSession.duration) - diff
        if (remaining <= 0) {
          handleEndSession()
          return
        }

        const duration = getDurationFormatFromSeconds(remaining)
        setTime(duration)
      } else {
        // Count up if no duration set
        const duration = getDurationFormatFromSeconds(diff)
        setTime(duration)
      }

    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)

    // Simulate flow data for now
    setFlowData({
      flowScore: 8,
      appSwitches: 2,
      topActivity: 'Code Editor',
      timestamp: new Date().toISOString()
    })

    return () => clearInterval(interval)
  }, [flowSession])

  const handleEndSession = async () => {
    if (!flowSession) return
    await FlowSessionApi.endFlowSession(flowSession.id)
    setShowEndDialog(false)

    // Navigate to recap page with session data
    navigate('/flow-recap', {
      state: {
        sessionId: flowSession.id,
        startTime: flowSession.start,
        endTime: new Date().toISOString(),
        flowScore: flowData?.flowScore || 0,
        timeInFlow: time,
        contextSwitches: flowData?.appSwitches || 0,
        idleTime: '0h 34m', // You'll need to calculate this properly
        objective: flowSession.objective
      }
    })
  }

  return (
    <div className="flex flex-col h-screen">
      <div className="flex justify-end p-4">
        <Dialog open={showEndDialog} onOpenChange={setShowEndDialog}>
          <DialogTrigger asChild>
            <Button variant="destructive">
              End Session
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>End Flow Session</DialogTitle>
              <DialogDescription>
                Are you sure you want to end this flow session? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowEndDialog(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleEndSession}>
                End Session
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="text-sm text-muted-foreground mb-2">{flowSession?.objective}</div>
        <div className="text-6xl font-bold mb-2">
          {time}
        </div>
        <div className="w-full max-w-2xl mx-auto px-4 mb-4 mt-12">
          <Card className="p-6">
            <CardContent className="space-y-12">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-sm text-muted-foreground">
                    Connected to Spotify
                  </span>
                </div>
                <Select defaultValue="playlist1">
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select playlist" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="playlist1">
                      <div className="flex items-center">
                        <Music className="h-4 w-4 mr-2" />
                        Deep Focus Playlist
                      </div>
                    </SelectItem>
                    <SelectItem value="playlist2">
                      <div className="flex items-center">
                        <Music className="h-4 w-4 mr-2" />
                        Coding Mode
                      </div>
                    </SelectItem>
                    <SelectItem value="playlist3">
                      <div className="flex items-center">
                        <Music className="h-4 w-4 mr-2" />
                        Flow State
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col items-center space-y-6">
                <div className="text-center">
                  <h3 className="text-2xl font-semibold">Midnight Rain</h3>
                  <p className="text-sm text-muted-foreground">Taylor Swift</p>
                </div>
                
                <div className="w-full space-y-2">
                  <div className="relative w-full h-1 bg-secondary rounded-full overflow-hidden">
                    <div className="absolute h-full w-1/3 bg-primary rounded-full" />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>1:23</span>
                    <span>3:45</span>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <Button variant="ghost" size="icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="19 20 9 12 19 4 19 20"></polygon><line x1="5" y1="19" x2="5" y2="5"></line></svg>
                  </Button>
                  <Button size="icon" className="h-12 w-12">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polygon points="10 8 16 12 10 16 10 8"></polygon></svg>
                  </Button>
                  <Button variant="ghost" size="icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 4 15 12 5 20 5 4"></polygon><line x1="19" y1="5" x2="19" y2="19"></line></svg>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
