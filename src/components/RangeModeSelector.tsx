import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/tailwind.util'

export type RangeMode = 'day' | 'week' | 'month'

interface RangeModeOption {
  value: RangeMode
  label: string
}

interface RangeModeSelectorProps {
  value: RangeMode
  onChange: (value: RangeMode) => void
  className?: string
}

export function RangeModeSelector({ value, onChange, className }: RangeModeSelectorProps) {
  const rangeOptions: RangeModeOption[] = [
    { value: 'day', label: 'Day' },
    { value: 'week', label: 'Week' },
    { value: 'month', label: 'Month' },
  ]

  const selectedOption = rangeOptions.find(option => option.value === value) || rangeOptions[0]

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'justify-start text-left font-normal',
            className
          )}
        >
          <div className="flex items-center gap-2">
            {selectedOption.label}
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-1" align="end" sideOffset={4}>
        <div className="flex flex-col">
          {rangeOptions.map((option) => (
            <Button
              key={option.value}
              variant={value === option.value ? 'default' : 'ghost'}
              size="sm"
              className="justify-start px-3 py-1 text-xs font-medium rounded-lg"
              onClick={() => onChange(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
