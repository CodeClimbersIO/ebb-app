import { type ReactNode } from 'react'

type HotkeySize = 'sm' | 'md' | 'lg'
type HotkeyVariant = 'selected' | 'unselected'

interface HotkeyProps {
  children: ReactNode
  size?: HotkeySize
  variant?: HotkeyVariant
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

export function Hotkey({ 
  children, 
  size = 'md', 
  variant = 'selected' 
}: HotkeyProps) {
  const isModifier = ['⌘', '⌃', '⌥', '⇧'].includes(children as string)
  
  return (
    <kbd className={`
      rounded border ${variantClasses[variant]}
      ${sizeClasses[size]} 
      font-mono inline-flex items-center
    `}>
      <span className={`${textSizeClasses(isModifier)[size]} font-bold`}>
        {children}
      </span>
    </kbd>
  )
} 
