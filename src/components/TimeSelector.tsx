import * as React from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'
import { AnalyticsButton } from '@/components/ui/analytics-button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

const defaultPresetTimes = [
  { value: 'no-limit', label: 'No limit' },
  { value: '15', label: '15 minutes' },
  { value: '30', label: '30 minutes' },
  { value: '60', label: '1 hour' },
  { value: '90', label: '1 hour 30 minutes' },
  { value: '120', label: '2 hours' },
]

const parseTimeInput = (input: string): number | null => {
  const cleaned = input.toLowerCase().replace(/\s+/g, ' ').trim()

  // Special case for "quick call" :)
  if (cleaned === 'quick call') {
    return 260
  }
  
  // Handle hour:minute format (e.g., 1:15)
  if (cleaned.includes(':')) {
    const [hours, minutes] = cleaned.split(':')
    const parsedHours = parseInt(hours)
    const parsedMinutes = parseInt(minutes)
    if (isNaN(parsedHours) || isNaN(parsedMinutes)) return null
    return (parsedHours * 60) + parsedMinutes
  }
  
  // Handle variations of hours and minutes combined (e.g., "1 hour 30 min", "1hr30m", "1 hour and 30 minutes")
  const combinedPattern = /^(\d+)\s*(h|hr|hour|hours)?\s*(?:and)?\s*(\d+)?\s*(m|min|mins|minute|minutes)?$/i
  const combinedMatch = cleaned.match(combinedPattern)
  if (combinedMatch) {
    const hours = combinedMatch[1] ? parseInt(combinedMatch[1]) : 0
    const minutes = combinedMatch[3] ? parseInt(combinedMatch[3]) : 0
    if (combinedMatch[2] && combinedMatch[4]) { // Both hours and minutes specified
      return (hours * 60) + minutes
    } else if (combinedMatch[2]) { // Only hours specified
      return hours * 60
    } else if (combinedMatch[4] || !combinedMatch[2]) { // Only minutes specified or bare number
      return hours + minutes // In this case, first number is treated as minutes
    }
  }
  
  // Handle variations of hours (e.g., "1 hour", "2 hours", "1h", "2hrs")
  const hourPattern = /^(\d+)\s*(h|hr|hrs|hour|hours)$/i
  const hourMatch = cleaned.match(hourPattern)
  if (hourMatch) {
    const hours = parseInt(hourMatch[1])
    return hours * 60
  }
  
  // Handle variations of minutes (e.g., "30 minutes", "45 min", "45m", "45mins")
  const minutePattern = /^(\d+)\s*(m|min|mins|minute|minutes)$/i
  const minuteMatch = cleaned.match(minutePattern)
  if (minuteMatch) {
    return parseInt(minuteMatch[1])
  }
  
  // Handle bare numbers as minutes
  const numberPattern = /^(\d+)$/
  const numberMatch = cleaned.match(numberPattern)
  if (numberMatch) {
    return parseInt(numberMatch[1])
  }
  
  return null
}

const formatMinutes = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes} minutes`
  }
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  if (remainingMinutes === 0) {
    return hours === 1 ? '1 hour' : `${hours} hours`
  }
  return `${hours} hour${hours > 1 ? 's' : ''} ${remainingMinutes} minutes`
}

interface TimeSelectorProps {
  value: number | null
  onChange: (value: number | null) => void
  presets?: Array<{ value: string; label: string }>
}

export function TimeSelector({ value: externalValue, onChange, presets = defaultPresetTimes }: TimeSelectorProps) {
  const [open, setOpen] = React.useState(false)
  const [value, setValue] = React.useState<string>(externalValue?.toString() || 'no-limit')
  const [inputValue, setInputValue] = React.useState('')
  const [customOption, setCustomOption] = React.useState<{ value: string; label: string } | null>(null)

  // Update internal value when external value changes
  React.useEffect(() => {
    if (externalValue === null) {
      setValue('no-limit')
      setCustomOption(null) // Reset custom option when no-limit is selected
    } else {
      const stringValue = externalValue.toString()
      setValue(stringValue)
      // If the value doesn't match any preset, create a custom option
      if (!presets.some(time => time.value === stringValue)) {
        setCustomOption({
          value: stringValue, // Keep the numeric value for onChange
          label: formatMinutes(externalValue)
        })
      } else {
        setCustomOption(null) // Ensure custom option is cleared if matching preset
      }
    }
  }, [externalValue, presets])

  const displayOptions = React.useMemo(() => {
    const options = [...presets]
    const parsedInput = parseTimeInput(inputValue)
    
    const filtered = options.filter(option => {
      // Check if the label includes the input text
      if (option.label.toLowerCase().includes(inputValue.toLowerCase())) {
        return true
      }
      
      // If input is a valid duration, check if it matches the preset's duration
      if (parsedInput !== null && option.value !== 'no-limit') {
        const presetMinutes = parseTimeInput(option.value)
        return presetMinutes === parsedInput
      }
      
      return false
    })
    
    if (customOption) {
      return [customOption, ...filtered]
    }
    return filtered
  }, [customOption, inputValue, presets])

  const handleInputChange = (input: string) => {
    setInputValue(input)
    
    // Try to parse for custom duration
    const parsedMinutes = parseTimeInput(input)
    if (parsedMinutes !== null) {
      const matchingPreset = presets.find(preset =>
        parseTimeInput(preset.value) === parsedMinutes
      )
      
      if (matchingPreset) {
        setValue(matchingPreset.value)
        setCustomOption(null)
      } else {
        const formattedTime = formatMinutes(parsedMinutes)
        setCustomOption({
          value: parsedMinutes.toString(),
          label: formattedTime
        })
        setValue(parsedMinutes.toString())
      }
    }
  }

  const handleSelect = (currentValue: string) => {
    setValue(currentValue)
    setOpen(false)
    setInputValue('') // Clear input when selection is made

    if (currentValue === 'no-limit') {
      onChange(null)
    } else {
      const numericValue = Number(currentValue)
      if (isNaN(numericValue)) {
        // Handle unexpected string values by trying to parse them
        const parsed = parseTimeInput(currentValue)
        onChange(parsed)
      } else {
        onChange(numericValue)
      }
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <AnalyticsButton
          analyticsEvent='focus_session_duration_selector_clicked'
          variant='outline'
          role='combobox'
          aria-expanded={open}
          className='w-full justify-between'
        >
          {value
            ? presets.find((time) => time.value === value)?.label ||
              (customOption?.value === value ? customOption.label : 'Select duration')
            : 'Select duration'}
          <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
        </AnalyticsButton>
      </PopoverTrigger>
      <PopoverContent className='w-[--radix-popover-trigger-width] p-0'>
        <Command shouldFilter={false}>
          <CommandInput
            placeholder='Enter duration (e.g., 15 min, 1:15, 2h)'
            value={inputValue}
            onValueChange={handleInputChange}
          />
          <CommandList>
            <CommandEmpty>
              <div className='text-muted-foreground'>
                <div>Please enter a valid duration</div>
                <div>(15 min, 1:15, 2h...)</div>
              </div>
            </CommandEmpty>
            <CommandGroup>
              {displayOptions.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  onSelect={() => handleSelect(option.value)}
                >
                  <Check
                    className={`mr-2 h-4 w-4 ${
                      value === option.value ? 'opacity-100' : 'opacity-0'
                    }`}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
} 
