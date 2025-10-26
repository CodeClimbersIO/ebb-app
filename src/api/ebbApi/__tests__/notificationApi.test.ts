import { describe, it, expect } from 'vitest'
import { NotificationApi } from '@/api/ebbApi/notificationApi'
import { License } from '@/api/ebbApi/licenseApi'
import { DateTime } from 'luxon'

describe('NotificationApi', () => {
  describe('getLicenseExpirationNotification', () => {
    const currentDate = DateTime.fromISO('2024-01-15T12:00:00.000Z')

    const createLicense = (
      licenseType: 'perpetual' | 'subscription' | 'free_trial',
      expirationDate: Date
    ): License => ({
      id: '123',
      userId: '456',
      status: 'active',
      licenseType,
      purchaseDate: new Date(),
      expirationDate,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    describe('perpetual licenses', () => {
      it('should return null for perpetual licenses', () => {
        const license = createLicense('perpetual', new Date('2024-01-20'))
        const result = NotificationApi.getLicenseExpirationNotification(license, currentDate)
        expect(result).toBeNull()
      })
    })

    describe('free trial licenses', () => {
      it('should return trial_expired notification when trial has expired', () => {
        const license = createLicense('free_trial', new Date('2024-01-14T12:00:00.000Z'))
        const result = NotificationApi.getLicenseExpirationNotification(license, currentDate)

        expect(result).toEqual({
          sentId: 'trial_expired',
          content: 'Your free trial has ended. Upgrade to Ebb Pro to continue.',
          subType: 'warning',
        })
      })

      it('should return trial_expired notification when trial expired exactly at current time', () => {
        const license = createLicense('free_trial', new Date('2024-01-15T12:00:00.000Z'))
        const result = NotificationApi.getLicenseExpirationNotification(license, currentDate)

        expect(result).toEqual({
          sentId: 'trial_expired',
          content: 'Your free trial has ended. Upgrade to Ebb Pro to continue.',
          subType: 'warning',
        })
      })

      it('should return trial_expiring_3_days notification when trial expires in 3 days', () => {
        const license = createLicense('free_trial', new Date('2024-01-18T12:00:00.000Z'))
        const result = NotificationApi.getLicenseExpirationNotification(license, currentDate)

        expect(result).toEqual({
          sentId: 'trial_expiring_3_days',
          content: 'Your free trial ends in 3 days. Upgrade to keep your pro features.',
          subType: 'info',
        })
      })

      it('should return trial_expiring_3_days notification when trial expires in 1 day', () => {
        const license = createLicense('free_trial', new Date('2024-01-16T12:00:00.000Z'))
        const result = NotificationApi.getLicenseExpirationNotification(license, currentDate)

        expect(result).toEqual({
          sentId: 'trial_expiring_3_days',
          content: 'Your free trial ends in 3 days. Upgrade to keep your pro features.',
          subType: 'info',
        })
      })

      it('should return null when trial expires in more than 3 days', () => {
        const license = createLicense('free_trial', new Date('2024-01-19T12:00:00.000Z'))
        const result = NotificationApi.getLicenseExpirationNotification(license, currentDate)

        expect(result).toBeNull()
      })

      it('should return null when trial expires in 10 days', () => {
        const license = createLicense('free_trial', new Date('2024-01-25T12:00:00.000Z'))
        const result = NotificationApi.getLicenseExpirationNotification(license, currentDate)

        expect(result).toBeNull()
      })
    })

    describe('subscription licenses', () => {
      it('should return paid_expired notification when subscription has expired', () => {
        const license = createLicense('subscription', new Date('2024-01-14T12:00:00.000Z'))
        const result = NotificationApi.getLicenseExpirationNotification(license, currentDate)

        expect(result).toEqual({
          sentId: 'paid_expired',
          content: 'Your subscription has expired. Renew to restore your pro features.',
          subType: 'warning',
        })
      })

      it('should return paid_expired notification when subscription expired exactly at current time', () => {
        const license = createLicense('subscription', new Date('2024-01-15T12:00:00.000Z'))
        const result = NotificationApi.getLicenseExpirationNotification(license, currentDate)

        expect(result).toEqual({
          sentId: 'paid_expired',
          content: 'Your subscription has expired. Renew to restore your pro features.',
          subType: 'warning',
        })
      })

      it('should return paid_expiring_3_days notification when subscription expires in 3 days', () => {
        const license = createLicense('subscription', new Date('2024-01-18T12:00:00.000Z'))
        const result = NotificationApi.getLicenseExpirationNotification(license, currentDate)

        expect(result).toEqual({
          sentId: 'paid_expiring_3_days',
          content: 'Your subscription expires in 3 days. Renew to keep your access.',
          subType: 'info',
        })
      })

      it('should return paid_expiring_3_days notification when subscription expires in 1 day', () => {
        const license = createLicense('subscription', new Date('2024-01-16T12:00:00.000Z'))
        const result = NotificationApi.getLicenseExpirationNotification(license, currentDate)

        expect(result).toEqual({
          sentId: 'paid_expiring_3_days',
          content: 'Your subscription expires in 3 days. Renew to keep your access.',
          subType: 'info',
        })
      })

      it('should return null when subscription expires in more than 3 days', () => {
        const license = createLicense('subscription', new Date('2024-01-19T12:00:00.000Z'))
        const result = NotificationApi.getLicenseExpirationNotification(license, currentDate)

        expect(result).toBeNull()
      })

      it('should return null when subscription expires in 30 days', () => {
        const license = createLicense('subscription', new Date('2024-02-14T12:00:00.000Z'))
        const result = NotificationApi.getLicenseExpirationNotification(license, currentDate)

        expect(result).toBeNull()
      })
    })
  })
})
