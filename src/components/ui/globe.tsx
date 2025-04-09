import { useEffect, useRef } from 'react'
import createGlobe, { type COBEOptions } from 'cobe'

const locationToAngles = (lat: number, long: number): [number, number] => {
  return [Math.PI - ((long * Math.PI) / 180 - Math.PI / 2), (lat * Math.PI) / 180]
}

export function Globe({
  className = '',
  config = {},
  focusLocation = [0, 0] as [number, number],
}: {
  className?: string
  config?: Partial<COBEOptions>
  focusLocation?: [number, number]
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const focusRef = useRef<[number, number]>([0, 0])

  // Update focus when focusLocation prop changes
  useEffect(() => {
    focusRef.current = locationToAngles(focusLocation[0], focusLocation[1])
  }, [focusLocation])

  useEffect(() => {
    let width = 0
    let currentPhi = 0
    let currentTheta = 0
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
          state.phi = currentPhi
          state.theta = currentTheta
          const [focusPhi, focusTheta] = focusRef.current
          const distPositive = (focusPhi - currentPhi + doublePi) % doublePi
          const distNegative = (currentPhi - focusPhi + doublePi) % doublePi
          // Control the speed
          if (distPositive < distNegative) {
            currentPhi += distPositive * 0.08
          } else {
            currentPhi -= distNegative * 0.08
          }
          currentTheta = currentTheta * 0.92 + focusTheta * 0.08
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

  return (
    <canvas 
      ref={canvasRef} 
      className={className}
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
