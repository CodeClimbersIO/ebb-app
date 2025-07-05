import { useEffect, useState } from 'react'
import { Layout } from '@/components/Layout'
import { useUsageSummary } from '@/pages/useUsageSummary'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tag } from '@/db/monitor/tagRepo'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { formatTime } from '@/components/UsageSummary'
// Chart imports
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
} from '@/components/ui/chart'
import { MonitorApi } from '@/api/monitorApi/monitorApi'
import { DateTime } from 'luxon'

function getColor(index: number) {
  const colors = [
    'hsl(var(--border))', // purple
    'rgb(239,68,68)',  // red
    'rgb(34,197,94)',  // green
    'rgb(14,165,233)', // sky
    'rgb(250,204,21)', // yellow
    'rgb(244,114,182)', // pink
    'rgb(251,146,60)', // orange
  ]
  return colors[index % colors.length]
}

function TrendIndicator({ trend }: { trend?: { percent: number; direction: 'up' | 'down' | 'none' } }) {
  if (!trend || trend.direction === 'none') return null

  const isUp = trend.direction === 'up'
  const colorClasses = isUp
    ? 'text-green-600 dark:text-green-400'
    : 'text-red-600 dark:text-red-400'

  const ArrowIcon = isUp ? ArrowUpRight : ArrowDownRight

  return (
    <span className={`ml-2 flex items-center font-normal text-xs ${colorClasses}`}
      title={isUp ? 'Increase from previous period' : 'Decrease from previous period'}>
      {trend.percent.toFixed(0)}% <ArrowIcon className="inline w-3 h-3 ml-0.5" strokeWidth={2.5} />
    </span>
  )
}

export default function CategoryDashboardPage () {
  const summary = useUsageSummary()

  // Derive category totals from appUsage
  const categoryTotals: Record<string, { tag: Tag, total: number }> = {}
  // For the chart, aggregate creating/neutral/consuming per category
  const categoryChart: Record<string, {
    tag: Tag,
    creating: number,
    neutral: number,
    consuming: number,
    idle: number,
    offline: number,
    total: number,
  }> = {}

  summary.appUsage.forEach(app => {
    const cat = app.category_tag || { tag_id: 'others', tag_name: 'others' }

    // ---- Totals (for list & stacked bar) ----
    if (!categoryTotals[cat.tag_id]) {
      categoryTotals[cat.tag_id] = {
        tag: {
          id: cat.tag_id,
          name: cat.tag_name,
          tag_type: 'category',
          is_default: false,
          is_blocked: false,
          created_at: '',
          updated_at: '',
          parent_tag_id: null,
        },
        total: 0,
      }
    }
    categoryTotals[cat.tag_id].total += app.duration

    // ---- Chart breakdown ----
    if (!categoryChart[cat.tag_id]) {
      categoryChart[cat.tag_id] = {
        tag: categoryTotals[cat.tag_id].tag,
        creating: 0,
        neutral: 0,
        consuming: 0,
        idle: 0,
        offline: 0,
        total: 0,
      }
    }
    // Determine activity bucket based on app rating
    if (app.rating >= 4) {
      categoryChart[cat.tag_id].creating += app.duration
    } else if (app.rating <= 2) {
      categoryChart[cat.tag_id].consuming += app.duration
    } else {
      categoryChart[cat.tag_id].neutral += app.duration
    }
    categoryChart[cat.tag_id].total += app.duration
  })

  const categoriesArr = Object.values(categoryTotals).sort((a, b) => b.total - a.total)
  const totalTime = categoriesArr.reduce((a, b) => a + b.total, 0)

  // Color map so we use same color everywhere
  const colorMap: Record<string, string> = {}
  categoriesArr.forEach((c, idx) => { colorMap[c.tag.id] = getColor(idx) })

  const topThree = categoriesArr.slice(0, 3)

  // ---- Time-based Category Chart (top N categories) ----
  const TOP_N = 5
  const [categoryTimeline, setCategoryTimeline] = useState<any[]>([])
  const [timelineConfig, setTimelineConfig] = useState<any>({})
  const { date, rangeMode } = summary

  useEffect(() => {
    const fetchTimeline = async () => {
      // Calculate start / end like useUsageSummary
      let start: DateTime, end: DateTime, unit: 'hour' | 'day' | 'week'
      if (rangeMode === 'day') {
        start = DateTime.fromJSDate(date).startOf('day')
        end = DateTime.fromJSDate(date).endOf('day')
        unit = 'hour'
      } else if (rangeMode === 'week') {
        start = DateTime.fromJSDate(date).minus({ days: 6 }).startOf('day')
        end = DateTime.fromJSDate(date).endOf('day')
        unit = 'day'
      } else {
        start = DateTime.fromJSDate(date).minus({ weeks: 4 }).startOf('week')
        end = DateTime.fromJSDate(date).endOf('day')
        unit = 'week'
      }

      const activityStatesDB = await MonitorApi.getActivityStatesWithApps(start, end)
      const activityStates = activityStatesDB.map(state => ({
        ...state,
        apps_json: state.apps ? JSON.parse(state.apps) : []
      }))

      // Determine top N categories across the whole period
      const totalByCat: Record<string, { tag: Tag, total: number }> = {}
      for (const state of activityStates) {
        const duration = DateTime.fromISO(state.end_time).diff(DateTime.fromISO(state.start_time), 'minutes').minutes
        const apps = state.apps_json || []
        const durationPerApp = apps.length ? duration / apps.length : 0
        for (const app of apps) {
          const cat = app.tags?.find((t: Tag) => (t as any).tag_type === 'category') || { tag_id: 'others', tag_name: 'others' }
          if (!totalByCat[cat.tag_id]) {
            totalByCat[cat.tag_id] = {
              tag: { id: cat.tag_id, name: cat.tag_name, tag_type: 'category', is_default: false, is_blocked: false, created_at: '', updated_at: '', parent_tag_id: null },
              total: 0,
            }
          }
          totalByCat[cat.tag_id].total += durationPerApp
        }
      }
      const topCats = Object.values(totalByCat).sort((a, b) => b.total - a.total).slice(0, TOP_N)
      const catIds = topCats.map(c => c.tag.id)

      // Build bucket keys
      const buckets: Record<string, any> = {}
      let current = start
      while (current <= end) {
        let key: string, xAxisLabel: string, timeRange: string
        if (unit === 'hour') {
          key = current.toFormat('yyyy-MM-dd-HH')
          xAxisLabel = [6, 10, 14, 18, 22].includes(current.hour) ? current.toFormat('h a') : ''
          timeRange = `${current.toFormat('h:mm a')} - ${current.plus({ hours: 1 }).toFormat('h:mm a')}`
          current = current.plus({ hours: 1 })
        } else if (unit === 'day') {
          key = current.toISODate()!
          xAxisLabel = current.toFormat('ccc')
          timeRange = current.toFormat('cccc, LLL dd')
          current = current.plus({ days: 1 })
        } else {
          key = current.toFormat('kkkk-WW')
          xAxisLabel = current.startOf('week').toFormat('LLL d')
          timeRange = `Week of ${current.startOf('week').toFormat('LLL dd')}`
          current = current.plus({ weeks: 1 })
        }
        buckets[key] = {
          xAxisLabel,
          timeRange,
          ...catIds.reduce((obj, id) => ({ ...obj, [id]: 0 }), {}),
          others: 0,
        }
      }

      // Aggregate durations into buckets
      for (const state of activityStates) {
        const startState = DateTime.fromISO(state.start_time)
        let key: string
        if (unit === 'hour') key = startState.toFormat('yyyy-MM-dd-HH')
        else if (unit === 'day') key = startState.toISODate()!
        else key = startState.toFormat('kkkk-WW')

        const bucket = buckets[key]
        if (!bucket) continue
        const duration = DateTime.fromISO(state.end_time).diff(startState, 'minutes').minutes
        const apps = state.apps_json || []
        const durationPerApp = apps.length ? duration / apps.length : 0
        for (const app of apps) {
          const cat = app.tags?.find((t: Tag) => (t as any).tag_type === 'category') || { tag_id: 'others', tag_name: 'others' }
          if (catIds.includes(cat.tag_id)) bucket[cat.tag_id] += durationPerApp
          else bucket.others += durationPerApp
        }
      }

      const timelineArr = Object.values(buckets)
      setCategoryTimeline(timelineArr)

      // Build config for legend / colors
      const cfg: any = {}
      topCats.forEach((c, idx) => {
        cfg[c.tag.id] = { label: c.tag.name, color: getColor(idx) }
      })
      cfg.others = { label: 'Other', color: 'hsl(var(--muted-foreground) / 0.4)' }
      setTimelineConfig(cfg)
    }
    fetchTimeline()
  }, [date, rangeMode])

  const yAxisMaxTimeline = categoryTimeline.length > 0 ? Math.max(...categoryTimeline.map(b => {
    return Object.keys(timelineConfig).reduce((sum, key) => sum + (b[key] || 0), 0)
  })) : 60

  // Filter out keys that have no data across the timeline so we don't render empty Bars
  // Determine which categories actually have any usage in the data
  let visibleBarKeys = Object.keys(timelineConfig).filter(key =>
    categoryTimeline.some(bucket => {
      const v = (bucket as any)[key]
      return typeof v === 'number' && v > 0
    })
  )

  // Ensure the "others" category is rendered last so it appears on the top of the stack
  if (visibleBarKeys.includes('others')) {
    visibleBarKeys = [
      ...visibleBarKeys.filter(k => k !== 'others'),
      'others',
    ]
  }

  return (
    <Layout>
      <div className="p-8 max-w-5xl mx-auto">

        {/* Top stacked bar/legend section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Where your time went today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="w-full h-6 rounded overflow-hidden flex">
                {[...categoriesArr].reverse().map((cat) => (
                  <div
                    key={cat.tag.id}
                    style={{ width: `${(Math.ceil(cat.total) / totalTime) * 100}%`, backgroundColor: colorMap[cat.tag.id] }}
                    title={`${cat.tag.name}: ${Math.ceil(cat.total)} min`}
                  />
                ))}
              </div>

              {/* legend */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-4">
                {categoriesArr.map((cat) => (
                  <div key={cat.tag.id} className="flex items-center gap-2">
                    <span className="inline-block w-3 h-3 rounded" style={{ backgroundColor: colorMap[cat.tag.id] }} />
                    <span className="capitalize text-sm">{cat.tag.name}</span>
                    <span className="ml-auto text-sm text-muted-foreground">{Math.ceil(cat.total)} min</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>



        {/* Category breakdown chart */}
        <Card className="mb-8">
          <CardContent className="p-0">
            <div className="relative p-6">
              <ChartContainer config={timelineConfig as any}>
                <BarChart height={200} data={categoryTimeline} margin={{ right: 16 }}>
                  <defs>
                    <linearGradient id="creatingGradientCat" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="rgb(124 58 237)" stopOpacity={1} />
                      <stop offset="100%" stopColor="rgb(124 58 237)" stopOpacity={0.8} />
                    </linearGradient>
                    <linearGradient id="neutralGradientCat" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="rgb(82 82 91)" stopOpacity={1} />
                      <stop offset="100%" stopColor="rgb(82 82 91)" stopOpacity={0.8} />
                    </linearGradient>
                    <linearGradient id="consumingGradientCat" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="rgb(239 68 68)" stopOpacity={1} />
                      <stop offset="100%" stopColor="rgb(239 68 68)" stopOpacity={0.8} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeOpacity={0.8} />
                  <XAxis dataKey="xAxisLabel" tickLine={false} tickMargin={10} axisLine={false} interval={0} />
                  <YAxis
                    type="number"
                    domain={[0, yAxisMaxTimeline || 60]}
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    width={40}
                    allowDataOverflow={true}
                    tickFormatter={value => {
                      // Show hours/minutes for week view, minutes for today
                        if (yAxisMaxTimeline && yAxisMaxTimeline > 60) {
                          const hours = Math.round(value / 60 * 10) / 10
                          return hours > 0 ? `${hours}h` : `${value}m`
                        }
                        return ''
                      }}
                  />
                  <ChartTooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null
                      const data = payload[0].payload as any
                      return (
                        <div className="rounded-lg border bg-background p-2 shadow-md">
                          <div className="mb-2 font-medium">{data.timeRange}</div>
                          <div className="space-y-1">
                            {Object.keys(timelineConfig).map(key => (
                              <div key={key} className="flex justify-between" style={{ color: timelineConfig[key].color }}>
                                <span>{timelineConfig[key].label}:</span>
                                <span>{Math.round(data[key] || 0)} min</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    }}
                  />
                  <ChartLegend content={<ChartLegendContent />} />
                  {visibleBarKeys.map((key, idx, arr) => (
                    <Bar
                      key={key}
                      dataKey={key}
                      stackId="a"
                      fill={timelineConfig[key].color}
                      radius={idx === 0 ? [0,0,4,4] : idx === arr.length - 1 ? [4,4,0,0] : [0,0,0,0]}
                      barSize={20}
                    />
                  ))}
                </BarChart>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>

        {/* Metrics cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <TooltipProvider>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{summary.totalTimeLabel}</CardTitle>
              </CardHeader>
              <CardContent>
                <Tooltip>
                  <TooltipTrigger>
                    <div className="text-2xl font-bold flex items-center">
                      {formatTime(summary.totalTime.value)}
                      <TrendIndicator trend={summary.totalTime.trend} />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{summary.totalTimeTooltip}</p>
                  </TooltipContent>
                </Tooltip>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Time Creating</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold flex items-center">
                  {Math.round(summary.totalCreating.value / 60)}h {Math.round(summary.totalCreating.value % 60)}m
                  <TrendIndicator trend={summary.totalCreating.trend} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Top Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  {topThree.map(cat => (
                    <div key={cat.tag.id} className="w-8 h-8 rounded-lg" style={{ backgroundColor: colorMap[cat.tag.id] }} title={cat.tag.name} />
                  ))}
                </div>
              </CardContent>
            </Card>
          </TooltipProvider>
        </div>

        {/* Category Usage list */}
        <Card>
          <CardHeader>
            <CardTitle>Category Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {categoriesArr.map(cat => (
                <div key={cat.tag.id} className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-lg" style={{ backgroundColor: colorMap[cat.tag.id] }} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="capitalize font-medium">{cat.tag.name}</span>
                      <span className="text-sm text-muted-foreground">{Math.ceil(cat.total)} min</span>
                    </div>
                    <Progress
                      value={(cat.total / totalTime) * 100}
                      className="bg-muted [&>div]:bg-primary"
                      style={{ ['--tw-gradient-from' as any]: colorMap[cat.tag.id], ['--tw-gradient-to' as any]: colorMap[cat.tag.id] }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}
