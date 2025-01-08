import { Card, CardContent } from "@/components/ui/card"
import { InfoIcon as InfoCircle } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { ChevronRight } from 'lucide-react'
import { FlowChart } from "@/components/ui/flow-chart"
import { DateTime } from "luxon"

interface FlowSessionProps {
  startTime: string
  endTime: string
  flowScore: number
  timeInFlow: string
  selfReport: number
  objective: string
  graphColor?: string
}

function FlowSession({
  startTime,
  endTime,
  flowScore,
  timeInFlow,
  selfReport,
  objective,
  graphColor = "#9333EA",
}: FlowSessionProps) {
  // Convert strings to DateTime objects
  const start = DateTime.fromISO(startTime);
  const end = DateTime.fromISO(endTime);
  
  // Get relative date display
  const getRelativeDate = (dateTime: DateTime) => {
    const today = DateTime.now().startOf('day');
    const sessionDate = dateTime.startOf('day');
    
    if (sessionDate.hasSame(today, 'day')) {
      return 'Today';
    } else if (sessionDate.hasSame(today.minus({ days: 1 }), 'day')) {
      return 'Yesterday';
    }
    return dateTime.toFormat('LLL dd');
  };

  // Calculate total minutes for graph intervals
  const totalMinutes = end.diff(start, 'minutes').minutes;
  const intervalMinutes = Math.floor(totalMinutes / 9); // 9 intervals = 10 points

  // Generate mock data with proper time intervals
  const mockData = Array.from({ length: 10 }, (_, i) => {
    const pointTime = start.plus({ minutes: i * intervalMinutes }).toJSDate();
    return {
      time: pointTime,
      value: Math.sin(i * 0.5) * (flowScore / 2) + flowScore / 2,
      appSwitches: Math.floor(Math.random() * 10)
    };
  });

  return (
    <Card className="mb-4">
      <CardContent className="p-6">
        <div className="mb-4">
          <div className="text-sm">
            <span>{getRelativeDate(start)}</span>
            <span className="text-muted-foreground"> · {start.toFormat('h:mm a')} - {end.toFormat('h:mm a')}</span>
          </div>
        </div>
        <div className="h-40 my-8">
          <FlowChart data={mockData} color={graphColor} />
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
        startTime="2025-01-08T11:23:00"
        endTime="2025-01-08T16:22:00"
        flowScore={7.8}
        timeInFlow="2h 23m"
        selfReport={6.5}
        objective="Code FlowState App"
        graphColor="#9333EA"
      />
      <FlowSession
        startTime="2023-12-12T14:23:00"
        endTime="2023-12-12T15:54:00"
        flowScore={2.2}
        timeInFlow="0h 34m"
        selfReport={3.5}
        objective="Research docs for email API"
        graphColor="#EF4444"
      />
    </div>
  )
}