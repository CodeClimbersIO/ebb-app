import { useState } from 'react'

interface StatusBadgeProps {
  color: 'green' | 'purple'
  count: number
  statusName: string
}

function StatusBadge({ color, count, statusName }: StatusBadgeProps) {
  const colorClasses = {
    green: {
      bg: 'bg-green-500',
      shadow: 'shadow-green-500/50'
    },
    purple: {
      bg: 'bg-primary',
      shadow: 'shadow-primary/50'
    }
  }

  const colorClass = colorClasses[color]

  return (
    <div className="flex items-center gap-2 px-1 py-1 bg-secondary/20 rounded-full">
      <div className="relative">
        <div className={`w-2 h-2 ${colorClass.bg} rounded-full`}></div>
        <div className={`absolute inset-0 w-2 h-2 ${colorClass.bg} rounded-full animate-ping opacity-75`}></div>
        <div className={`absolute inset-0 w-2 h-2 ${colorClass.bg} rounded-full shadow-lg ${colorClass.shadow} animate-pulse`}></div>
      </div>
      <span className="font-semibold text-sm">
        {count} {statusName}
      </span>
    </div>
  )
}

export function SocialStatusSummary() {
  // Mock state for status counts
  const [statusCounts] = useState({
    online: 42,
    flowing: 17,
  })

  return (
    <div className="flex items-center gap-4 pl-6">
      <StatusBadge color="green" count={statusCounts.online} statusName="Online" />
      <StatusBadge color="purple" count={statusCounts.flowing} statusName="Flowing" />
    </div>
  )
} 
