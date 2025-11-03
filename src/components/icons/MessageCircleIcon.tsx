import type { Transition, Variants } from 'motion/react'
import { motion } from 'motion/react'
import type { HTMLAttributes } from 'react'
import { forwardRef } from 'react'
import { cn } from '@/lib/utils/tailwind.util'
import type { AnimationHandle } from '@/hooks/useMouseOverAnimation'
import { useMouseOverAnimation } from '@/hooks/useMouseOverAnimation'

export type MessageCircleIconHandle = AnimationHandle

interface MessageCircleIconProps extends HTMLAttributes<HTMLDivElement> {
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

const MessageCircleIcon = forwardRef<MessageCircleIconHandle, MessageCircleIconProps>(
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
          <motion.path
            d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"
            variants={pathVariants}
            transition={defaultTransition}
            animate={controls}
          />
        </svg>
      </div>
    )
  }
)

MessageCircleIcon.displayName = 'MessageCircleIcon'

export { MessageCircleIcon }
