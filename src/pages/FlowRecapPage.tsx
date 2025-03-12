import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { DateTime } from 'luxon'
import { TopNav } from '@/components/TopNav'
import { Logo } from '@/components/ui/logo'
import { MonitorApi, AppsWithTime, GraphableTimeByHourBlock } from '../api/monitorApi/monitorApi'
import { UsageSummary } from '@/components/UsageSummary'

interface LocationState {
  sessionId: string
  timeInFlow: string
  contextSwitches: number
  idleTime: string
  objective: string
  startTime: string
  endTime: string
}

export const FlowRecapPage = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const state = location.state as LocationState
  const effectRan = useRef(false)
  const [appUsage, setAppUsage] = useState<AppsWithTime[]>([])
  const [totalCreating, setTotalCreating] = useState(0)
  const [totalOnline, setTotalOnline] = useState(0)
  const [chartData, setChartData] = useState<GraphableTimeByHourBlock[]>([])

  useEffect(() => {
    if (effectRan.current) return
    effectRan.current = true

    const init = async () => {
      if (!state?.startTime || !state?.endTime) return

      const start = DateTime.fromISO(state.startTime)
      const end = DateTime.fromISO(state.endTime)
      
      const rawChartData = await MonitorApi.getTimeCreatingByHour(start, end)
      const topApps = await MonitorApi.getTopAppsByPeriod(start, end)

      console.log('FlowRecapPage - Raw Chart Data:', rawChartData)
      
      setAppUsage(topApps)
      
      // Calculate total creating time
      const creating = rawChartData.reduce((acc, curr) => acc + curr.creating, 0)
      setTotalCreating(creating)
      
      // Calculate total online time
      const online = rawChartData.reduce((acc, curr) => 
        acc + curr.creating + curr.neutral + curr.consuming, 0)
      setTotalOnline(online)
      
      // Use the same approach as HomePage - just slice the data
      // This is simpler and more compatible than using generateTimeBlocks
      const processedChartData = rawChartData.slice(6)
      console.log('FlowRecapPage - Processed Chart Data:', processedChartData)
      setChartData(processedChartData)
    }
    init()
  }, [state, navigate])

  if (!state) {
    return <div>Loading...</div>
  }

  const formatTimeRange = () => {
    if (!state.startTime || !state.endTime) return ''
    const start = DateTime.fromISO(state.startTime)
    const end = DateTime.fromISO(state.endTime)
    return `${start.toFormat('h:mm a')} - ${end.toFormat('h:mm a')}`
  }

  return (
    <div className="flex flex-col h-screen">
      <div className="flex">
        <div className="h-14 border-b flex items-center px-2">
          <Logo />
        </div>
        <TopNav variant="modal" />
      </div>
      <div className="flex-1 flex items-center justify-center bg-background/80 backdrop-blur-sm pt-8">
        <Card className="w-full max-w-3xl transition-all duration-300">
          <CardContent className="p-6 space-y-8">
            <div className="mb-4 flex justify-between items-center">
              <div className="text-sm">
                <span className="font-medium">'{state?.objective}'</span>
              </div>
              <div className="text-sm text-muted-foreground">
                {formatTimeRange()}
              </div>
            </div>

            <UsageSummary
              totalTimeLabel="Duration"
              totalOnline={totalOnline}
              totalCreating={totalCreating}
              chartData={chartData}
              appUsage={appUsage}
              showTopAppsButton={true}
              showAppRatingControls={false}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
