import type { Variants } from 'framer-motion'
import { motion } from 'framer-motion'
import type { HTMLAttributes } from 'react'
import { forwardRef } from 'react'
import { cn } from '@/lib/utils/tailwind.util'
import type { AnimationHandle } from '@/hooks/useMouseOverAnimation'
import { useMouseOverAnimation } from '@/hooks/useMouseOverAnimation'

export type GlobeIconHandle = AnimationHandle

interface GlobeIconProps extends HTMLAttributes<HTMLDivElement> {
  size?: number
}

const circleVariants: Variants = {
  normal: {
    scale: 1,
    rotate: 0,
    transition: {
      type: 'spring',
      stiffness: 200,
      damping: 13
    }
  },
  animate: {
    scale: [1, 1.1, 1],
    rotate: [0, 10, 0],
    transition: {
      type: 'spring',
      stiffness: 200,
      damping: 13
    }
  }
}

const GlobeIcon = forwardRef<GlobeIconHandle, GlobeIconProps>(
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
          <motion.circle
            cx="12"
            cy="12"
            r="10"
            variants={circleVariants}
            initial="normal"
            animate={controls}
          />
          <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
          <path d="M2 12h20" />
        </svg>
      </div>
    )
  }
)

GlobeIcon.displayName = 'GlobeIcon'

export { GlobeIcon } 
