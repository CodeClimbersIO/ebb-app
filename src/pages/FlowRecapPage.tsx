import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { DateTime } from 'luxon'
import { TopNav } from '@/components/TopNav'
import { Logo } from '@/components/ui/logo'
import { MonitorApi, AppsWithTime, GraphableTimeByHourBlock } from '../api/monitorApi/monitorApi'
import { UsageSummary } from '@/components/UsageSummary'
import NotificationManager from '@/lib/notificationManager'

interface LocationState {
  sessionId: string
  timeInFlow: string
  contextSwitches: number
  idleTime: string
  objective: string
  startTime: string
  endTime: string
}

const notificationManager = NotificationManager.getInstance()

export const FlowRecapPage = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const state = location.state as LocationState
  const effectRan = useRef(false)
  const [appUsage, setAppUsage] = useState<AppsWithTime[]>([])
  const [totalCreating, setTotalCreating] = useState(0)
  const [totalTime, setTotalTime] = useState(0)
  const [chartData, setChartData] = useState<GraphableTimeByHourBlock[]>([])

  useEffect(() => {
    if (effectRan.current) return
    effectRan.current = true

    notificationManager.show({
      type: 'session-end'
    })

    const init = async () => {
      if (!state?.startTime || !state?.endTime) return

      const start = DateTime.fromISO(state.startTime)
      const end = DateTime.fromISO(state.endTime)
      
      const rawChartData = await MonitorApi.getTimeCreatingByHour(start, end)
      const topApps = await MonitorApi.getTopAppsByPeriod(start, end)
      
      setAppUsage(topApps)
      
      const creating = rawChartData.reduce((acc, curr) => acc + curr.creating, 0)
      setTotalCreating(creating)
      
      const totalDuration = end.diff(start).as('minutes')
      setTotalTime(totalDuration)
      
      const processedChartData = rawChartData.slice(6)
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
        <div className="w-16 shrink-0">
          <div className="h-14 border-b flex items-center justify-center">
            <Logo width={32} height={32} />
          </div>
        </div>
        <div className="-ml-16 flex-1">
          <TopNav variant="modal" />
        </div>
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
              totalTimeTooltip="Total duration of the session"
              totalTime={totalTime}
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
