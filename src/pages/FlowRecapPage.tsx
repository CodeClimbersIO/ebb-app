import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Clock, WandSparkles, Diff } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { DateTime } from 'luxon'
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts'
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
} from '@/components/ui/chart'
import { TopNav } from '@/components/TopNav'
import { LogoContainer } from '@/components/LogoContainer'

interface LocationState {
  sessionId: string
  timeInFlow: string
  contextSwitches: number
  idleTime: string
  objective: string
  startTime: string
  endTime: string
}

const generateSessionData = (startTime: string, endTime: string) => {
  const start = DateTime.fromISO(startTime)
  const end = DateTime.fromISO(endTime)
  const totalMinutes = end.diff(start, 'minutes').minutes
  const intervalMinutes = Math.floor(totalMinutes / 9) // 9 intervals = 10 points

  return Array.from({ length: 10 }, (_, i) => {
    const time = start.plus({ minutes: i * intervalMinutes })
    const displayTime = time.toFormat('h:mm a')
    const nextTime = time.plus({ minutes: intervalMinutes }).toFormat('h:mm a')
    const timeRange = `${displayTime} - ${nextTime}`
    const showLabel = i % 2 === 0

    return {
      time: time.toJSDate(),
      timeRange,
      xAxisLabel: showLabel ? displayTime : '',
      creating: Math.floor(Math.random() * 40),
      consuming: Math.floor(Math.random() * 20),
      offline: Math.floor(Math.random() * 10)
    }
  })
}

const chartConfig = {
  consuming: {
    label: 'Consuming',
    color: 'rgb(248, 113, 113)',
  },
  creating: {
    label: 'Creating',
    color: 'rgb(124,58,237)',
  },
} satisfies ChartConfig

const calculateNetCreationScore = (timeCreating: number, timeConsuming: number): number => {
  return Number((timeCreating * 0.1 - timeConsuming * 0.05).toFixed(1))
}

const formatDuration = (startTime: string, endTime: string): string => {
  const start = DateTime.fromISO(startTime)
  const end = DateTime.fromISO(endTime)
  const diff = end.diff(start, ['hours', 'minutes', 'seconds'])
  
  if (diff.hours >= 1) {
    return `${Math.floor(diff.hours)}h ${Math.floor(diff.minutes)}m`
  }
  return `${Math.floor(diff.minutes)}m ${Math.floor(diff.seconds)}s`
}

export const FlowRecapPage = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const state = location.state as LocationState

  useEffect(() => {
    if (!state?.sessionId) {
      navigate('/')
    }
  }, [state, navigate])

  const formatTimeRange = () => {
    const start = DateTime.fromISO(state?.startTime)
    const end = DateTime.fromISO(state?.endTime)
    return `${start.toFormat('h:mm a')} - ${end.toFormat('h:mm a')}`
  }

  const chartData = generateSessionData(state?.startTime, state?.endTime)

  // Mock data for demonstration - replace with real data later
  const timeCreating = 225 // 3h 45m in minutes
  const timeConsuming = 120 // 2h in minutes
  const topApps = ['VS Code', 'Chrome', 'Slack'].map(name => ({
    name,
    icon: '', // This would come from your apps directory
  }))

  return (
    <div className="flex flex-col h-screen">
      <div className="flex">
        <LogoContainer />
        <TopNav variant="modal" />
      </div>
      <div className="flex-1 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <Card className="w-full max-w-3xl">
          <CardContent className="p-6 space-y-8">
            <div className="mb-4 flex justify-between items-center">
              <div className="text-sm">
                <span className="font-medium">'{state?.objective}'</span>
              </div>
              <div className="text-sm text-muted-foreground">
                {formatTimeRange()}
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Duration
                  </CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <div className="text-2xl font-bold">
                          {formatDuration(state?.startTime, state?.endTime)}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Total duration of your focus session</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Time Creating
                  </CardTitle>
                  <WandSparkles className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <div className="text-2xl font-bold">
                          {Math.floor(timeCreating / 60)}h {timeCreating % 60}m
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Total time spent creating during session</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Net Creation
                  </CardTitle>
                  <Diff className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <div className="text-2xl font-bold">
                          {calculateNetCreationScore(timeCreating, timeConsuming) > 0 ? '+' : ''}
                          {calculateNetCreationScore(timeCreating, timeConsuming)}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Positive = more creation, Negative = more consumption</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Top Apps Used
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2">
                    {topApps.map((app, index) => (
                      <div
                        key={index}
                        className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center"
                      >
                        {app.icon ? (
                          <img
                            src={`/src/lib/app-directory/icons/${app.icon}`}
                            alt={app.name}
                            className="h-5 w-5"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              const parent = target.parentElement
                              if (parent) {
                                parent.textContent = '💻'
                              }
                            }}
                          />
                        ) : (
                          <span className="text-muted-foreground">💻</span>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardContent className="pt-6">
                <ChartContainer config={chartConfig}>
                  <BarChart height={200} data={chartData}>
                    <CartesianGrid
                      vertical={false}
                      stroke="hsl(var(--border))"
                      strokeOpacity={0.8}
                    />
                    <XAxis
                      dataKey="xAxisLabel"
                      tickLine={false}
                      tickMargin={10}
                      axisLine={false}
                      interval={0}
                    />
                    <ChartTooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null
                        const data = payload[0].payload
                        return (
                          <div className="rounded-lg border bg-background p-2 shadow-md">
                            <div className="mb-2 font-medium">{data.timeRange}</div>
                            <div className="space-y-1">
                              <div className="text-[rgb(124,58,237)]">Creating: {data.creating} min</div>
                              <div className="text-[rgb(239,68,68)]">Consuming: {data.consuming} min</div>
                              <div className="text-gray-500">Offline: {data.offline} min</div>
                            </div>
                          </div>
                        )
                      }}
                    />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Bar
                      dataKey="consuming"
                      stackId="a"
                      fill={chartConfig.consuming.color}
                      radius={[0, 0, 4, 4]}
                      barSize={20}
                    />
                    <Bar
                      dataKey="creating"
                      stackId="a"
                      fill={chartConfig.creating.color}
                      radius={[4, 4, 0, 0]}
                      barSize={20}
                    />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>

          </CardContent>
        </Card>
      </div>
    </div>
  )
}
