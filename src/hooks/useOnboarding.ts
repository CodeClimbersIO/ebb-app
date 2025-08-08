import { useLocation, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { OnboardingUtils } from '@/lib/utils/onboarding.util'

export const useOnboarding = () => {
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const onboardingCompleted = OnboardingUtils.isOnboardingCompleted()
    if (onboardingCompleted) {
      return
    }
    
    const onboardingStep = OnboardingUtils.getOnboardingStep()
    if (location.pathname === `/onboarding/${onboardingStep}`) {
      return
    }
    
    navigate(`/onboarding/${onboardingStep}`)
  }, [navigate, location.pathname])
}
