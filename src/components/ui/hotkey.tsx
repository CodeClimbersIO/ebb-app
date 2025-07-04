import { type ReactNode } from 'react'

type HotkeySize = 'sm' | 'md' | 'lg'
type HotkeyVariant = 'selected' | 'unselected'

interface HotkeyProps {
  children: ReactNode
  size?: HotkeySize
  variant?: HotkeyVariant
  pressed?: boolean
  color?: string // Custom color class (e.g., 'bg-red-500', 'bg-primary')
}

const sizeClasses: Record<HotkeySize, string> = {
  sm: 'h-5 px-1',
  md: 'h-6 px-1.5',
  lg: 'h-7 px-2'
}

const textSizeClasses = (isModifier: boolean): Record<HotkeySize, string> => ({
  sm: isModifier ? 'text-sm' : 'text-xs',
  md: isModifier ? 'text-base' : 'text-sm',
  lg: isModifier ? 'text-lg' : 'text-base'
})

const variantClasses: Record<HotkeyVariant, string> = {
  selected: 'bg-violet-900 border-violet-900 text-primary-foreground',
  unselected: 'bg-muted border-muted text-muted-foreground'
}

const pressedClasses: Record<HotkeyVariant, string> = {
  selected: 'bg-violet-950 border-violet-950 shadow-inner transform scale-95',
  unselected: 'bg-muted/80 border-muted/80 shadow-inner transform scale-95'
}

// Color mappings for different notification types
const colorVariants = {
  primary: {
    base: 'bg-primary border-primary text-primary-foreground',
    pressed: 'bg-primary/80 border-primary/80 text-primary-foreground shadow-inner transform scale-95'
  },
  red: {
    base: 'bg-red-500 border-red-500 text-white',
    pressed: 'bg-red-600 border-red-600 text-white shadow-inner transform scale-95'
  },
  green: {
    base: 'bg-green-500 border-green-500 text-white',
    pressed: 'bg-green-600 border-green-600 text-white shadow-inner transform scale-95'
  },
  amber: {
    base: 'bg-amber-500 border-amber-500 text-white',
    pressed: 'bg-amber-600 border-amber-600 text-white shadow-inner transform scale-95'
  },
  default: {
    base: 'bg-muted border-muted text-muted-foreground',
    pressed: 'bg-muted/80 border-muted/80 text-muted-foreground shadow-inner transform scale-95'
  }
}

export function Hotkey({ 
  children, 
  size = 'md', 
  variant = 'selected',
  pressed = false,
  color
}: HotkeyProps) {
  const isModifier = ['⌘', '⌃', '⌥', '⇧'].includes(children as string)
  
  // Use custom color if provided, otherwise fall back to variant classes
  const getColorClasses = () => {
    if (color && color in colorVariants) {
      const colorVariant = colorVariants[color as keyof typeof colorVariants]
      return pressed ? colorVariant.pressed : colorVariant.base
    }
    
    return pressed ? pressedClasses[variant] : variantClasses[variant]
  }
  
  return (
    <kbd className={`
      rounded border font-mono inline-flex items-center
      transition-all duration-150 ease-in-out
      ${getColorClasses()}
      ${sizeClasses[size]}
      ${pressed ? '' : 'shadow-sm'}
    `}>
      <span className={`${textSizeClasses(isModifier)[size]} font-bold`}>
        {children}
      </span>
    </kbd>
  )
} 
