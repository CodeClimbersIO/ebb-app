import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { getFlowScoreTailwindColor, getFlowStatusText } from '@/lib/utils/flow'
import { LiveFlowChart } from '@/components/ui/live-flow-chart'
import { FlowSession } from '../db/flowSession'
import { DateTime } from 'luxon'
import { FlowSessionApi } from '../api/ebbApi/flowSessionApi'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface FlowData {
  flowScore: number
  appSwitches: number
  topActivity: string
  timestamp: string
}

interface ChartData {
  time: Date
  label: string
  value: number
  appSwitches: number
  topActivity: string
}

export const FlowPage = () => {
  const navigate = useNavigate()
  const [time, setTime] = useState<string>('00:00')
  const [flowSession, setFlowSession] = useState<FlowSession | null>(null)
  const [flowData, setFlowData] = useState<FlowData | null>(null)
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [showEndDialog, setShowEndDialog] = useState(false)
  const [isShortSession, setIsShortSession] = useState(false)
  const [isInitialPeriod, setIsInitialPeriod] = useState(true)

  const generateChartData = () => {
    const now = new Date()
    return Array(6).fill(null).map((_, i) => {
      const time = new Date(now.getTime() - (50 - i * 10) * 60000)
      return {
        time,
        label: `${60 - i * 10}m ago`,
        value: 5 + Math.sin(i) * 3,
        appSwitches: Math.floor(Math.random() * 3),
        topActivity: 'Arc • Google meet call'
      }
    })
  }

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
      const now = new Date().getTime()
      const startTime = DateTime.fromISO(flowSession.start).toMillis()
      const diff = now - startTime
      
      // If duration is set (in minutes), do countdown
      if (flowSession.duration) {
        const remaining = (flowSession.duration * 60 * 1000) - diff
        if (remaining <= 0) {
          handleEndSession()
          return
        }
        const minutes = Math.floor(remaining / 60000)
        const seconds = Math.floor((remaining % 60000) / 1000)
        setTime(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`)
      } else {
        // Count up if no duration set
        const minutes = Math.floor(diff / 60000)
        const seconds = Math.floor((diff % 60000) / 1000)
        setTime(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`)
      }
      
      setIsShortSession(diff < 20 * 60 * 1000) // Less than 20 minutes
      setIsInitialPeriod(diff < 10 * 60 * 1000) // Less than 10 minutes
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

  useEffect(() => {
    // Initial data generation
    setChartData(generateChartData())
  }, []) // Run once on mount

  // Add new effect for flow score updates
  useEffect(() => {
    if (flowData?.flowScore) {
      setChartData(prevData => {
        const now = new Date()
        const newData = [...prevData.slice(1), {
          time: now,
          label: '10m',
          value: flowData.flowScore,
          appSwitches: Math.floor(Math.random() * 3),
          topActivity: 'Arc • Google meet call'
        }]
        // Update all labels to show minutes
        return newData.map((data, i) => ({
          ...data,
          label: `${60 - i * 10}m ago`
        }))
      })
    }
  }, [flowData?.flowScore])

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
        contextSwitches: chartData.reduce((sum, data) => sum + data.appSwitches, 0),
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
              {isShortSession ? 'Cancel Session' : 'End Session'}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{isShortSession ? 'Cancel Flow Session' : 'End Flow Session'}</DialogTitle>
              <DialogDescription>
                {isShortSession 
                  ? 'Are you sure you want to end this flow session? Sessions less than 20 minutes are canceled and not added to your history.'
                  : 'Are you sure you want to end this flow session? This action cannot be undone.'}
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowEndDialog(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleEndSession}>
                {isShortSession ? 'Cancel Session' : 'End Session'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="text-sm text-muted-foreground mb-2">{flowSession?.objective}</div>
        <div className="text-6xl font-bold mb-2">
          {time}
          {flowSession?.duration && (
            <span className="text-sm text-muted-foreground ml-2">
              / {flowSession.duration}:00
            </span>
          )}
        </div>
        {flowData && !isInitialPeriod && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <div className={`px-4 py-2 rounded-full ${getFlowScoreTailwindColor(flowData.flowScore)}`}>
                  {getFlowStatusText(flowData.flowScore)}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>A flow score above 5 counts as "in flow"</p>
                <p className="mt-2">New flow score calculated every 10 min</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        <div className="w-full max-w-3xl mx-auto px-4 mb-4 mt-4">
          {isInitialPeriod ? (
            <div className="flex flex-col items-center justify-center h-[300px]">
              <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-primary"></div>
              <p className="mt-4 text-muted-foreground">
                Calculating flow... ready in 10 min
              </p>
            </div>
          ) : (
            <LiveFlowChart data={chartData} flowScore={flowData?.flowScore || 0} />
          )}
        </div>
      </div>
    </div>
  )
}
