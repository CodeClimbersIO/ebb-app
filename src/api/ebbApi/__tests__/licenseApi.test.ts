import { describe, it, expect } from 'vitest'
import { licenseApi } from '@/api/ebbApi/licenseApi'

describe('licenseApi', () => {
  describe('calculatePermissions', () => {
    it('should return null if the license is null', () => {
      const permissions = licenseApi.calculatePermissions(null)
      expect(permissions).toBeNull()
    })
    it('should return hasProAccess is false if the license is expired', () => {
      const permissions = licenseApi.calculatePermissions({
        id: '123',
        userId: '123',
        status: 'expired',
        licenseType: 'perpetual',
        purchaseDate: new Date(),
        expirationDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      expect(permissions?.hasProAccess).toBe(false)
    })
    it('should return hasProAccess is true if the license is active', () => {
      const permissions = licenseApi.calculatePermissions({
        id: '123',
        userId: '123',
        status: 'active',
        licenseType: 'perpetual',
        purchaseDate: new Date(),
        expirationDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      expect(permissions?.hasProAccess).toBe(true)
    })
    it('should return hasProAccess is true if the license is a free trial and not expired', () => {
      const permissions = licenseApi.calculatePermissions({
        id: '123',
        userId: '123',
        status: 'active',
        licenseType: 'free_trial',
        purchaseDate: new Date(),
        expirationDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      expect(permissions?.hasProAccess).toBe(true)
    })
    it('should return hasProAccess is false if the license is a free trial and expired', () => {
      const permissions = licenseApi.calculatePermissions({
        id: '123',
        userId: '123',
        status: 'active',
        licenseType: 'free_trial',
        purchaseDate: new Date(),
        expirationDate: new Date(Date.now() - (1000 * 60 * 60 * 24 * 30)),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      expect(permissions?.hasProAccess).toBe(false)
    })  
  })
})
