import { Area, AreaChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts'
import { ChartContainer } from '@/components/ui/chart'
import { getFlowScoreColor } from '@/lib/utils/flow'

interface LiveFlowChartProps {
  data: {
    time: Date
    value: number
    appSwitches: number
    topActivity: string
  }[]
  flowScore: number
}

export function LiveFlowChart({ data, flowScore }: LiveFlowChartProps) {
  const color = getFlowScoreColor(flowScore)

  return (
    <ChartContainer
      className="h-[300px] w-full"
      config={{
        value: {
          label: 'Flow Score',
          color: color
        },
        appSwitches: {
          label: 'App Switches',
          color: color
        }
      }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ left: 40, right: 20, top: 20, bottom: 30 }}
        >
          <defs>
            <linearGradient id={`flowGradient-${flowScore}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.8} />
              <stop offset="95%" stopColor={color} stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={true} horizontal={true} />
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'var(--muted-foreground)', dy: 10 }}
          />
          <YAxis
            domain={[0, 10]}
            ticks={[0, 2.5, 5, 7.5, 10]}
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'var(--muted-foreground)' }}
            label={{
              value: 'Flow Score',
              angle: -90,
              position: 'insideLeft',
              style: { fill: 'var(--muted-foreground)' }
            }}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null
              const currentData = payload[0].payload

              // Special tooltip only for the rightmost (live) point
              if (currentData === data[data.length - 1]) {
                return (
                  <div className="rounded-lg border bg-background p-2 shadow-sm">
                    <div className="text-sm text-muted-foreground">
                      Calculating new flow score every 10 minutes...
                    </div>
                  </div>
                )
              }

              // Regular tooltip content for all other points
              return (
                <div className="rounded-lg border bg-background p-2 shadow-sm">
                  <div className="font-medium mb-2">
                    {currentData.time.toLocaleTimeString([], {
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true
                    })}
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between gap-8">
                      <span className="text-muted-foreground">Flow Score</span>
                      <span className="font-medium">{currentData.value.toFixed(1)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-8">
                      <span className="text-muted-foreground">App Switches</span>
                      <span className="font-medium">{currentData.appSwitches}</span>
                    </div>
                    <div className="flex items-center justify-between gap-8">
                      <span className="text-muted-foreground">Top Activity</span>
                      <span className="font-medium">{currentData.topActivity}</span>
                    </div>
                  </div>
                </div>
              )
            }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            fill={`url(#flowGradient-${flowScore})`}
            strokeWidth={2}
            dot={(props) => {
              const isLast = props.index === data.length - 1
              if (!isLast) return <g key={`empty-dot-${props.index}`} />

              return (
                <g key={`dot-${props.index}`}>
                  <circle
                    cx={props.cx}
                    cy={props.cy}
                    r={4}
                    fill={color}
                  />
                  <circle
                    cx={props.cx}
                    cy={props.cy}
                    r={4}
                    fill="none"
                    stroke={color}
                    strokeWidth={2}
                    opacity={0.6}
                  >
                    <animate
                      attributeName="r"
                      from="4"
                      to="12"
                      dur="1.5s"
                      begin="0s"
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="opacity"
                      from="0.6"
                      to="0"
                      dur="1.5s"
                      begin="0s"
                      repeatCount="indefinite"
                    />
                  </circle>
                </g>
              )
            }}
            activeDot={(props) => (
              <circle
                cx={props.cx}
                cy={props.cy}
                r={4}
                fill={color}
              />
            )}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
} 
