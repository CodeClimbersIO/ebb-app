import { Card, CardContent } from "@/components/ui/card"
import { InfoIcon as InfoCircle } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { ChevronRight } from 'lucide-react'

interface FlowSessionProps {
  date: string
  timeRange: string
  flowScore: number
  timeInFlow: string
  selfReport: number
  objective: string
  graphColor?: string
}

function FlowSession({
  date,
  timeRange,
  flowScore,
  timeInFlow,
  selfReport,
  objective,
  graphColor = "#9333EA",
}: FlowSessionProps) {
  return (
    <Card className="mb-4">
      <CardContent className="p-6">
        <div className="mb-4">
          <div className="text-sm text-muted-foreground">
            {date} · {timeRange}
          </div>
        </div>
        <div className="h-24 mb-4">
          {/*Placeholder for the graph*/}
          <div
            className="w-full h-full rounded-lg"
            style={{
              background: `linear-gradient(90deg, ${graphColor}22 0%, ${graphColor}44 100%)`,
            }}
          />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              Flow Score
              <InfoCircle className="h-4 w-4" />
            </div>
            <div className="text-xl font-semibold">{flowScore}</div>
          </div>
          <div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              Time in Flow
              <InfoCircle className="h-4 w-4" />
            </div>
            <div className="text-xl font-semibold">{timeInFlow}</div>
          </div>
          <div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              Self Report
              <InfoCircle className="h-4 w-4" />
            </div>
            <div className="text-xl font-semibold">{selfReport}</div>
          </div>
        </div>
        <div className="mt-4">
          <div className="text-sm font-medium">Main Objective</div>
          <div className="text-sm text-muted-foreground">{objective}</div>
        </div>
      </CardContent>
    </Card>
  )
}

export function FlowSessions() {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Recent Flow Sessions</h2>
        <Button variant="ghost" size="icon">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <FlowSession
        date="Yesterday"
        timeRange="11:23 AM - 4:22 PM"
        flowScore={7.8}
        timeInFlow="2h 23m"
        selfReport={6.5}
        objective="Code FlowState App"
        graphColor="#9333EA"
      />
      <FlowSession
        date="Dec 12"
        timeRange="2:23 PM - 3:54 PM"
        flowScore={2.2}
        timeInFlow="0h 34m"
        selfReport={3.5}
        objective="Research docs for email API"
        graphColor="#EF4444"
      />
    </div>
  )
}