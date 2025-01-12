import { Card, CardContent } from '@/components/ui/card'
import { InfoIcon as InfoCircle, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FlowChart } from '@/components/ui/flow-chart'
import { DateTime, Duration } from 'luxon'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { FlowSessionApi } from '../api/ebbApi/flowSessionApi'
import { getFlowScoreTailwindColor } from '../lib/utils/flow'
import { useState, useEffect } from 'react'
import { FlowPeriod } from '../db/flowPeriod'
import { FlowSession as FlowSessionType } from '../db/flowSession'

interface FlowSessionProps {
  startTime: string
  endTime: string
  flowScore: number
  timeInFlow: number
  selfReport: number
  objective: string
  graphColor?: string
  inactiveTime: number
  flowPeriods: FlowPeriod[]
}

function FlowSession({
  startTime,
  endTime,
  flowScore,
  timeInFlow,
  selfReport,
  objective,
  inactiveTime,
  flowPeriods,
}: FlowSessionProps) {
  const start = DateTime.fromISO(startTime)
  const end = DateTime.fromISO(endTime)
  const formatDuration = (milliseconds: number) => {
    const duration = Duration.fromMillis(milliseconds)
    return duration.toFormat('h\'h\' mm\'m\'')
  }
  // Get relative date display
  const getRelativeDate = (dateTime: DateTime) => {
    const today = DateTime.now().startOf('day')
    const sessionDate = dateTime.startOf('day')

    if (sessionDate.hasSame(today, 'day')) {
      return 'Today'
    } else if (sessionDate.hasSame(today.minus({ days: 1 }), 'day')) {
      return 'Yesterday'
    }
    return dateTime.toFormat('LLL dd')
  }


  const timeData = flowPeriods.map((flowPeriod) => {
    return {
      time: flowPeriod.end_time,
      value: flowPeriod.score,
    }
  })

  return (
    <Card className="mb-4">
      <CardContent className="p-6">
        <div className="mb-4 flex justify-between items-center">
          <div className="text-sm">
            <span className="font-medium">"{objective}"</span>
            <span className="text-muted-foreground"> · {getRelativeDate(start)}</span>
          </div>
          <div className="text-sm text-muted-foreground">
            {start.toFormat('h:mm a')} - {end.toFormat('h:mm a')}
          </div>
        </div>

        <div className="h-40 my-8">
          <FlowChart
            data={timeData}
            flowScore={flowScore}
          />
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              Flow Score
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <InfoCircle className="h-4 w-4" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>A measure of your focus and productivity during the session</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="text-xl font-semibold">{flowScore.toFixed(2)}</div>
          </div>
          <div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              Time in Flow
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <InfoCircle className="h-4 w-4" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Total time spent with a Flow Score {'>'} 5</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="text-xl font-semibold">{formatDuration(timeInFlow)}</div>
          </div>
          <div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              Self Report
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <InfoCircle className="h-4 w-4" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Your self-reported productivity score for this session</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="text-xl font-semibold">{selfReport}</div>
          </div>
          <div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              Idle Time
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <InfoCircle className="h-4 w-4" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Total time spent inactive during the session</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="text-xl font-semibold">{formatDuration(inactiveTime * 1000)}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function FlowSessions() {
  const [flowSessions, setFlowSessions] = useState<FlowSessionType[]>([])
  useEffect(() => {
    const init = async () => {
      const flowSessions = await FlowSessionApi.getFlowSessions()
      setFlowSessions(flowSessions)
    }
    init()

  }, [])

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Recent Flow Sessions</h2>
        <Button variant="ghost" size="icon">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      {flowSessions.map((flowSession) => (
        <FlowSession
          key={flowSession.id}
          startTime={flowSession.start}
          endTime={flowSession.end || ''}
          flowScore={flowSession.stats_json.avg_score || 0}
          timeInFlow={flowSession.stats_json.time_in_flow || 0}
          selfReport={flowSession.self_score || 0}
          objective={flowSession.objective}
          graphColor={getFlowScoreTailwindColor(flowSession.stats_json.avg_score || 0)}
          inactiveTime={flowSession.stats_json.inactive_time || 0}
          flowPeriods={flowSession.flow_periods_json || []}
        />
      ))}
    </div>
  )
}
