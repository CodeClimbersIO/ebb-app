// credit to pqoqubbw for the icon animation: https://github.com/pqoqubbw/icons

import { useAnimation } from 'framer-motion'
import type { ForwardedRef } from 'react'
import { useCallback, useImperativeHandle, useRef } from 'react'

export interface AnimationHandle {
  startAnimation: () => void
  stopAnimation: () => void
}

interface UseMouseOverAnimationProps {
  ref: ForwardedRef<AnimationHandle>
  onMouseEnter?: (e: React.MouseEvent<HTMLDivElement>) => void
  onMouseLeave?: (e: React.MouseEvent<HTMLDivElement>) => void
}

export function useMouseOverAnimation({
  ref,
  onMouseEnter,
  onMouseLeave
}: UseMouseOverAnimationProps) {
  const controls = useAnimation()
  const isControlledRef = useRef(false)

  useImperativeHandle(ref, () => {
    isControlledRef.current = true

    return {
      startAnimation: () => controls.start('animate'),
      stopAnimation: () => controls.start('normal')
    }
  })

  const handleMouseEnter = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isControlledRef.current) {
        controls.start('animate')
      } else {
        onMouseEnter?.(e)
      }
    },
    [controls, onMouseEnter]
  )

  const handleMouseLeave = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isControlledRef.current) {
        controls.start('normal')
      } else {
        onMouseLeave?.(e)
      }
    },
    [controls, onMouseLeave]
  )

  return {
    controls,
    handleMouseEnter,
    handleMouseLeave
  }
} 
