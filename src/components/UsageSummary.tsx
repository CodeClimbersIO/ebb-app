import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
} from '@/components/ui/chart'
import { Progress } from '@/components/ui/progress'
import { GraphableTimeByHourBlock, AppsWithTime } from '../api/monitorApi/monitorApi'
import { AppIcon } from './AppIcon'
import { Button } from './ui/button'
import { useRef } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import { Slider } from './ui/slider'
import { ActivityRating } from '@/lib/app-directory/apps-types'
import { Tag } from '../db/monitor/tagRepo'

export const chartConfig = {
  creating: {
    label: 'Creating',
    color: 'rgb(124,58,237)', // Purple
  },
  neutral: {
    label: 'Neutral',
    color: 'hsl(var(--muted-foreground) / 0.5)', // Using the muted foreground color with 50% opacity
  },
  consuming: {
    label: 'Consuming',
    color: 'rgb(248,113,113)', // Red
  },
} satisfies ChartConfig

export const formatTime = (minutes: number) => {
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = Math.round(minutes % 60)
  if (remainingMinutes === 60) {
    return `${hours + 1}h 0m`
  }
  return `${hours}h ${remainingMinutes}m`
}

export interface UsageSummaryProps {
  totalTimeLabel?: string;
  totalTimeTooltip?: string;
  totalTime: number;
  totalCreating: number;
  chartData: GraphableTimeByHourBlock[];
  appUsage: AppsWithTime[];
  showTopAppsButton?: boolean;
  showAppRatingControls?: boolean;
  onRatingChange?: (tagId: string, rating: ActivityRating, tags: Tag[]) => void;
  tags?: Tag[];
  isLoading?: boolean;
  yAxisMax?: number;
}

export const UsageSummary = ({
  totalTimeLabel = 'Total Time',
  totalTimeTooltip = 'Total time spent online',
  totalTime,
  totalCreating,
  chartData,
  appUsage,
  showTopAppsButton = false,
  showAppRatingControls = false,
  onRatingChange,
  tags = [],
  isLoading = false,
  yAxisMax,
}: UsageSummaryProps) => {
  // Sort app usage
  const sortedAppUsage = [...appUsage].sort((a, b) => b.duration - a.duration)
  const appUsageRef = useRef<HTMLDivElement>(null)

  const scrollToAppUsage = () => {
    appUsageRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <TooltipProvider>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{totalTimeLabel}</CardTitle>
            </CardHeader>
            <CardContent>
              <Tooltip>
                <TooltipTrigger>
                  <div className="text-2xl font-bold">{formatTime(totalTime)}</div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{totalTimeTooltip}</p>
                </TooltipContent>
              </Tooltip>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Time Creating
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tooltip>
                <TooltipTrigger>
                  <div className="text-2xl font-bold">{formatTime(totalCreating)}</div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Total time spent creating</p>
                </TooltipContent>
              </Tooltip>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Top Apps/Websites</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                {sortedAppUsage.slice(0, 3).map((app, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    className="w-8 h-8 p-0"
                    onClick={showTopAppsButton ? scrollToAppUsage : undefined}
                  >
                    <AppIcon app={app} />
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TooltipProvider>
      </div>

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex h-[200px] items-center justify-center text-muted-foreground">
                Crunching the numbers...
            </div>
          ) : (
            <ChartContainer config={chartConfig}>
              <BarChart height={200} data={chartData}>
                <defs>
                  <linearGradient id="creatingGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgb(124 58 237)" stopOpacity={1} />
                    <stop offset="100%" stopColor="rgb(124 58 237)" stopOpacity={0.8} />
                  </linearGradient>
                  <linearGradient id="neutralGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgb(82 82 91)" stopOpacity={1} />
                    <stop offset="100%" stopColor="rgb(82 82 91)" stopOpacity={0.8} />
                  </linearGradient>
                  <linearGradient id="consumingGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgb(239 68 68)" stopOpacity={1} />
                    <stop offset="100%" stopColor="rgb(239 68 68)" stopOpacity={0.8} />
                  </linearGradient>
                </defs>
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
                <YAxis
                  type="number"
                  domain={[0, yAxisMax || 60]}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  width={40}
                  allowDataOverflow={true}
                  tickFormatter={value => {
                  // Show hours/minutes for week view, minutes for today
                    if (yAxisMax && yAxisMax > 60) {
                      const hours = Math.round(value / 60 * 10) / 10
                      return hours > 0 ? `${hours}h` : `${value}m`
                    }
                    return ''
                  }}
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
                          <div className="text-gray-500">Neutral: {data.neutral} min</div>
                          <div className="text-[rgb(239,68,68)]">Consuming: {data.consuming} min</div>
                          <div className="text-gray-600">Offline: {data.offline} min</div>
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
                  dataKey="neutral"
                  stackId="a"
                  fill={chartConfig.neutral.color}
                  radius={[0, 0, 0, 0]}
                  barSize={20}
                />
                <Bar
                  dataKey="creating"
                  stackId="a"
                  fill={chartConfig.creating.color}
                  radius={[4, 4, 0, 0]}
                  barSize={20}
                />
                <Bar
                  dataKey="offline"
                  stackId="a"
                  fill="transparent"
                  radius={[4, 4, 0, 0]}
                  barSize={20}
                />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      <Card className="mt-4" ref={appUsageRef}>
        <CardHeader>
          <CardTitle>App/Website Usage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {isLoading ? (
              <div className="flex h-[200px] items-center justify-center text-muted-foreground">
                Crunching the numbers...
              </div>
            ) : (
              sortedAppUsage
                .filter(app => app.duration >= 1)
                .map((app) => (
                  <div key={app.id} className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                      <AppIcon app={app} size="md" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1">
                          <span className="font-medium">{app.is_browser ? app.app_external_id : app.name}</span>
                          {showAppRatingControls && (
                            <Popover>
                              <PopoverTrigger asChild>
                                <div className="w-[80px]">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className={`h-6 px-2 py-0 text-xs font-medium justify-start ${app.rating >= 4 ? 'text-[rgb(124,58,237)] hover:bg-primary/10' :
                                      app.rating <= 2 ? 'text-[rgb(239,68,68)] hover:bg-destructive/10' :
                                        'text-gray-500 hover:bg-muted'
                                    }`}
                                  >
                                    {app.rating === 5 ? 'High Creation' :
                                      app.rating === 4 ? 'Creation' :
                                        app.rating === 3 ? 'Neutral' :
                                          app.rating === 2 ? 'Consumption' :
                                            'High Consumption'}
                                  </Button>
                                </div>
                              </PopoverTrigger>
                              <PopoverContent className="w-[280px] p-4">
                                <div className="space-y-4">
                                  <div className="relative">
                                    <Slider
                                      defaultValue={[app.rating]}
                                      max={5}
                                      min={1}
                                      step={1}
                                      trackColor={
                                        app.rating >= 4
                                          ? 'bg-[rgb(124,58,237)]/20'
                                          : app.rating <= 2
                                            ? 'bg-[rgb(239,68,68)]/20'
                                            : 'bg-gray-500/20'
                                      }
                                      rangeColor={
                                        app.rating >= 4
                                          ? 'bg-[rgb(124,58,237)]'
                                          : app.rating <= 2
                                            ? 'bg-[rgb(239,68,68)]'
                                            : 'bg-gray-500'
                                      }
                                      thumbBorderColor={
                                        app.rating >= 4
                                          ? 'border-[rgb(124,58,237)]'
                                          : app.rating <= 2
                                            ? 'border-[rgb(239,68,68)]'
                                            : 'border-gray-500'
                                      }
                                      onValueChange={([value]) => {
                                        if (onRatingChange && app.default_tag) {
                                          onRatingChange(app.default_tag.id, value as ActivityRating, tags)
                                        }
                                      }}
                                      className="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4 [&_[role=slider]]:bg-background"
                                    />
                                  </div>
                                </div>
                              </PopoverContent>
                            </Popover>
                          )}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {formatTime(app.duration)}
                        </span>
                      </div>
                      <Progress
                        value={(app.duration / (6 * 60)) * 100}
                        className={
                          app.rating >= 4
                            ? 'bg-[rgb(124,58,237)]/20 [&>div]:bg-[rgb(124,58,237)]' :
                            app.rating <= 2
                              ? 'bg-[rgb(239,68,68)]/20 [&>div]:bg-[rgb(239,68,68)]' :
                              'bg-gray-500/20 [&>div]:bg-gray-500'
                        }
                      />
                    </div>
                  </div>
                ))
            )}
          </div>
        </CardContent>
      </Card>
    </>
  )
}
