import { hasSmartSessionCooldown } from '../smartSessionApi'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { DateTime } from 'luxon'

// Mock global localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
}

// Set up global localStorage mock
Object.defineProperty(global, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
})


// Mock a recent session from 30 minutes ago
const mockSession = {
  id: 'test-session',
  start: DateTime.now().minus({ minutes: 60 }).toISO(),
  end: DateTime.now().minus({ minutes: 30 }).toISO(),
  objective: 'Test objective',
  type: 'manual' as const
}


describe('SmartSessionApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('hasSmartSessionCooldown', () => {
    it('should return undefined when no recent session and no cooldown', async () => {
      // Mock no stored lastSessionCheck
      mockLocalStorage.getItem.mockReturnValue(null)

      const result = await hasSmartSessionCooldown()
      expect(result).toBeFalsy()
    })

    it('should return undefined when cooldown conditions are not met', async () => {
      // Mock stored lastSessionCheck from 20 minutes ago
      const twentyMinutesAgo = DateTime.now().minus({ minutes: 20 }).toISO()
      mockLocalStorage.getItem.mockReturnValue(twentyMinutesAgo)

      const result = await hasSmartSessionCooldown(mockSession)
      expect(result).toBeFalsy()
    })
    it('should handle no local storage item', async () => {
      mockLocalStorage.getItem.mockReturnValue(null)
      const result = await hasSmartSessionCooldown(mockSession)
      expect(result).toBeFalsy()
    })
    it('should return true when cooldown conditions are met', async () => {
      // Mock stored lastSessionCheck from 20 minutes ago
      const thirtyFiveMinutesAgo = DateTime.now().minus({ minutes: 35 }).toISO()
      mockLocalStorage.getItem.mockReturnValue(thirtyFiveMinutesAgo)
      const mockSession = {
        id: 'test-session',
        start: DateTime.now().minus({ minutes: 120 }).toISO(),
        end: DateTime.now().minus({ minutes: 90 }).toISO(),
        objective: 'Test objective',
        type: 'manual' as const
      }

      const result = await hasSmartSessionCooldown(mockSession)
      expect(result).toBe(true)
    })
    it('should return undefined when cooldown conditions are met but last session check is not set', async () => {
      const thirtyFiveMinutesAgo = DateTime.now().minus({ minutes: 35 }).toISO()
      mockLocalStorage.getItem.mockReturnValue(thirtyFiveMinutesAgo)
      const result = await hasSmartSessionCooldown(mockSession)
      expect(result).toBeFalsy()
    })
    it('should return true when cooldown conditions are met and last session check is not set', async () => {
      mockLocalStorage.getItem.mockReturnValue(null)
      const mockSession = {
        id: 'test-session',
        start: DateTime.now().minus({ minutes: 120 }).toISO(),
        end: DateTime.now().minus({ minutes: 90 }).toISO(),
        objective: 'Test objective',
        type: 'manual' as const
      }
      const result = await hasSmartSessionCooldown(mockSession)
      expect(result).toBe(true)
    })
  })
})
