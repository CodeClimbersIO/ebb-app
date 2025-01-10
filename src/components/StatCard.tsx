import { Card, CardContent } from '@/components/ui/card'
import { Info } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { getFlowScoreTailwindColor } from '@/lib/utils/flow'

interface StatCardProps {
  title: string
  value: string | number
  tooltipContent: string
  isFlowScore?: boolean
  change?: {
    value: number
    positive: boolean
  }
}

function StatCard({ title, value, tooltipContent, isFlowScore, change }: StatCardProps) {
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
          <span className={`text-2xl font-semibold ${
            isFlowScore ? getFlowScoreTailwindColor(Number(value)).split(' ')[0] : ''
          }`}>
            {value}
          </span>
          {change && (
            <span
              className={`text-sm  ${change.positive ? 'text-green-500' : 'text-gray-500'
                }`}
            >
              {change.positive ? '↑' : '↓'} {Math.abs(change.value)}%
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export function StatsCards() {
  return (
    <TooltipProvider>
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          title="Flow Sessions (7d)"
          value="52"
          tooltipContent="Total number of flow sessions recorded in the last 7 days"
          change={{ value: 20.4, positive: true }}
        />
        <StatCard
          title="Avg Flow Score (7d)"
          value="9.3"
          isFlowScore={true}
          tooltipContent="Average flow score recorded in the last 30 days"
          change={{ value: 20.4, positive: false }}
        />
        <StatCard
          title="Time in Flow (7d)"
          value="140h"
          tooltipContent="Total time spent with a Flow Score > 5 in the last 7 days"
          change={{ value: 5.4, positive: true }}
        />
      </div>
    </TooltipProvider>
  )
}
