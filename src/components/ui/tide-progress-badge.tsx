import { TideCompletedBadge } from '@/components/icons/TideCompletedBadge'

interface TideProgressBadgeProps {
  id: string
  label: string
  fillPercentage: number
  isCompleted: boolean
  isSelected: boolean
  isFuture: boolean
  onClick: (e: React.MouseEvent) => void
  tooltip: string
}

export const TideProgressBadge = ({
  id,
  label,
  fillPercentage,
  isCompleted,
  isSelected,
  isFuture,
  onClick,
  tooltip,
}: TideProgressBadgeProps) => {
  return (
    <div
      className={`flex flex-col items-center gap-1 transition-opacity ${isFuture ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:opacity-80'}`}
      onClick={onClick}
      title={tooltip}
    >
      <div className={'relative w-5 h-5'}>
        {isCompleted ? (
          <TideCompletedBadge id={id} />
        ) : (
          <svg className="w-full h-full -rotate-90" viewBox="0 0 32 32">
            <circle cx="16" cy="16" r="14" fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
            {fillPercentage > 0 && (
              <circle
                cx="16"
                cy="16"
                r="14"
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="3"
                strokeDasharray={`${(fillPercentage / 100) * 87.96} 87.96`}
                opacity={isFuture ? 0.3 : 1}
              />
            )}
          </svg>
        )}
      </div>
      <span className={`text-xs ${isSelected ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
        {label}
      </span>
    </div>
  )
}
