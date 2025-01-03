import { Card, CardContent } from "@/components/ui/card"
import { InfoIcon as InfoCircle } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  change?: {
    value: number
    positive: boolean
  }
}

function StatCard({ title, value, change }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">{title}</span>
          <InfoCircle className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-semibold">{value}</span>
          {change && (
            <span
              className={`text-sm ${
                change.positive ? "text-green-500" : "text-red-500"
              }`}
            >
              {change.positive ? "↑" : "↓"} {Math.abs(change.value)}%
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export function StatsCards() {
  return (
    <div className="grid grid-cols-3 gap-4">
      <StatCard
        title="Flow Sessions (30d)"
        value="52"
        change={{ value: 20.4, positive: true }}
      />
      <StatCard
        title="Avg Flow Score (30d)"
        value="5.3"
        change={{ value: 20.4, positive: false }}
      />
      <StatCard
        title="Time in Flow (30d)"
        value="140h"
        change={{ value: 5.4, positive: true }}
      />
    </div>
  )
}