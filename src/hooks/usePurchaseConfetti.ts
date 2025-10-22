import { useEffect } from 'react'
import confetti from 'canvas-confetti'
import { useLicenseWithDevices } from '@/api/hooks/useLicense'
import { useAuth } from './useAuth'

export const usePurchaseConfetti = () => {
  const { user } = useAuth()
  const { data: licenseData } = useLicenseWithDevices(user?.id || null)

  useEffect(() => {
    const purchaseSuccess = localStorage.getItem('ebb_purchase_success')

    console.log('purchaseSuccess', purchaseSuccess)
    console.log('licenseData', licenseData)

    if (purchaseSuccess === 'true' && licenseData?.license) {
      // Verify the license is actually active
      const hasActiveLicense = licenseData.license.status === 'active'

      if (hasActiveLicense) {
        // Clear the flag first to prevent repeated confetti
        localStorage.removeItem('ebb_purchase_success')

        // Trigger confetti celebration
        const duration = 3000
        const animationEnd = Date.now() + duration

        const runConfetti = () => {
          confetti({
            particleCount: 3,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: ['#FFD700', '#FFA500', '#FF6347']
          })
          confetti({
            particleCount: 3,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: ['#FFD700', '#FFA500', '#FF6347']
          })

          if (Date.now() < animationEnd) {
            requestAnimationFrame(runConfetti)
          }
        }

        runConfetti()
      }
    }
  }, [licenseData])
}
