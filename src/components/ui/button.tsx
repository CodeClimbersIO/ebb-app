import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { Loader2 } from 'lucide-react'

import { cn } from '@/lib/utils/tailwind.util'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground shadow hover:bg-primary/90',
        destructive:
          'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90',
        outline:
          'border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground',
        secondary:
          'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-10 rounded-md px-8',
        icon: 'h-9 w-9',
      },
      iconSize: {
        4: '[&_svg]:size-4',
        5: '[&_svg]:size-5',
        6: '[&_svg]:size-6',
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      iconSize: 4,
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
  icon?: React.ReactNode
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, iconSize, asChild = false, loading = false, icon, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    
    // When asChild is true, we can't add the loading spinner as it would break the Slot's single child constraint
    // In this case, the parent component should handle the loading state
    if (asChild) {
      return (
        <Comp
          className={cn(buttonVariants({ variant, size, iconSize, className }))}
          ref={ref}
          disabled={disabled || loading}
          {...props}
        >
          {children}
        </Comp>
      )
    }
    
    // Show loading spinner if loading, otherwise show the icon if provided
    const iconElement = loading ? (
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
    ) : icon ? (
      <span className="mr-2">{icon}</span>
    ) : null
    
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, iconSize, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {iconElement}
        {children}
      </Comp>
    )
  },
)
Button.displayName = 'Button'

export { Button, buttonVariants }
