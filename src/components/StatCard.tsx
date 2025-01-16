import { Card, CardContent } from '@/components/ui/card'
import { Info } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { getFlowScoreTailwindColor } from '@/lib/utils/flow'
import { useEffect, useState } from 'react'
import { FlowSessionApi } from '../api/ebbApi/flowSessionApi'
import { FlowSessionPeriodComparison } from '../db/flowSession'
import { Duration } from 'luxon'

interface StatCardProps {
  title: string
  value: string | number
  tooltipContent: string
  isFlowScore?: boolean
  change?: {
    value: number
  }
}

function StatCard({ title, value, tooltipContent, isFlowScore, change }: StatCardProps) {
  const changeValue = Math.abs(change?.value || 0)
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1">
            <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p>{tooltipContent}</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className={`text-2xl font-semibold ${isFlowScore ? getFlowScoreTailwindColor(Number(value)).split(' ')[0] : ''
            }`}>
            {value}
          </span>
          {change && (
            <span
              className={`text-sm  ${change.value > 0 ? 'text-green-500' : 'text-gray-500'
                }`}
            >
              {change.value > 0 ? '↑' : '↓'} {changeValue.toFixed(2)}%
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export function StatsCards() {
  const [flowSessionPeriodComparisons, setFlowSessionPeriodComparisons] = useState<FlowSessionPeriodComparison | null>(null)
  useEffect(() => {
    const init = async () => {
      const flowSessionPeriodComparisons = await FlowSessionApi.getFlowSessionPeriodComparisons('week')
      setFlowSessionPeriodComparisons(flowSessionPeriodComparisons)
    }
    init()
  }, [])

  const currentSessions = flowSessionPeriodComparisons?.current.sessions.length || 0
  const previousSessions = flowSessionPeriodComparisons?.previous.sessions.length || 0
  const currentAvgScore = flowSessionPeriodComparisons?.current.stats.avg_score || 0
  const previousAvgScore = flowSessionPeriodComparisons?.previous.stats.avg_score || 0
  const currentTimeInFlow = flowSessionPeriodComparisons?.current.stats.time_in_flow || 0
  const previousTimeInFlow = flowSessionPeriodComparisons?.previous.stats.time_in_flow || 0
  const sessionChangePercentage = (currentSessions - previousSessions) / previousSessions * 100
  const avgScoreChangePercentage = (currentAvgScore - previousAvgScore) / previousAvgScore * 100
  const timeInFlowChangePercentage = (currentTimeInFlow - previousTimeInFlow) / previousTimeInFlow * 100
  return (
    <TooltipProvider>
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          title="Flow Sessions (7d)"
          value={currentSessions}
          tooltipContent="Total number of flow sessions recorded in the last 7 days"
          change={{ value: sessionChangePercentage }}
        />
        <StatCard
          title="Avg Flow Score (7d)"
          value={currentAvgScore.toFixed(2)}
          isFlowScore={true}
          tooltipContent="Average flow score recorded in the last 30 days"
          change={{ value: avgScoreChangePercentage }}
        />
        <StatCard
          title="Time in Flow (7d)"
          value={Duration.fromMillis(currentTimeInFlow).toFormat('h\'h\' mm\'m\'')}
          tooltipContent="Total time spent with a Flow Score > 5 in the last 7 days"
          change={{ value: timeInFlowChangePercentage }}
        />
      </div>
    </TooltipProvider>
  )
}
