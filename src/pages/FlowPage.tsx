import { useEffect, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { EbbApi } from "../api/ebbApi"

interface FlowData {
  flowScore: number
  contextSwitches: number
  topActivity: string
  timestamp: string
}

interface LocationState {
  sessionId: string
  objective: string
  startTime: number
}

export const FlowPage = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { sessionId, objective, startTime } = location.state as LocationState
  const [time, setTime] = useState<string>("00:00")
  const [flowData, setFlowData] = useState<FlowData | null>(null)

  useEffect(() => {
    if (!objective || !startTime || !sessionId) {
      navigate('/start-flow')
      return
    }

    const updateTimer = () => {
      const now = new Date().getTime()
      const diff = now - startTime
      const minutes = Math.floor(diff / 60000)
      const seconds = Math.floor((diff % 60000) / 1000)
      setTime(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`)
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)

    // Simulate flow data for now
    setFlowData({
      flowScore: 6,
      contextSwitches: 2,
      topActivity: "Code Editor",
      timestamp: new Date().toISOString()
    })

    return () => clearInterval(interval)
  }, [startTime, objective, sessionId, navigate])

  const handleEndSession = () => {
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
        <div className="text-sm text-muted-foreground mb-4">{objective}</div>
        <div className="text-6xl font-bold mb-4">{time}</div>
        {flowData?.flowScore < 7 && (
          <div className="text-orange-500 bg-orange-100 px-4 py-2 rounded-full">
            Ebbing · High Context Switching
          </div>
        )}
        {/* Add your flow chart component here */}
      </div>
    </div>
  )
} 