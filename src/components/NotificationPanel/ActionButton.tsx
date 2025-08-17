import { AnalyticsButton } from '@/components/ui/analytics-button'
import { Hotkey } from '@/components/ui/hotkey'
import { cn } from '@/lib/utils/tailwind.util'
import { AnalyticsEvent } from '../../lib/analytics'

interface ActionButtonProps {
  buttonText: string
  buttonState: 'idle' | 'processing' | 'success'
  isDisabled?: boolean
  iconColor: string
  shortcutParts: string[]
  pressedKeys: Set<string>
  onClick: () => void
  analyticsEvent: AnalyticsEvent
}

const getHotkeyColor = (iconColor: string): string => {
  if (iconColor.includes('primary')) return 'primary'
  if (iconColor.includes('red')) return 'red'
  if (iconColor.includes('green')) return 'green'
  if (iconColor.includes('amber')) return 'amber'
  return 'primary'
}

export const ActionButton = ({
  buttonText,
  buttonState,
  isDisabled = false,
  iconColor,
  shortcutParts,
  pressedKeys,
  onClick,
  analyticsEvent
}: ActionButtonProps) => {
  return (
    <AnalyticsButton
      variant="outline"
      size="sm"
      className={cn(
        'h-8 px-3 text-xs flex items-center gap-2 transition-all duration-200',
        buttonState === 'idle' && 'hover:bg-accent hover:text-accent-foreground',
        buttonState === 'success' && 'bg-green-500/20 text-green-400 border-green-500/50'
      )}
      onClick={onClick}
      disabled={buttonState !== 'idle' || isDisabled}
      analyticsEvent={analyticsEvent}
    >
      <span>
        {buttonState === 'idle' && buttonText}
        {buttonState === 'success' && 'Success!'}
      </span>
      {buttonState === 'idle' && !isDisabled && shortcutParts.length > 0 && shortcutParts.some(part => part) && (
        <div className="flex items-center gap-1">
          {shortcutParts.map((part, index) => {
            // Map display part back to database format to check if it's pressed
            const dbPart = (() => {
              switch (part) {
              case '⌘': return 'CommandOrControl'
              case '⌃': return 'Control'
              case '⌥': return 'Option'
              case '⇧': return 'Shift'
              case '↵': return 'ENTER'
              case '⎵': return 'SPACE'
              default: return part
              }
            })()
            
            const isThisKeyPressed = pressedKeys.has(dbPart)
            
            return (
              <Hotkey 
                key={index} 
                size="sm" 
                pressed={isThisKeyPressed}
                color={getHotkeyColor(iconColor)}
              >
                {part}
              </Hotkey>
            )
          })}
        </div>
      )}
    </AnalyticsButton>
  )
}
