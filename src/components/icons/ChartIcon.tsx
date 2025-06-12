import type { Transition, Variants } from 'motion/react'
import { motion } from 'motion/react'
import type { HTMLAttributes } from 'react'
import { forwardRef } from 'react'
import { cn } from '@/lib/utils/tailwind.util'
import type { AnimationHandle } from '@/hooks/useMouseOverAnimation'
import { useMouseOverAnimation } from '@/hooks/useMouseOverAnimation'

export type ChartIconHandle = AnimationHandle

interface ChartIconProps extends HTMLAttributes<HTMLDivElement> {
  size?: number
}

const defaultTransition: Transition = {
  duration: 0.6,
  opacity: { duration: 0.2 }
}

const pathVariants: Variants = {
  normal: {
    pathLength: 1,
    opacity: 1
  },
  animate: {
    opacity: [0, 1],
    pathLength: [0, 1]
  }
}

const ChartIcon = forwardRef<ChartIconHandle, ChartIconProps>(
  ({ onMouseEnter, onMouseLeave, className, size = 28, ...props }, ref) => {
    const { controls, handleMouseEnter, handleMouseLeave } = useMouseOverAnimation({
      ref,
      onMouseEnter,
      onMouseLeave
    })

    return (
      <div
        className={cn(
          'cursor-pointer select-none p-2 hover:bg-accent rounded-md transition-colors duration-200 flex items-center justify-center',
          className
        )}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        {...props}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 3v18h18" />
          <motion.path
            d="M7 12l4-4 4 4 4-4"
            variants={pathVariants}
            transition={defaultTransition}
            animate={controls}
          />
        </svg>
      </div>
    )
  }
)

ChartIcon.displayName = 'ChartIcon'

export { ChartIcon } 
