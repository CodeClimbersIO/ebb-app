import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { getFlowScoreTailwindColor, getFlowStatusText } from '@/lib/utils/flow'
import { LiveFlowChart } from '@/components/ui/live-flow-chart'
import { FlowSession } from '../db/flowSession'
import { DateTime } from 'luxon'
import { FlowSessionApi } from '../api/ebbApi/flowSessionApi'

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

interface LocationState {
  startTime: number
  objective: string
  sessionId: string
}

export const FlowPage = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { startTime, objective, sessionId } = location.state as LocationState
  const [time, setTime] = useState<string>('00:00')
  const [flowSession, setFlowSession] = useState<FlowSession | null>(null)
  const [flowData, setFlowData] = useState<FlowData | null>(null)
  const [chartData, setChartData] = useState<ChartData[]>([])

  const generateChartData = () => {
    const now = new Date()
    return Array(6).fill(null).map((_, i) => {
      const time = new Date(now.getTime() - (50 - i * 10) * 60000)
      return {
        time,
        label: i === 5 ? 'Live' : `${50 - i * 10}m ago`,
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
      const diff = now - DateTime.fromISO(flowSession.start).toMillis()
      const minutes = Math.floor(diff / 60000)
      const seconds = Math.floor((diff % 60000) / 1000)
      setTime(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`)
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)

    // Simulate flow data update
    setFlowData({
      flowScore: 8,
      appSwitches: 2,
      topActivity: 'Code Editor',
      timestamp: new Date().toISOString()
    })

    return () => clearInterval(interval)
  }, [flowSession, navigate])

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
          label: 'Live',
          value: flowData.flowScore,
          appSwitches: Math.floor(Math.random() * 3),
          topActivity: 'Arc • Google meet call'
        }]
        // Update all labels
        return newData.map((data, i) => ({
          ...data,
          label: i === newData.length - 1 ? 'Live' : `${50 - i * 10}m ago`
        }))
      })
    }
  }, [flowData?.flowScore])

  const handleEndSession = async () => {
    if (!flowSession) return
    await FlowSessionApi.endFlowSession(flowSession.id)
    navigate('/')
  }

  return (
    <div className="flex flex-col h-screen">
      <div className="flex justify-end p-4">
        <Button
          variant="destructive"
          onClick={handleEndSession}
        >
          End Session
        </Button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="text-sm text-muted-foreground mb-4">{flowSession?.objective}</div>
        <div className="text-6xl font-bold mb-4">{time}</div>
        {flowData && (
          <div className={`px-4 py-2 rounded-full ${getFlowScoreTailwindColor(flowData.flowScore)}`}>
            {getFlowStatusText(flowData.flowScore)}
          </div>
        )}
        <div className="w-full max-w-3xl mx-auto px-4 mb-8">
          <LiveFlowChart data={chartData} flowScore={flowData?.flowScore || 0} />
        </div>
      </div>
    </div>
  )
} 
