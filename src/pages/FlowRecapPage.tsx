import { useEffect, useRef, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { DateTime } from 'luxon'
import { TopNav } from '@/components/TopNav'
import { Logo } from '@/components/ui/logo'
import { MonitorApi, AppsWithTime, GraphableTimeByHourBlock } from '../api/monitorApi/monitorApi'
import { UsageSummary } from '@/components/UsageSummary'
import { invoke } from '@tauri-apps/api/core'
import { useGetMostRecentFlowSession } from '../api/hooks/useFlowSession'
import { logAndToastError } from '../lib/utils/ebbError.util'
import { getCurrentWindow } from '@tauri-apps/api/window'


export const FlowRecapPage = () => {
  const effectRan = useRef(false)
  const { data: mostRecentFlowSession } = useGetMostRecentFlowSession()
  const [appUsage, setAppUsage] = useState<AppsWithTime[]>([])
  const [totalCreating, setTotalCreating] = useState(0)
  const [totalTime, setTotalTime] = useState(0)
  const [chartData, setChartData] = useState<GraphableTimeByHourBlock[]>([])
  useEffect(() => {
    if (effectRan.current) return
    effectRan.current = true

    invoke('show_notification', {
      notificationType: 'session-end'
    })

    const init = async () => {
      if (!mostRecentFlowSession || !mostRecentFlowSession.end) return
      const start = DateTime.fromISO(mostRecentFlowSession.start)
      const end = DateTime.fromISO(mostRecentFlowSession.end)
      
      const rawChartData = await MonitorApi.getTimeCreatingByHour(start, end)
      const topApps = await MonitorApi.getTopAppsByPeriod(start, end)
      
      setAppUsage(topApps)
      
      const creating = rawChartData.reduce((acc, curr) => acc + curr.creating, 0)
      setTotalCreating(creating)
      
      const totalDuration = end.diff(start).as('minutes')
      setTotalTime(totalDuration)
      
      const processedChartData = rawChartData.slice(6)
      setChartData(processedChartData)
      
      const window = getCurrentWindow()
      void Promise.all([
        window.show().catch(err => logAndToastError(`(Flow recap) Error showing window: ${err}`, err)),
        window.setFocus().catch(err => logAndToastError(`(Flow recap) Error focusing window: ${err}`, err))
      ])
    }
    init()
  }, [mostRecentFlowSession])

  if (!mostRecentFlowSession) {
    return <div>Loading...</div>
  }

  const formatTimeRange = () => {
    if (!mostRecentFlowSession.start || !mostRecentFlowSession.end) return ''
    const start = DateTime.fromISO(mostRecentFlowSession.start)
    const end = DateTime.fromISO(mostRecentFlowSession.end)
    return `${start.toFormat('h:mm a')} - ${end.toFormat('h:mm a')}`
  }

  return (
    <div className="flex flex-col h-screen">
      <div className="flex">
        <div className="w-16 shrink-0 mt-4">
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
          <CardContent className="p-6">
            <div className="mb-4 flex justify-between items-center">
              <div className="text-sm">
                <span className="font-medium">'{mostRecentFlowSession.objective}'</span>
              </div>
              <div className="text-sm text-muted-foreground">
                {formatTimeRange()}
              </div>
            </div>

            <UsageSummary
              totalTimeLabel="Duration"
              totalTimeTooltip="Total duration of the session"
              totalTime={{ value: totalTime, trend: { percent: 0, direction: 'none' } }}
              totalCreating={{ value: totalCreating, trend: { percent: 0, direction: 'none' } }}
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
