import { describe, it, expect } from 'vitest'
import { getRandomPointInBox } from './location.util'
import { Marker } from 'cobe'

describe('getRandomPointInBox', () => {
  describe('normal cases', () => {
    it('should return a location tuple from the provided box', () => {
      const testBox: Marker[] = [
        { location: [0, 20], size: 0.1 },
        { location: [20, 0], size: 0.1 },
        { location: [20, 20], size: 0.1 },
        { location: [20, 0], size: 0.1 },
      ]

      const [x, y] = getRandomPointInBox(testBox)

      expect(x).toBeGreaterThan(0)
      expect(x).toBeLessThan(20)
      expect(y).toBeGreaterThan(0)
      expect(y).toBeLessThan(20)
    })

  })
}) 
