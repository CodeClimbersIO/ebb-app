import type { Variants } from 'framer-motion'
import { motion } from 'framer-motion'
import type { HTMLAttributes } from 'react'
import { forwardRef } from 'react'
import { cn } from '@/lib/utils/tailwind.util'
import type { AnimationHandle } from '@/hooks/useMouseOverAnimation'
import { useMouseOverAnimation } from '@/hooks/useMouseOverAnimation'

export type UsersIconHandle = AnimationHandle

interface UsersIconProps extends HTMLAttributes<HTMLDivElement> {
  size?: number
}

const pathVariants: Variants = {
  normal: {
    translateX: 0,
    transition: {
      type: 'spring',
      stiffness: 200,
      damping: 13
    }
  },
  animate: {
    translateX: [-6, 0],
    transition: {
      delay: 0.1,
      type: 'spring',
      stiffness: 200,
      damping: 13
    }
  }
}

const UsersIcon = forwardRef<UsersIconHandle, UsersIconProps>(
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
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <motion.path
            d="M22 21v-2a4 4 0 0 0-3-3.87"
            variants={pathVariants}
            initial="normal"
            animate={controls}
          />
          <motion.path
            d="M16 3.13a4 4 0 0 1 0 7.75"
            variants={pathVariants}
            initial="normal"
            animate={controls}
          />
        </svg>
      </div>
    )
  }
)

UsersIcon.displayName = 'UsersIcon'

export { UsersIcon }
