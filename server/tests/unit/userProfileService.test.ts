import { describe, it, expect, beforeEach, afterEach } from 'bun:test'
import { UserProfileService } from '../../services/UserProfileService'
import { UserProfileRepo } from '../../repos/UserProfile'

describe('UserProfileService', () => {
  describe('getUserStatusCounts', () => {
    let originalGetUserStatusCounts: typeof UserProfileRepo.getUserStatusCounts

    beforeEach(() => {
      // Store original method
      originalGetUserStatusCounts = UserProfileRepo.getUserStatusCounts
    })

    afterEach(() => {
      // Restore original method
      UserProfileRepo.getUserStatusCounts = originalGetUserStatusCounts
    })

    it('should return status counts with all status types', async () => {
      // Mock the repository to return some test data
      UserProfileRepo.getUserStatusCounts = async () => [
        { online_status: 'online', count: 5 },
        { online_status: 'offline', count: 10 }
      ]

      const result = await UserProfileService.getUserStatusCounts()

      expect(result).toEqual({
        online: 5,
        offline: 10,
        active: 0,
        flowing: 0
      })
    })

    it('should include missing status types with count 0', async () => {
      // Mock the repository to return only one status
      UserProfileRepo.getUserStatusCounts = async () => [
        { online_status: 'online', count: 3 }
      ]

      const result = await UserProfileService.getUserStatusCounts()

      expect(Object.keys(result)).toHaveLength(4)
      expect(result).toEqual({
        online: 3,
        offline: 0,
        active: 0,
        flowing: 0
      })
    })

    it('should handle empty repository response', async () => {
      // Mock the repository to return empty array
      UserProfileRepo.getUserStatusCounts = async () => []

      const result = await UserProfileService.getUserStatusCounts()

      expect(result).toEqual({
        online: 0,
        offline: 0,
        active: 0,
        flowing: 0
      })
    })

    it('should preserve existing counts and add missing ones', async () => {
      // Mock the repository to return partial data
      UserProfileRepo.getUserStatusCounts = async () => [
        { online_status: 'flowing', count: 2 },
        { online_status: 'online', count: 8 }
      ]

      const result = await UserProfileService.getUserStatusCounts()

      expect(result).toEqual({
        online: 8,
        offline: 0,
        active: 0,
        flowing: 2
      })
    })

    it('should propagate repository errors', async () => {
      // Mock console.error to suppress noisy error logs during tests
      const originalConsoleError = console.error
      console.error = () => {} // Suppress error logs

      try {
        // Mock the repository to throw an error
        UserProfileRepo.getUserStatusCounts = async () => {
          throw new Error('Database connection failed')
        }

        await expect(UserProfileService.getUserStatusCounts()).rejects.toThrow('Database connection failed')
      } finally {
        // Restore original console.error
        console.error = originalConsoleError
      }
    })

    it('should return results with all expected status types', async () => {
      // Mock the repository to return data for all statuses
      UserProfileRepo.getUserStatusCounts = async () => [
        { online_status: 'flowing', count: 1 },
        { online_status: 'active', count: 2 },
        { online_status: 'offline', count: 3 },
        { online_status: 'online', count: 4 }
      ]

      const result = await UserProfileService.getUserStatusCounts()

      // Check that all expected statuses are present
      expect(Object.keys(result).sort()).toEqual(['active', 'flowing', 'offline', 'online'])
      
      expect(result).toEqual({
        online: 4,
        offline: 3,
        active: 2,
        flowing: 1
      })
    })
  })
}) 
