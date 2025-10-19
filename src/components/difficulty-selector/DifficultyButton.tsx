import { AnalyticsButton } from '@/components/ui/analytics-button'
import { cn } from '@/lib/utils/tailwind.util'
import { KeyRound } from 'lucide-react'
import { SignalBars } from './SignalBars'
import { DifficultyOption, DifficultyValue } from './types'
import { usePaywall } from '@/hooks/usePaywall'

interface DifficultyButtonProps {
  difficulty: DifficultyOption
  isSelected: boolean
  isDisabled: boolean
  onChange: (value: DifficultyValue) => void
}

export function DifficultyButton({
  difficulty,
  isSelected,
  isDisabled,
  onChange
}: DifficultyButtonProps) {
  const { openPaywall } = usePaywall()

  return (
    <div
      key={difficulty.value}
      className="relative"
    >
      <AnalyticsButton
        analyticsEvent='difficulty_selector_clicked'
        variant={isSelected ? 'secondary' : 'ghost'}
        className={cn(
          'flex flex-col items-start h-auto px-2 py-1.5 text-sm gap-0.5 w-full',
          isSelected && difficulty.color,
          isDisabled && 'opacity-50'
        )}
        onClick={(e) => {
          e.stopPropagation()
          if (!isDisabled) {
            onChange(difficulty.value)
          }
        }}
        disabled={isDisabled}
      >
        <div className="flex items-center gap-2 w-full">
          <div className="w-4">
            <SignalBars level={difficulty.level} />
          </div>
          <span>{difficulty.label}</span>
        </div>
        <span className="text-xs text-muted-foreground pl-6">
          {difficulty.description}
        </span>
      </AnalyticsButton>
      {difficulty.value === 'hard' && isDisabled && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2">
          <AnalyticsButton
            analyticsEvent='paywall_dialog_hard_clicked'
            variant="ghost"
            size="icon"
            className="h-4 w-4 p-0 hover:bg-transparent"
            onClick={openPaywall}
          >
            <KeyRound className="h-3 w-3 text-yellow-500" />
          </AnalyticsButton>
        </div>
      )}
    </div>
  )
} 
