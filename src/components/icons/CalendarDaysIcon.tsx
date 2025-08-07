import type { Transition, Variants } from 'motion/react'
import { AnimatePresence, motion } from 'motion/react'
import type { HTMLAttributes } from 'react'
import { forwardRef } from 'react'
import { cn } from '@/lib/utils/tailwind.util'
import type { AnimationHandle } from '@/hooks/useMouseOverAnimation'
import { useMouseOverAnimation } from '@/hooks/useMouseOverAnimation'

export type CalendarDaysIconHandle = AnimationHandle

interface CalendarDaysIconProps extends HTMLAttributes<HTMLDivElement> {
  size?: number
}

const DOTS = [
  { cx: 8, cy: 14 },
  { cx: 12, cy: 14 },
  { cx: 16, cy: 14 },
  { cx: 8, cy: 18 },
  { cx: 12, cy: 18 },
  { cx: 16, cy: 18 },
]

const defaultTransition: Transition = {
  duration: 0.4,
  opacity: { duration: 0.2 }
}

const dotVariants: Variants = {
  normal: {
    opacity: 1
  },
  animate: (i: number) => ({
    opacity: [1, 0.3, 1],
    transition: {
      delay: i * 0.1,
      duration: 0.4,
      times: [0, 0.5, 1]
    }
  })
}

const CalendarDaysIcon = forwardRef<CalendarDaysIconHandle, CalendarDaysIconProps>(
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
          <path d="M8 2v4" />
          <path d="M16 2v4" />
          <rect width="18" height="18" x="3" y="4" rx="2" />
          <path d="M3 10h18" />
          <AnimatePresence>
            {DOTS.map((dot, index) => (
              <motion.circle
                key={`${dot.cx}-${dot.cy}`}
                cx={dot.cx}
                cy={dot.cy}
                r="1"
                fill="currentColor"
                stroke="none"
                initial="normal"
                variants={dotVariants}
                transition={defaultTransition}
                animate={controls}
                custom={index}
              />
            ))}
          </AnimatePresence>
        </svg>
      </div>
    )
  }
)

CalendarDaysIcon.displayName = 'CalendarDaysIcon'

export { CalendarDaysIcon }
