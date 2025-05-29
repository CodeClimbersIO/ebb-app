import { useEffect, useRef } from 'react'
import createGlobe, { type COBEOptions } from 'cobe'

const locationToAngles = (lat: number, long: number): [number, number] => {
  return [Math.PI - ((long * Math.PI) / 180 - Math.PI / 2), (lat * Math.PI) / 180]
}

export function Globe({
  className = '',
  config = {},
  focusLocation = [0, 0] as [number, number],
  onDragStateChange,
}: {
  className?: string
  config?: Partial<COBEOptions>
  focusLocation?: [number, number]
  onDragStateChange?: (isDragged: boolean) => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const focusRef = useRef<[number, number]>([0, 0])
  const pointerInteracting = useRef<number | null>(null)
  const pointerInteractionMovement = useRef(0)
  const dragRotation = useRef(0)
  const currentPhiRef = useRef(0)
  const currentThetaRef = useRef(0.3)
  const isDraggedRef = useRef(false)

  // Update focus when focusLocation prop changes and reset interaction state
  useEffect(() => {
    focusRef.current = locationToAngles(focusLocation[0], focusLocation[1])
    // Reset drag rotation when focus location changes
    dragRotation.current = 0
    pointerInteractionMovement.current = 0
  }, [focusLocation])

  useEffect(() => {
    let width = 0
    const doublePi = Math.PI * 2

    const onResize = () => {
      if (canvasRef.current) {
        width = canvasRef.current.offsetWidth
      }
    }
    window.addEventListener('resize', onResize)
    onResize()

    if (canvasRef.current) {
      const globe = createGlobe(canvasRef.current, {
        devicePixelRatio: 2,
        width: width * 2,
        height: width * 2,
        phi: 0,
        theta: 0.3,
        dark: 1,
        diffuse: 1.2,
        mapSamples: 16000,
        mapBrightness: 6,
        baseColor: [0.3, 0.3, 0.3],
        markerColor: [0.1, 0.8, 1],
        glowColor: [1, 1, 1],
        markers: [],
        opacity: 0.9,
        onRender: (state) => {
          // Auto-rotation when not being dragged
          if (!pointerInteracting.current) {
            // Smooth transition to focus location
            const [focusPhi, focusTheta] = focusRef.current
            const distPositive = (focusPhi - currentPhiRef.current + doublePi) % doublePi
            const distNegative = (currentPhiRef.current - focusPhi + doublePi) % doublePi
            // Control the speed
            if (distPositive < distNegative) {
              currentPhiRef.current += distPositive * 0.08
            } else {
              currentPhiRef.current -= distNegative * 0.08
            }
            currentThetaRef.current = currentThetaRef.current * 0.92 + focusTheta * 0.08
          }
          
          // Apply user interaction rotation
          state.phi = currentPhiRef.current + dragRotation.current
          state.theta = currentThetaRef.current
          state.width = width * 2
          state.height = width * 2
        },
        ...config,
      })

      canvasRef.current.style.opacity = '0'
      setTimeout(() => {
        if (canvasRef.current) {
          canvasRef.current.style.opacity = '1'
        }
      }, 0)

      return () => {
        globe.destroy()
        window.removeEventListener('resize', onResize)
      }
    }
  }, [config])

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    pointerInteracting.current = e.clientX - pointerInteractionMovement.current
    if (canvasRef.current) {
      canvasRef.current.style.cursor = 'grabbing'
    }
    
    if (!isDraggedRef.current) {
      isDraggedRef.current = true
      onDragStateChange?.(true)
    }
  }

  const handlePointerUp = () => {
    pointerInteracting.current = null
    if (canvasRef.current) {
      canvasRef.current.style.cursor = 'grab'
    }
    
    if (isDraggedRef.current) {
      isDraggedRef.current = false
      onDragStateChange?.(false)
    }
  }

  const handlePointerOut = () => {
    pointerInteracting.current = null
    if (canvasRef.current) {
      canvasRef.current.style.cursor = 'grab'
    }
    
    if (isDraggedRef.current) {
      isDraggedRef.current = false
      onDragStateChange?.(false)
    }
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (pointerInteracting.current !== null) {
      const delta = e.clientX - pointerInteracting.current
      pointerInteractionMovement.current = delta
      dragRotation.current = delta / 200
    }
  }

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (pointerInteracting.current !== null && e.touches[0]) {
      const delta = e.touches[0].clientX - pointerInteracting.current
      pointerInteractionMovement.current = delta
      dragRotation.current = delta / 100
    }
  }

  return (
    <canvas 
      ref={canvasRef} 
      className={className}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerOut={handlePointerOut}
      onMouseMove={handleMouseMove}
      onTouchMove={handleTouchMove}
      style={{ 
        width: '100%',
        height: '100%',
        maxWidth: '100%',
        aspectRatio: '1',
        cursor: 'grab',
        opacity: 0,
        transition: 'opacity 1s ease',
      }} 
    />
  )
}
